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

const historyCache = new Map<
  string,
  {
    period: string;
    data: CandleData[];
    lastFetched: number;
  }
>();

const HISTORICAL_CACHE_EXPIRATION = 30 * 60 * 1000;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export async function initWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });
  const assets = await AssetModel.find();
  const symbols = assets?.map((asset) => `${asset.symbol.toUpperCase()}-USD`);
  const clients = new Set<WebSocket>();

  const latestUpdates = new Map<string, MarketUpdate>();
  let coinbaseWs: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: NodeJS.Timeout | null = null;

  // New function to fetch initial market data
  const fetchInitialMarketData = async () => {
    try {
      const initialUpdates: MarketUpdate[] = [];

      for (const symbol of symbols) {
        try {
          // Fetch ticker data
          const tickerResponse = await axios.get(
            `https://api.exchange.coinbase.com/products/${symbol}/ticker`,
          );
          const priceData = tickerResponse.data;

          // Fetch 24h stats
          const statsResponse = await axios.get(
            `https://api.exchange.coinbase.com/products/${symbol}/stats`,
          );
          const statsData = statsResponse.data;

          // Fetch historical chart data
          const cacheKey = `${symbol}-24h`;
          const now = Date.now();
          const chartData = await fetchHistoricalDataFromCoinbase(
            symbol,
            '24h',
          );

          const price = parseFloat(priceData.price);
          const open24h = parseFloat(statsData.open);
          const volume24h = parseFloat(statsData.volume);

          const change24h = price - open24h;
          const changePercent24h = (
            Math.round((change24h / open24h) * 100 * 100) / 100
          ).toFixed(2);

          const update: MarketUpdate = {
            symbol,
            price,
            change24h,
            changePercent24h: parseFloat(changePercent24h),
            volume24h,
            chartData,
          };

          initialUpdates.push(update);
          latestUpdates.set(symbol, update);

          // Cache the historical data
          historyCache.set(cacheKey, {
            period: '24h',
            data: chartData,
            lastFetched: now,
          });
        } catch (symbolError) {
          console.error(`Error fetching data for ${symbol}:`, symbolError);
        }
      }

      // Broadcast initial updates to all connected clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
          client.send(
            JSON.stringify({
              type: 'market-update',
              data: initialUpdates,
            }),
          );
      });
    } catch (error) {
      console.error('Error fetching initial market data:', error);
    }
  };

  const connectToCoinbaseWebSocket = async () => {
    // Fetch initial market data before establishing WebSocket connection
    await fetchInitialMarketData();

    // Clear any existing reconnection timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    // Close existing connection if any
    if (coinbaseWs) {
      coinbaseWs.close();
    }

    // Create new WebSocket connection
    coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

    coinbaseWs.on('open', () => {
      console.log('Connected to Coinbase WebSocket API');

      // Reset reconnection attempts on successful connection
      reconnectAttempts = 0;

      const subscribeMessage = {
        type: 'subscribe',
        product_ids: symbols,
        channels: ['ticker'],
      };
      coinbaseWs?.send(JSON.stringify(subscribeMessage));
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
      reconnectWithBackoff();
    });

    coinbaseWs.on('close', (code, reason) => {
      console.log(
        `Coinbase WebSocket closed. Code: ${code}, Reason: ${reason}`,
      );
      reconnectWithBackoff();
    });
  };

  const reconnectWithBackoff = () => {
    // Exponential backoff strategy
    const getReconnectDelay = (attempt: number) => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(
        MAX_RECONNECT_DELAY,
        BASE_RECONNECT_DELAY * Math.pow(2, attempt),
      );
      const jitter = Math.random() * 1000;
      return baseDelay + jitter;
    };

    // Check if max reconnection attempts have been reached
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(
        'Max reconnection attempts reached. Stopping reconnection attempts.',
      );
      return;
    }

    const delay = getReconnectDelay(reconnectAttempts);
    reconnectAttempts++;

    console.log(
      `Attempting to reconnect to Coinbase WebSocket (Attempt ${reconnectAttempts}). Delay: ${delay}ms`,
    );

    // Schedule reconnection
    reconnectTimer = setTimeout(() => {
      connectToCoinbaseWebSocket();
    }, delay);
  };

  // Initial connection with initial data fetch
  await connectToCoinbaseWebSocket();

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

    // Rest of the code remains the same as in the previous implementation
    // (message handling, disconnect handling, etc.)
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
    coinbaseWs?.close();
    wss.close();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    console.log('WebSocket server closed');
    process.exit(0);
  });
}

// The fetchHistoricalDataFromCoinbase function remains the same as in the previous implementation
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
