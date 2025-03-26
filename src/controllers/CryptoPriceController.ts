import WebSocket from 'ws';
import { Server } from 'http';
import axios from 'axios';
import { AssetModel } from '../models/Asset';
import pLimit from 'p-limit';

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

class MarketDataService {
  private static instance: MarketDataService;
  private priceCache = new Map<
    string,
    {
      price: number;
      timestamp: number;
      update: MarketUpdate | undefined;
    }
  >();
  private historyCache = new Map<
    string,
    {
      period: string;
      data: CandleData[];
      lastFetched: number;
    }
  >();

  private PRICE_CACHE_DURATION = 5000;
  private HISTORY_CACHE_DURATION = 5 * 60 * 1000;
  private rateLimitedFetch: (fn: () => Promise<any>) => Promise<any>;

  private constructor() {
    const limit = pLimit(3);
    this.rateLimitedFetch = (fn) => limit(() => fn());
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance)
      MarketDataService.instance = new MarketDataService();
    return MarketDataService.instance;
  }

  public async fetchLatestPrice(symbol: string): Promise<number | null> {
    const now = Date.now();
    const cachedPrice = this.priceCache.get(symbol);

    if (cachedPrice && now - cachedPrice.timestamp < this.PRICE_CACHE_DURATION)
      return cachedPrice.price;

    try {
      const price = await this.rateLimitedFetch(async () => {
        const response = await axios.get(
          `https://api.exchange.coinbase.com/products/${symbol}/ticker`,
        );
        return parseFloat(response.data.price);
      });

      this.priceCache.set(symbol, {
        price,
        timestamp: now,
        update: cachedPrice?.update,
      });

      return price;
    } catch (error) {
      console.error(`Error fetching latest price for ${symbol}:`, error);
      return cachedPrice?.price || null;
    }
  }

  public async fetchMarketData(symbol: string): Promise<MarketUpdate | null> {
    const now = Date.now();
    const cachedData = this.priceCache.get(symbol);

    if (
      cachedData?.update &&
      now - cachedData.timestamp < this.PRICE_CACHE_DURATION
    )
      return cachedData.update;

    try {
      const priceResult = await this.fetchLatestPrice(symbol);
      const statsPromise = this.rateLimitedFetch(() =>
        axios.get(`https://api.exchange.coinbase.com/products/${symbol}/stats`),
      );
      const chartDataPromise = this.fetchHistoricalData(symbol, '24h');

      const [price, statsResponse, chartData] = await Promise.all([
        priceResult,
        statsPromise,
        chartDataPromise,
      ]);

      if (price === null) {
        if (cachedData?.update)
          return {
            symbol: cachedData.update.symbol,
            price: cachedData.update.price,
            change24h: cachedData.update.change24h,
            changePercent24h: cachedData.update.changePercent24h,
            volume24h: cachedData.update.volume24h,
            chartData: cachedData.update.chartData,
          };
        return null;
      }

      const open24h = statsResponse?.data?.open
        ? parseFloat(statsResponse.data.open)
        : cachedData?.update?.price || price;
      const volume24h = statsResponse?.data?.volume
        ? parseFloat(statsResponse.data.volume)
        : 0;

      const change24h = price - open24h;
      const changePercent24h =
        open24h !== 0 ? Number(((change24h / open24h) * 100).toFixed(2)) : 0;

      const update: MarketUpdate = {
        symbol,
        price,
        change24h,
        changePercent24h,
        volume24h,
        chartData,
      };

      this.priceCache.set(symbol, {
        price,
        timestamp: now,
        update,
      });

      return update;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);

      if (cachedData?.update)
        return {
          symbol: cachedData.update.symbol,
          price: cachedData.update.price,
          change24h: cachedData.update.change24h,
          changePercent24h: cachedData.update.changePercent24h,
          volume24h: cachedData.update.volume24h,
          chartData: cachedData.update.chartData,
        };
      return null;
    }
  }

  public async fetchHistoricalData(
    symbol: string,
    period: string = '24h',
  ): Promise<CandleData[]> {
    const now = Date.now();
    const cacheKey = `${symbol}-${period}`;
    const cachedHistory = this.historyCache.get(cacheKey);

    if (
      cachedHistory &&
      now - cachedHistory.lastFetched < this.HISTORY_CACHE_DURATION
    )
      return cachedHistory.data;

    try {
      const { granularity, timeRange } = this.getHistoricalParams(period);
      const end = Math.floor(now / 1000);
      const start = end - timeRange;

      const response = await this.rateLimitedFetch(() =>
        axios.get(
          `https://api.exchange.coinbase.com/products/${symbol}/candles`,
          {
            params: { granularity, start, end },
          },
        ),
      );

      if (!response.data || response.data.length === 0)
        return cachedHistory?.data || [];

      const chartData = response.data
        .map((candle: number[]) => ({
          timestamp: candle[0] * 1000,
          low: candle[1],
          high: candle[2],
          open: candle[3],
          close: candle[4],
          volume: candle[5],
        }))
        .reverse();

      this.historyCache.set(cacheKey, {
        period,
        data: chartData,
        lastFetched: now,
      });

      return chartData;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return cachedHistory?.data || [];
    }
  }

  private getHistoricalParams(period: string): {
    granularity: number;
    timeRange: number;
  } {
    switch (period) {
      case '7d':
        return { granularity: 21600, timeRange: 7 * 24 * 60 * 60 };
      case '1m':
        return { granularity: 86400, timeRange: 30 * 24 * 60 * 60 };
      case '3m':
        return { granularity: 86400, timeRange: 90 * 24 * 60 * 60 };
      case '6m':
        return { granularity: 86400, timeRange: 180 * 24 * 60 * 60 };
      case '1y':
        return { granularity: 86400, timeRange: 300 * 86400 };
      case '24h':
      default:
        return { granularity: 3600, timeRange: 24 * 60 * 60 };
    }
  }
}

