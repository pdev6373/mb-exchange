import WebSocket from 'ws';
import { Server } from 'http';
import axios from 'axios';

interface MarketUpdate {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  chartData: CandleData[];
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// In-memory cache for historical data
const historyCache = new Map<
  string,
  {
    data: CandleData[];
    lastFetched: number;
  }
>();

// Cache expiration time for historical data (24 hours)
const HISTORICAL_CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

export function initWebSocketServer(server: Server): void {
  const wss = new WebSocket.Server({ server });
  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'USDT-USD'];
  const clients = new Set<WebSocket>();

  // Store latest updates for each symbol
  const latestUpdates = new Map<string, MarketUpdate>();

  const coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

  coinbaseWs.on('open', () => {
    console.log('Connected to Coinbase WebSocket API');

    const subscribeMessage = {
      type: 'subscribe',
      product_ids: symbols,
      channels: ['ticker'],
    };
    coinbaseWs.send(JSON.stringify(subscribeMessage));
  });

  coinbaseWs.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'ticker') {
      const symbol = message.product_id;
      const price = parseFloat(message.price);
      const open24h = parseFloat(message.open_24h);
      const volume24h = parseFloat(message.volume_24h);

      const change24h = price - open24h;
      const changePercent24h = (
        Math.round((change24h / open24h) * 100 * 100) / 100
      ).toFixed(2);

      console.log('aa', changePercent24h);

      // Get historical data with caching
      let chartData: CandleData[] = [];

      // Check cache first
      const cachedHistory = historyCache.get(symbol);
      const now = Date.now();

      if (
        cachedHistory &&
        now - cachedHistory.lastFetched < HISTORICAL_CACHE_EXPIRATION
      ) {
        // Use cached data if it's fresh
        chartData = cachedHistory.data;
        console.log(
          `Using cached historical data for ${symbol}, age: ${
            (now - cachedHistory.lastFetched) / 1000
          }s`,
        );
      } else {
        // Fetch new data if cache is expired or missing
        console.log(`Fetching fresh historical data for ${symbol}`);
        chartData = await fetchHistoricalDataFromCoinbase(symbol);

        // Update the cache
        historyCache.set(symbol, {
          data: chartData,
          lastFetched: now,
        });
      }

      const update: MarketUpdate = {
        symbol,
        price,
        change24h,
        changePercent24h: parseFloat(changePercent24h),
        volume24h,
        chartData,
      };

      // Store this update
      latestUpdates.set(symbol, update);

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: 'market-update',
              data: [update],
            }),
          );
        }
      });
    }
  });

  coinbaseWs.on('error', (error) => {
    console.error('Coinbase WebSocket error:', error);
  });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    clients.add(ws);

    // Send all latest updates to the new client immediately
    if (latestUpdates.size > 0) {
      const updates = Array.from(latestUpdates.values());
      ws.send(
        JSON.stringify({
          type: 'market-update',
          data: updates,
        }),
      );
    }

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket server');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Periodically refresh historical data in the background
  setInterval(() => {
    symbols.forEach(async (symbol) => {
      const cachedHistory = historyCache.get(symbol);
      const now = Date.now();

      // Refresh only if cache is expired or missing
      if (
        !cachedHistory ||
        now - cachedHistory.lastFetched >= HISTORICAL_CACHE_EXPIRATION
      ) {
        console.log(`Background refresh of historical data for ${symbol}`);
        const chartData = await fetchHistoricalDataFromCoinbase(symbol);
        historyCache.set(symbol, {
          data: chartData,
          lastFetched: now,
        });

        // If we have a latest price update, update its chart data
        const latest = latestUpdates.get(symbol);
        if (latest) {
          latest.chartData = chartData;
        }
      }
    });
  }, 60 * 60 * 1000); // Refresh every hour (adjust as needed)

  process.on('SIGINT', () => {
    coinbaseWs.close();
    wss.close();
    console.log('WebSocket server closed');
    process.exit(0);
  });
}

async function fetchHistoricalDataFromCoinbase(
  symbol: string,
): Promise<CandleData[]> {
  const granularity = 21600;
  const end = Math.floor(Date.now() / 1000);
  const start = end - 24 * 60 * 60;

  const response = await axios.get(
    `https://api.exchange.coinbase.com/products/${symbol}/candles`,
    {
      params: {
        granularity,
        start,
        end,
      },
    },
  );

  return response.data.map((candle: number[]) => ({
    timestamp: candle[0] * 1000,
    low: candle[1],
    high: candle[2],
    open: candle[3],
    close: candle[4],
    volume: candle[5],
  }));
}
