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

    if (message.type === 'ticker') {
      const symbol = message.product_id;
      const price = parseFloat(message.price);
      const open24h = parseFloat(message.open_24h);
      const volume24h = parseFloat(message.volume_24h);

      const change24h = price - open24h;
      const changePercent24h = ((change24h / open24h) * 100).toFixed(2);

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
  try {
    const granularity = 3600;
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
      open: candle[3],
      high: candle[2],
      low: candle[1],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    console.error('Error fetching historical data from Coinbase:', error);
    return [];
  }
}
