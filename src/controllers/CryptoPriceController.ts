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

export function initWebSocketServer(server: Server): void {
  const wss = new WebSocket.Server({ server });

  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'USDT-USD'];

  const clients = new Set<WebSocket>();

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

    if (message.type === 'subscriptions')
      console.log('Subscription confirmed:', JSON.stringify(message));
    else if (message.type === 'error')
      console.error('Coinbase subscription error:', message);
    else if (message.type === 'ticker') {
      const symbol = message.product_id;
      const price = parseFloat(message.price);
      const open24h = parseFloat(message.open_24h);
      const volume24h = parseFloat(message.volume_24h);

      const change24h = price - open24h;
      const changePercent24h = ((change24h / open24h) * 100).toFixed(2);
      console.log(
        `Received ticker for ${message.product_id}: ${message.price}`,
      );

      const chartData = await fetchHistoricalDataFromCoinbase(symbol);
      const update: MarketUpdate = {
        symbol,
        price,
        change24h,
        changePercent24h: parseFloat(changePercent24h),
        volume24h,
        chartData,
      };

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
): Promise<CandleData[]> {
  const granularity = 3600; // 1 hour candles
  const end = Math.floor(Date.now() / 1000);
  const start = end - 24 * 60 * 60; // Last 24 hours

  console.log(
    `Fetching historical data for ${symbol}, start: ${new Date(
      start * 1000,
    ).toISOString()}, end: ${new Date(end * 1000).toISOString()}`,
  );

  const response = await axios.get(
    `https://api.exchange.coinbase.com/products/${symbol}/candles`,
    {
      params: {
        granularity,
        start: new Date(start * 1000).toISOString(),
        end: new Date(end * 1000).toISOString(),
      },
      headers: {
        Accept: 'application/json',
      },
    },
  );

  console.log(`Received ${response.data.length} candles for ${symbol}`);

  // Transform the data as before
  return response.data.map((candle: number[]) => ({
    timestamp: candle[0] * 1000,
    low: candle[1],
    high: candle[2],
    open: candle[3],
    close: candle[4],
    volume: candle[5],
  }));
}
