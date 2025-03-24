import WebSocket from 'ws';
import { Server } from 'http';
import axios from 'axios';
import { AssetModel } from '../models/Asset';

interface MarketUpdate {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
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

// Cache for historical data
const historyCache = new Map<
  string,
  {
    period: string;
    data: CandleData[];
    lastFetched: number;
  }
>();

const HISTORICAL_CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes

export async function initWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });
  const assets = await AssetModel.find();
  const symbols = assets?.map((asset) => `${asset.symbol.toUpperCase()}-USD`);
  const clients = new Set<WebSocket>();

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

      let chartData: CandleData[] = [];
      const cacheKey = `${symbol}-24h`;
      const cachedHistory = historyCache.get(cacheKey);
      const now = Date.now();

      if (
        cachedHistory &&
        now - cachedHistory.lastFetched < HISTORICAL_CACHE_EXPIRATION
      ) {
        chartData = cachedHistory.data;
        console.log(
          `Using cached historical data for ${symbol}, age: ${
            (now - cachedHistory.lastFetched) / 1000
          }s`,
        );
      } else {
        console.log(`Fetching fresh historical data for ${symbol}`);
        chartData = await fetchHistoricalDataFromCoinbase(symbol, '24h');
        historyCache.set(cacheKey, {
          period: '24h',
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

      latestUpdates.set(symbol, update);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
          client.send(
            JSON.stringify({
              type: 'market-update',
              data: [update],
            }),
          );
      });
    }
  });

  coinbaseWs.on('error', (error) => {
    console.error('Coinbase WebSocket error:', error);
  });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    clients.add(ws);

    if (latestUpdates.size > 0) {
      const updates = Array.from(latestUpdates.values());
      ws.send(
        JSON.stringify({
          type: 'market-update',
          data: updates,
        }),
      );
    }

    ws.on('message', async (messageData) => {
      try {
        const message = JSON.parse(messageData.toString());

        if (message.type === 'timeframe-change') {
          const { symbol, period } = message;
          if (!symbol || !period) {
            console.error(
              'Missing symbol or period in timeframe-change message',
            );
            return;
          }

          const cacheKey = `${symbol}-${period}`;
          const cachedHistory = historyCache.get(cacheKey);
          const now = Date.now();
          let chartData: CandleData[];

          if (
            cachedHistory &&
            now - cachedHistory.lastFetched < HISTORICAL_CACHE_EXPIRATION
          ) {
            chartData = cachedHistory.data;
            console.log(
              `Using cached historical data for ${symbol} (${period}), age: ${
                (now - cachedHistory.lastFetched) / 1000
              }s`,
            );
          } else {
            console.log(
              `Fetching fresh historical data for ${symbol} (${period})`,
            );
            chartData = await fetchHistoricalDataFromCoinbase(symbol, period);

            historyCache.set(cacheKey, {
              period,
              data: chartData,
              lastFetched: now,
            });
          }

          ws.send(
            JSON.stringify({
              type: 'chart-update',
              data: {
                symbol,
                period,
                chartData,
              },
            }),
          );
        }

        if (message.type === 'select-asset') {
          const { symbol } = message;

          if (!symbol) {
            console.error('Missing symbol in select-asset message');
            return;
          }

          const marketData = latestUpdates.get(symbol);
          if (!marketData) {
            console.error(`No market data available for ${symbol}`);
            return;
          }

          ws.send(
            JSON.stringify({
              type: 'asset-details',
              data: {
                symbol,
                marketData,
              },
            }),
          );
        }
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket server');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  process.on('SIGINT', () => {
    coinbaseWs.close();
    wss.close();
    console.log('WebSocket server closed');
    process.exit(0);
  });
}

async function fetchHistoricalDataFromCoinbase(
  symbol: string,
  period: string = '24h',
): Promise<CandleData[]> {
  let granularity: number;
  let timeRange: number;

  switch (period) {
    case '7d':
      granularity = 21600;
      timeRange = 7 * 24 * 60 * 60;
      break;
    case '1m':
      granularity = 86400;
      timeRange = 30 * 24 * 60 * 60;
      break;
    case '3m':
      granularity = 86400;
      timeRange = 90 * 24 * 60 * 60;
      break;
    case '6m':
      granularity = 86400;
      timeRange = 180 * 24 * 60 * 60;
      break;
    case '1y':
      granularity = 86400;
      timeRange = 300 * 86400;
      break;
    case '24h':
    default:
      granularity = 3600;
      timeRange = 24 * 60 * 60;
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - timeRange;
  try {
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

    return response.data
      .map((candle: number[]) => ({
        timestamp: candle[0] * 1000,
        low: candle[1],
        high: candle[2],
        open: candle[3],
        close: candle[4],
        volume: candle[5],
      }))
      .reverse();
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}
