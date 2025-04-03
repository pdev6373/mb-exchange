import WebSocket from 'ws';
import { Server } from 'http';
import axios from 'axios';
import { AssetModel } from '../models/Asset';
import Bottleneck from 'bottleneck';
import mongoose from 'mongoose';

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

interface PriceCache {
  price: number;
  timestamp: number;
  update?: MarketUpdate;
}

interface HistoryCache {
  period: string;
  data: CandleData[];
  lastFetched: number;
}

class MarketDataService {
  private static instance: MarketDataService;
  private priceCache = new Map<string, PriceCache>();
  private historyCache = new Map<string, HistoryCache>();
  private activeSymbols = new Set<string>();
  private coinbaseWs: WebSocket | null = null;
  private clients = new Set<WebSocket>();
  private changeStream: ReturnType<
    typeof mongoose.Model.prototype.watch
  > | null = null;
  private isConnected = false;
  private fetchPromises = new Map<string, Promise<number | null>>();
  private marketDataPromises = new Map<string, Promise<MarketUpdate | null>>();

  private PRICE_CACHE_DURATION = 5000;
  private HISTORY_CACHE_DURATION = 5 * 60 * 1000;
  private FALLBACK_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes as fallback
  private PING_INTERVAL = 30000; // 30 seconds for ping
  private rateLimitedFetch: <T>(fn: () => Promise<T>) => Promise<T>;
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    const limiter = new Bottleneck({
      maxConcurrent: 3, // Limit to 3 concurrent tasks
      minTime: 333, // Minimum time between tasks (roughly 3 requests per second)
    });
    this.rateLimitedFetch = <T>(fn: () => Promise<T>) =>
      limiter.schedule(() => fn());
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance)
      MarketDataService.instance = new MarketDataService();
    return MarketDataService.instance;
  }

  public async fetchLatestPrice(symbol: string): Promise<number | null> {
    const now = Date.now();
    const cachedPrice = this.priceCache.get(symbol);

    // Return cached price if valid
    if (
      cachedPrice &&
      now - cachedPrice.timestamp < this.PRICE_CACHE_DURATION
    ) {
      return cachedPrice.price;
    }

    // Check if there's already a request in progress for this symbol
    let fetchPromise = this.fetchPromises.get(symbol);

    if (!fetchPromise) {
      // Create new fetch promise if none exists
      fetchPromise = this.createPriceFetchPromise(symbol, now);
      this.fetchPromises.set(symbol, fetchPromise);

      // Clean up the promise reference when done
      fetchPromise.finally(() => {
        if (this.fetchPromises.get(symbol) === fetchPromise) {
          this.fetchPromises.delete(symbol);
        }
      });
    }

    return fetchPromise;
  }

  private async createPriceFetchPromise(
    symbol: string,
    now: number,
  ): Promise<number | null> {
    const cachedPrice = this.priceCache.get(symbol);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const price = await this.rateLimitedFetch(async () => {
        const response = await axios.get(
          `https://api.exchange.coinbase.com/products/${symbol}/ticker`,
          { signal: controller.signal },
        );
        return parseFloat(response.data.price);
      });

      clearTimeout(timeoutId);

      // Update cache atomically
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

    // Return cached market data if valid
    if (
      cachedData?.update &&
      now - cachedData.timestamp < this.PRICE_CACHE_DURATION
    ) {
      return cachedData.update;
    }

    // Check if there's already a request in progress for this symbol
    let marketDataPromise = this.marketDataPromises.get(symbol);

    if (!marketDataPromise) {
      // Create new fetch promise if none exists
      marketDataPromise = this.createMarketDataFetchPromise(symbol, now);
      this.marketDataPromises.set(symbol, marketDataPromise);

      // Clean up the promise reference when done
      marketDataPromise.finally(() => {
        if (this.marketDataPromises.get(symbol) === marketDataPromise) {
          this.marketDataPromises.delete(symbol);
        }
      });
    }

    return marketDataPromise;
  }

  private async createMarketDataFetchPromise(
    symbol: string,
    now: number,
  ): Promise<MarketUpdate | null> {
    const cachedData = this.priceCache.get(symbol);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Execute these requests in parallel
      const [priceResult, statsResponse, chartData] = await Promise.all([
        this.fetchLatestPrice(symbol),
        this.rateLimitedFetch(() =>
          axios.get(
            `https://api.exchange.coinbase.com/products/${symbol}/stats`,
            {
              signal: controller.signal,
            },
          ),
        ),
        this.fetchHistoricalData(symbol, '24h'),
      ]);

      clearTimeout(timeoutId);

      if (priceResult === null) {
        if (cachedData?.update) {
          // Return cached update if we couldn't get fresh price
          return { ...cachedData.update };
        }
        return null;
      }

      const open24h = statsResponse?.data?.open
        ? parseFloat(statsResponse.data.open)
        : cachedData?.update?.price || priceResult;
      const volume24h = statsResponse?.data?.volume
        ? parseFloat(statsResponse.data.volume)
        : 0;

      const change24h = priceResult - open24h;
      const changePercent24h =
        open24h !== 0 ? Number(((change24h / open24h) * 100).toFixed(2)) : 0;

      // Create update object without circular references
      const update: MarketUpdate = {
        symbol,
        price: priceResult,
        change24h,
        changePercent24h,
        volume24h,
        chartData: [...chartData], // Create a copy to avoid reference issues
      };

      // Atomically update the cache with the new data
      this.priceCache.set(symbol, {
        price: priceResult,
        timestamp: now,
        update,
      });

      return update;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);

      // Return cached data if available
      if (cachedData?.update) {
        return { ...cachedData.update };
      }
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
    ) {
      return [...cachedHistory.data]; // Return a copy to prevent reference issues
    }

    try {
      const { granularity, timeRange } = this.getHistoricalParams(period);
      const end = Math.floor(now / 1000);
      const start = end - timeRange;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await this.rateLimitedFetch(() =>
        axios.get(
          `https://api.exchange.coinbase.com/products/${symbol}/candles`,
          {
            params: { granularity, start, end },
            signal: controller.signal,
          },
        ),
      );

      clearTimeout(timeoutId);

      if (!response.data || response.data.length === 0) {
        return cachedHistory?.data ? [...cachedHistory.data] : [];
      }

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

      return [...chartData]; // Return a copy to prevent reference issues
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return cachedHistory?.data ? [...cachedHistory.data] : [];
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

  public registerClient(ws: WebSocket): void {
    this.clients.add(ws);
    ws.on('close', () => {
      console.log('Client disconnected');
      this.clients.delete(ws);
    });

    // Set up ping/pong for this client
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
    (ws as any).isAlive = true;
  }

  private startPingInterval(): void {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Set up new ping interval
    this.pingInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if ((ws as any).isAlive === false) {
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        (ws as any).isAlive = false;
        ws.ping();
      });
    }, this.PING_INTERVAL);
  }

  private async setupChangeStream(): Promise<void> {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.warn('MongoDB connection not ready for change streams');
        return;
      }

      // Close any existing change stream
      if (this.changeStream) {
        await this.changeStream.close();
        this.changeStream = null;
      }

      // Set up change stream to watch the assets collection
      this.changeStream = AssetModel.watch();

      console.log('Change stream initialized for assets collection');

      this.changeStream.on('change', async (change: any) => {
        console.log('Asset change detected:', change.operationType);

        // Refresh the entire list on any change
        await this.refreshAssets();
      });

      this.changeStream.on('error', async (error: any) => {
        console.error('Change stream error:', error);

        // If we lose the change stream, try to reconnect after a delay
        if (this.changeStream) {
          await this.changeStream
            .close()
            .catch((e: any) =>
              console.error('Error closing change stream:', e),
            );
          this.changeStream = null;
        }

        setTimeout(() => this.setupChangeStream(), 5000);
      });
    } catch (error) {
      console.error('Failed to set up change stream:', error);
      console.log('Falling back to periodic refresh');

      // If change streams aren't supported, fall back to periodic checking
      setInterval(async () => {
        await this.refreshAssets();
      }, this.FALLBACK_REFRESH_INTERVAL);
    }
  }

  public async refreshAssets(): Promise<string[]> {
    try {
      console.log('Refreshing asset list');
      const assets = await AssetModel.find();
      const symbols = assets?.map(
        (asset) => `${asset.symbol.toUpperCase()}-USD`,
      );

      // Use Set operations for efficient comparisons
      const symbolsSet = new Set(symbols);
      const newSymbols = symbols.filter(
        (symbol) => !this.activeSymbols.has(symbol),
      );
      const removedSymbols = Array.from(this.activeSymbols).filter(
        (symbol) => !symbolsSet.has(symbol),
      );

      if (newSymbols.length > 0 || removedSymbols.length > 0) {
        console.log(
          `Asset updates: +${newSymbols.length} -${removedSymbols.length}`,
        );

        if (newSymbols.length > 0) {
          console.log('New symbols:', newSymbols);
        }

        this.updateActiveSymbols(symbols);

        // Fetch data for new assets and broadcast to clients
        if (newSymbols.length > 0 && this.isConnected) {
          await this.fetchAndBroadcastNewAssets(newSymbols);
        }
      }

      return symbols;
    } catch (error) {
      console.error('Error refreshing assets:', error);
      return Array.from(this.activeSymbols);
    }
  }

  private async fetchAndBroadcastNewAssets(
    newSymbols: string[],
  ): Promise<void> {
    try {
      // Use Promise.allSettled to fetch data for all symbols in parallel
      const results = await Promise.allSettled(
        newSymbols.map((symbol) => this.fetchMarketData(symbol)),
      );

      // Filter out successful results and failed ones
      const updates: MarketUpdate[] = results
        .filter(
          (result): result is PromiseFulfilledResult<MarketUpdate> =>
            result.status === 'fulfilled' && result.value !== null,
        )
        .map((result) => result.value);

      if (updates.length > 0) {
        this.broadcastUpdates(updates);
      }
    } catch (error) {
      console.error('Error in fetchAndBroadcastNewAssets:', error);
    }
  }

  private broadcastUpdates(updates: MarketUpdate[]): void {
    if (updates.length === 0) return;

    const message = JSON.stringify({
      type: 'market-update',
      data: updates,
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private updateActiveSymbols(symbols: string[]): void {
    // Update the set of active symbols
    this.activeSymbols.clear();
    symbols.forEach((symbol) => this.activeSymbols.add(symbol));

    // Resubscribe to WebSocket if it's active
    if (this.coinbaseWs && this.coinbaseWs.readyState === WebSocket.OPEN) {
      this.subscribeToSymbols();
    }
  }

  private subscribeToSymbols(): void {
    if (!this.coinbaseWs || this.coinbaseWs.readyState !== WebSocket.OPEN)
      return;

    const symbols = Array.from(this.activeSymbols);
    this.coinbaseWs.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: symbols,
        channels: ['ticker'],
      }),
    );
    console.log(`Subscribed to ${symbols.length} symbols`);
  }

  public async startWebSocketConnection(): Promise<void> {
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;

    // Start the ping interval for client connections
    this.startPingInterval();

    // Initial asset load
    await this.refreshAssets();

    // Set up database change monitoring
    await this.setupChangeStream();

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

    const establishConnection = async () => {
      // Clean up existing connection
      if (this.coinbaseWs) {
        // Remove all listeners to prevent memory leaks
        this.coinbaseWs.removeAllListeners();
        this.coinbaseWs.close();
        this.coinbaseWs = null;
      }

      // Create new connection
      this.coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      this.coinbaseWs.on('open', () => {
        console.log('Connected to Coinbase WebSocket');
        reconnectAttempts = 0;
        this.isConnected = true;
        this.subscribeToSymbols();
      });

      // Implement ping/pong with the Coinbase WebSocket
      let lastPong = Date.now();
      const pingTimer = setInterval(() => {
        if (this.coinbaseWs?.readyState !== WebSocket.OPEN) {
          clearInterval(pingTimer);
          return;
        }

        // If no pong received for 2x ping interval, consider connection dead
        if (Date.now() - lastPong > this.PING_INTERVAL * 2) {
          console.log('No pong received, reconnecting...');
          clearInterval(pingTimer);
          if (this.coinbaseWs) {
            this.coinbaseWs.terminate();
          }
          return;
        }

        this.coinbaseWs.ping();
      }, this.PING_INTERVAL);

      this.coinbaseWs.on('pong', () => {
        lastPong = Date.now();
      });

      this.coinbaseWs.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ticker') {
            const symbol = message.product_id;

            if (this.activeSymbols.has(symbol)) {
              const update = await this.fetchMarketData(symbol);

              if (update) {
                this.broadcastUpdates([update]);
              }
            }
          }
        } catch (error) {
          console.error('WebSocket message processing error:', error);
        }
      });

      this.coinbaseWs.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        clearInterval(pingTimer);
        reconnect();
      });

      this.coinbaseWs.on('close', (code, reason) => {
        console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
        this.isConnected = false;
        clearInterval(pingTimer);
        reconnect();
      });
    };

    // Initial connection
    establishConnection();
  }

  public async fetchInitialMarketData(): Promise<MarketUpdate[]> {
    const symbols = Array.from(this.activeSymbols);

    console.log(`Fetching initial market data for ${symbols.length} symbols`);

    // Use Promise.allSettled to fetch data for all symbols in parallel
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // Actually use the controller in the fetch operation
          const marketData = await this.fetchMarketData(symbol);

          clearTimeout(timeoutId);
          return marketData;
        } catch (error) {
          console.error(`Initial data fetch failed for ${symbol}:`, error);
          return null;
        }
      }),
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<MarketUpdate> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => result.value);
  }

  // Clean up resources
  public shutdown(): void {
    // Close WebSocket connections
    if (this.coinbaseWs) {
      this.coinbaseWs.removeAllListeners();
      this.coinbaseWs.close();
      this.coinbaseWs = null;
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.terminate();
    });
    this.clients.clear();

    // Close change stream
    if (this.changeStream) {
      this.changeStream
        .close()
        .catch((e: any) => console.error('Error closing change stream:', e));
      this.changeStream = null;
    }

    // Clear intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    console.log('MarketDataService shut down');
  }
}

export async function initWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });
  const marketDataService = MarketDataService.getInstance();

  // Initialize WebSocket service and connections
  await marketDataService.startWebSocketConnection();

  wss.on('connection', async (ws) => {
    console.log('Client connected');
    marketDataService.registerClient(ws);

    try {
      const marketUpdates = await marketDataService.fetchInitialMarketData();
      if (marketUpdates.length > 0) {
        ws.send(
          JSON.stringify({
            type: 'market-update',
            data: marketUpdates,
          }),
        );
      }

      ws.on('message', async (messageData) => {
        try {
          const message = JSON.parse(messageData.toString());
          if (message.type === 'timeframe-change') {
            const { symbol, period } = message;
            const chartData = await marketDataService.fetchHistoricalData(
              symbol,
              period,
            );

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'chart-update',
                  data: { symbol, period, chartData },
                }),
              );
            }
          }
        } catch (error) {
          console.error('Client message error:', error);
        }
      });
    } catch (error) {
      console.error('Connection setup error:', error);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down WebSocket server');
    wss.close();
    marketDataService.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return wss;
}

export default MarketDataService;
