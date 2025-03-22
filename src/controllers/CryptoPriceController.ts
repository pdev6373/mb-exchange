// src/services/coinbaseService.ts
import WebSocket from 'ws';
import { Server } from 'http';
import axios from 'axios';

// Define types similar to your frontend
type TimeframeKey = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Coinbase message types
interface CoinbaseSubscription {
  type: string;
  product_ids: string[];
  channels: string[];
}

interface CoinbaseCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// Map timeframes to Coinbase granularity (in seconds)
const timeframeMap: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

// Map to store active connections
const activeConnections: Map<
  string,
  { coinbaseWs: WebSocket; clients: Set<WebSocket> }
> = new Map();

// Map Binance symbol format to Coinbase product_id format
function mapSymbolToCoinbaseProduct(symbol: string): string {
  // Binance uses formats like BTCUSDT, Coinbase uses BTC-USDT
  // Extract the trading pair (assuming standard format)
  const base = symbol.slice(0, -4); // Assuming USDT pairs
  const quote = symbol.slice(-4);
  return `${base}-${quote}`;
}

// Function to fetch historical data
export async function fetchHistoricalData(
  symbol: string,
  timeframe: string,
  limit = 100,
): Promise<CandleData[]> {
  try {
    const product = mapSymbolToCoinbaseProduct(symbol);
    const granularity = timeframeMap[timeframe];

    // Coinbase API endpoint for historical candles
    const endpoint = `https://api.exchange.coinbase.com/products/${product}/candles?granularity=${granularity}`;
    const response = await axios.get(endpoint);
    const data = response.data;

    // Coinbase returns data in reverse chronological order and different format
    // [time, low, high, open, close, volume]
    return data.reverse().map((candle: any[]) => ({
      timestamp: candle[0] * 1000, // Convert to milliseconds to match Binance
      open: parseFloat(candle[3]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[1]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
  } catch (error) {
    console.error('Error fetching historical data from Coinbase:', error);
    throw error;
  }
}

// Initialize WebSocket server
export function initWebSocketServer(server: Server): void {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    let clientSubscription: { symbol: string; timeframe: string } | null = null;

    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'subscribe') {
          const { symbol, timeframe } = data;

          // Unsubscribe from previous subscription if exists
          if (clientSubscription) {
            const key = `${clientSubscription.symbol}_${clientSubscription.timeframe}`;
            const connection = activeConnections.get(key);

            if (connection) {
              connection.clients.delete(ws);

              // If no more clients, close the Coinbase connection
              if (connection.clients.size === 0) {
                connection.coinbaseWs.close();
                activeConnections.delete(key);
                console.log(`Closed Coinbase connection for ${key}`);
              }
            }
          }

          // Set new subscription
          clientSubscription = { symbol, timeframe };
          const key = `${symbol}_${timeframe}`;
          const product = mapSymbolToCoinbaseProduct(symbol);

          // Send historical data first
          try {
            const historicalData = await fetchHistoricalData(symbol, timeframe);
            ws.send(
              JSON.stringify({
                type: 'historical',
                data: historicalData,
              }),
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: 'Failed to fetch historical data from Coinbase',
              }),
            );
            return;
          }

          // Check if we already have a connection for this symbol/timeframe
          if (!activeConnections.has(key)) {
            // Connect to Coinbase WebSocket
            const coinbaseWsEndpoint = 'wss://ws-feed.exchange.coinbase.com';
            const coinbaseWs = new WebSocket(coinbaseWsEndpoint);

            const newConnection = {
              coinbaseWs,
              clients: new Set<WebSocket>([ws]),
            };

            activeConnections.set(key, newConnection);

            coinbaseWs.on('open', () => {
              console.log(`Connected to Coinbase WebSocket for ${key}`);

              // Subscribe to the channel
              const subscribeMsg: CoinbaseSubscription = {
                type: 'subscribe',
                product_ids: [product],
                channels: ['ticker'],
              };
              coinbaseWs.send(JSON.stringify(subscribeMsg));
            });

            // Set up a polling mechanism for timeframes > 1m since Coinbase doesn't have kline streams
            if (timeframe !== '1m') {
              const granularity = timeframeMap[timeframe];
              const intervalTime = granularity * 1000; // Convert to milliseconds

              const intervalId = setInterval(async () => {
                try {
                  const newData = await fetchHistoricalData(
                    symbol,
                    timeframe,
                    1,
                  );
                  if (newData && newData.length > 0) {
                    for (const client of newConnection.clients) {
                      if (client.readyState === WebSocket.OPEN) {
                        client.send(
                          JSON.stringify({
                            type: 'update',
                            data: {
                              k: {
                                t: newData[0].timestamp,
                                o: newData[0].open.toString(),
                                h: newData[0].high.toString(),
                                l: newData[0].low.toString(),
                                c: newData[0].close.toString(),
                                v: newData[0].volume.toString(),
                                x: true, // Candle closed
                              },
                            },
                          }),
                        );
                      }
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error fetching interval data for ${key}:`,
                    error,
                  );
                }
              }, intervalTime);

              // Store the interval ID for cleanup
              (newConnection as any).intervalId = intervalId;
            }

            coinbaseWs.on('message', (coinbaseData) => {
              const parsedData = JSON.parse(coinbaseData.toString());

              // Only process ticker messages
              if (parsedData.type === 'ticker') {
                // Transform to a format similar to what your frontend expects
                const transformedData = {
                  e: 'kline', // Event type
                  E: Date.now(), // Event time
                  s: symbol, // Symbol
                  k: {
                    t: new Date(parsedData.time).getTime(), // Kline start time
                    T: new Date(parsedData.time).getTime(), // Kline close time
                    s: symbol, // Symbol
                    i: timeframe, // Interval
                    o: parsedData.open_24h, // Use as open price
                    c: parsedData.price, // Current price as close
                    h: parsedData.high_24h, // 24h high
                    l: parsedData.low_24h, // 24h low
                    v: parsedData.volume_24h, // 24h volume
                    x: false, // Not closed
                  },
                };

                // Forward the message to all connected clients
                for (const client of newConnection.clients) {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(
                      JSON.stringify({
                        type: 'update',
                        data: transformedData,
                      }),
                    );
                  }
                }
              }
            });

            coinbaseWs.on('error', (error) => {
              console.error(`Coinbase WebSocket error for ${key}:`, error);

              // Notify all clients about the error
              for (const client of newConnection.clients) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: 'error',
                      message: 'Coinbase WebSocket error',
                    }),
                  );
                }
              }
            });

            coinbaseWs.on('close', () => {
              console.log(`Coinbase WebSocket closed for ${key}`);

              // Clear any polling intervals if they exist
              if ((newConnection as any).intervalId) {
                clearInterval((newConnection as any).intervalId);
              }

              activeConnections.delete(key);

              // Notify all clients about the closure
              for (const client of newConnection.clients) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: 'closed',
                      message: 'Coinbase WebSocket connection closed',
                    }),
                  );
                }
              }
            });
          } else {
            // Add this client to existing connection
            activeConnections.get(key)!.clients.add(ws);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          }),
        );
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket server');

      if (clientSubscription) {
        const key = `${clientSubscription.symbol}_${clientSubscription.timeframe}`;
        const connection = activeConnections.get(key);

        if (connection) {
          connection.clients.delete(ws);

          // If no more clients, close the Coinbase connection
          if (connection.clients.size === 0) {
            connection.coinbaseWs.close();

            // Clear any intervals
            if ((connection as any).intervalId) {
              clearInterval((connection as any).intervalId);
            }

            activeConnections.delete(key);
            console.log(`Closed Coinbase connection for ${key}`);
          }
        }
      }
    });
  });
}