export async function initWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });
  const assets = await AssetModel.find();
  const symbols = assets?.map((asset) => `${asset.symbol.toUpperCase()}-USD`);
  const clients = new Set<WebSocket>();

  const marketDataService = MarketDataService.getInstance();

  const fetchInitialMarketData = async () => {
    const initialUpdates: MarketUpdate[] = [];

    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const marketData = await marketDataService.fetchMarketData(symbol);

          clearTimeout(timeoutId);
          return marketData;
        } catch (error) {
          console.error(`Initial data fetch failed for ${symbol}:`, error);
          return null;
        }
      }),
    );

    const validUpdates = results
      .filter(
        (result) => result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => (result as PromiseFulfilledResult<MarketUpdate>).value);

    return validUpdates;
  };

  const connectToCoinbaseWebSocket = async () => {
    let coinbaseWs: WebSocket | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;

    const reconnect = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        return;
      }

      const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
      reconnectAttempts++;
      console.log(`Reconnecting in ${delay}ms (Attempt ${reconnectAttempts})`);
      setTimeout(establishConnection, delay);
    };

    const establishConnection = () => {
      if (coinbaseWs) coinbaseWs.close();
      coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      coinbaseWs.on('open', () => {
        console.log('Connected to Coinbase WebSocket');
        reconnectAttempts = 0;

        coinbaseWs?.send(
          JSON.stringify({
            type: 'subscribe',
            product_ids: symbols,
            channels: ['ticker'],
          }),
        );
      });

      coinbaseWs.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ticker') {
            console.log('message product', message.product);
            console.log('symbols', symbols);
            const symbol = message.product_id;
            const update = await marketDataService.fetchMarketData(symbol);

            if (update)
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
        } catch (error) {
          console.error('WebSocket message processing error:', error);
        }
      });

      coinbaseWs.on('error', (error) => {
        console.error('WebSocket error:', error);
        reconnect();
      });

      coinbaseWs.on('close', (code, reason) => {
        console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
        reconnect();
      });
    };

    const initialUpdates = await fetchInitialMarketData();
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN)
        client.send(
          JSON.stringify({
            type: 'market-update',
            data: initialUpdates,
          }),
        );
    });

    establishConnection();
  };

  wss.on('connection', async (ws) => {
    console.log('Client connected');
    clients.add(ws);

    try {
      const marketUpdates = await fetchInitialMarketData();
      if (marketUpdates.length > 0)
        ws.send(
          JSON.stringify({
            type: 'market-update',
            data: marketUpdates,
          }),
        );

      ws.on('message', async (messageData) => {
        try {
          const message = JSON.parse(messageData.toString());
          if (message.type === 'timeframe-change') {
            const { symbol, period } = message;
            const chartData = await marketDataService.fetchHistoricalData(
              symbol,
              period,
            );

            ws.send(
              JSON.stringify({
                type: 'chart-update',
                data: { symbol, period, chartData },
              }),
            );
          }
        } catch (error) {
          console.error('Client message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
      });
    } catch (error) {
      console.error('Connection setup error:', error);
    }
  });

  await connectToCoinbaseWebSocket();
  process.on('SIGINT', () => {
    wss.close();
    console.log('WebSocket server closed');
    process.exit(0);
  });
}

export default MarketDataService;
