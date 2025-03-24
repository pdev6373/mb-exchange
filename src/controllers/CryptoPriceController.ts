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

interface AssetDetails {
  symbol: string;
  name: string;
  totalSupply?: number;
  circulatingSupply?: number;
  allTimeHigh?: number;
  allTimeHighDate?: string;
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

// Cache for asset details
const assetDetailsCache = new Map<
  string,
  {
    details: AssetDetails;
    lastFetched: number;
  }
>();

const HISTORICAL_CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes
const ASSET_DETAILS_CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour

export async function initWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });
  const assets = await AssetModel.find();
  const symbols = assets?.map((asset) => `${asset.symbol.toUpperCase()}-USD`);
  const clients = new Set<WebSocket>();

  // Fetch initial asset details
  const assetDetails = await fetchAssetDetails(assets);

  // Store for latest market updates
  const latestUpdates = new Map<string, MarketUpdate>();

  // Connect to Coinbase WebSocket
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
      const baseSymbol = symbol.split('-')[0];
      const price = parseFloat(message.price);
      const open24h = parseFloat(message.open_24h);
      const volume24h = parseFloat(message.volume_24h);

      const change24h = price - open24h;
      const changePercent24h = (
        Math.round((change24h / open24h) * 100 * 100) / 100
      ).toFixed(2);

      // Calculate market cap if we have supply information
      let marketCap = undefined;
      const assetDetail = assetDetails.get(baseSymbol);
      if (assetDetail && assetDetail.circulatingSupply) {
        marketCap = assetDetail.circulatingSupply * price;
      }

      // Get chart data with default 24h period
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
        marketCap,
        chartData,
      };

      latestUpdates.set(symbol, update);

      // Send update to all connected clients
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

    // Send all current market updates to the newly connected client
    if (latestUpdates.size > 0) {
      const updates = Array.from(latestUpdates.values());
      ws.send(
        JSON.stringify({
          type: 'market-update',
          data: updates,
        }),
      );
    }

    // Handle client messages
    ws.on('message', async (messageData) => {
      try {
        const message = JSON.parse(messageData.toString());

        // Handle timeframe selection
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

          // Use cached data if available and not expired
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

          // Send the chart data to the requesting client
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

        // Handle asset detail request
        if (message.type === 'select-asset') {
          const { symbol } = message;

          if (!symbol) {
            console.error('Missing symbol in select-asset message');
            return;
          }

          const baseSymbol = symbol.split('-')[0];
          const marketData = latestUpdates.get(symbol);

          if (!marketData) {
            console.error(`No market data available for ${symbol}`);
            return;
          }

          // Get or fetch asset details
          let details: AssetDetails;
          const cachedDetails = assetDetailsCache.get(baseSymbol);
          const now = Date.now();

          if (
            cachedDetails &&
            now - cachedDetails.lastFetched < ASSET_DETAILS_CACHE_EXPIRATION
          ) {
            details = cachedDetails.details;
            console.log(
              `Using cached asset details for ${baseSymbol}, age: ${
                (now - cachedDetails.lastFetched) / 1000
              }s`,
            );
          } else {
            console.log(`Fetching fresh asset details for ${baseSymbol}`);
            details = await fetchAssetDetailsFromAPI(baseSymbol);

            assetDetailsCache.set(baseSymbol, {
              details,
              lastFetched: now,
            });
          }

          // Send asset details to client
          ws.send(
            JSON.stringify({
              type: 'asset-details',
              data: {
                symbol,
                marketData,
                details,
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

  // Handle server shutdown
  process.on('SIGINT', () => {
    coinbaseWs.close();
    wss.close();
    console.log('WebSocket server closed');
    process.exit(0);
  });

  // Periodic refresh of asset details
  setInterval(async () => {
    try {
      console.log('Refreshing asset details...');
      const updatedAssetDetails = await fetchAssetDetails(assets);

      // Update the assetDetails map with new data
      for (const [symbol, details] of updatedAssetDetails.entries()) {
        assetDetails.set(symbol, details);
      }

      // Update market cap in latest updates
      for (const [symbol, update] of latestUpdates.entries()) {
        const baseSymbol = symbol.split('-')[0];
        const assetDetail = assetDetails.get(baseSymbol);

        if (assetDetail && assetDetail.circulatingSupply) {
          const updatedMarketCap = assetDetail.circulatingSupply * update.price;

          if (update.marketCap !== updatedMarketCap) {
            const updatedUpdate = {
              ...update,
              marketCap: updatedMarketCap,
            };

            latestUpdates.set(symbol, updatedUpdate);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing asset details:', error);
    }
  }, 1 * 60 * 60 * 1000); // Refresh every hour
}

// Fetch detailed information about assets
async function fetchAssetDetails(
  assets: any[],
): Promise<Map<string, AssetDetails>> {
  const assetDetails = new Map<string, AssetDetails>();

  for (const asset of assets) {
    try {
      // Use CoinGecko API to get asset details
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${asset.symbol.toLowerCase()}`,
      );

      const data = response.data;

      assetDetails.set(asset.symbol.toUpperCase(), {
        symbol: asset.symbol.toUpperCase(),
        name: data.name,
        totalSupply: data.market_data.total_supply,
        circulatingSupply: data.market_data.circulating_supply,
        allTimeHigh: data.market_data.ath.usd,
        allTimeHighDate: data.market_data.ath_date.usd,
      });
    } catch (error) {
      console.error(`Failed to fetch details for ${asset.symbol}:`, error);

      // Add basic info even if API call fails
      assetDetails.set(asset.symbol.toUpperCase(), {
        symbol: asset.symbol.toUpperCase(),
        name: asset.name || asset.symbol,
      });
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return assetDetails;
}

// Fetch additional details for a specific asset
async function fetchAssetDetailsFromAPI(symbol: string): Promise<AssetDetails> {
  try {
    // Use CoinGecko API to get asset details
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}`,
    );

    const data = response.data;

    return {
      symbol: symbol.toUpperCase(),
      name: data.name,
      totalSupply: data.market_data.total_supply,
      circulatingSupply: data.market_data.circulating_supply,
      allTimeHigh: data.market_data.ath.usd,
      allTimeHighDate: data.market_data.ath_date.usd,
    };
  } catch (error) {
    console.error(`Failed to fetch details for ${symbol}:`, error);

    // Return basic info if API call fails
    return {
      symbol: symbol.toUpperCase(),
      name: symbol,
    };
  }
}

// Fetch historical price data with different timeframes
async function fetchHistoricalDataFromCoinbase(
  symbol: string,
  period: string = '24h',
): Promise<CandleData[]> {
  let granularity: number;
  let timeRange: number;

  // Set appropriate granularity and time range based on period
  switch (period) {
    case '7d':
      granularity = 14400; // 4 hours
      timeRange = 7 * 24 * 60 * 60;
      break;
    case '30d':
      granularity = 86400; // 1 day
      timeRange = 30 * 24 * 60 * 60;
      break;
    case '1y':
      granularity = 86400; // 1 day
      timeRange = 365 * 24 * 60 * 60;
      break;
    case '2y':
      granularity = 172800; // 2 days
      timeRange = 2 * 365 * 24 * 60 * 60;
      break;
    case 'all':
      granularity = 604800; // 1 week
      timeRange = 10 * 365 * 24 * 60 * 60; // 10 years
      break;
    case '24h':
    default:
      granularity = 3600; // 1 hour
      timeRange = 24 * 60 * 60;
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - timeRange;

  try {
    // For longer periods, we might need to make multiple requests due to API limits
    if (period === '1y' || period === '2y' || period === 'all') {
      return await fetchHistoricalDataInChunks(symbol, granularity, start, end);
    }

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

    // Transform the Coinbase response to our CandleData format
    return response.data.map((candle: number[]) => ({
      timestamp: candle[0] * 1000,
      low: candle[1],
      high: candle[2],
      open: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

// Fetch historical data in chunks for longer periods
async function fetchHistoricalDataInChunks(
  symbol: string,
  granularity: number,
  start: number,
  end: number,
): Promise<CandleData[]> {
  // Coinbase API has a limit of ~300 candles per request
  const maxCandlesPerRequest = 300;
  const chunkSize = granularity * maxCandlesPerRequest;

  let result: CandleData[] = [];
  let currentStart = start;

  while (currentStart < end) {
    const currentEnd = Math.min(currentStart + chunkSize, end);

    try {
      const response = await axios.get(
        `https://api.exchange.coinbase.com/products/${symbol}/candles`,
        {
          params: {
            granularity,
            start: currentStart,
            end: currentEnd,
          },
        },
      );

      const candles = response.data.map((candle: number[]) => ({
        timestamp: candle[0] * 1000,
        low: candle[1],
        high: candle[2],
        open: candle[3],
        close: candle[4],
        volume: candle[5],
      }));

      result = [...result, ...candles];

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching historical chunk for ${symbol}:`, error);
    }

    currentStart = currentEnd;
  }

  return result;
}
