"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHistoricalData = fetchHistoricalData;
exports.initWebSocketServer = initWebSocketServer;
// src/services/binanceService.ts
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
// Map to store active connections
const activeConnections = new Map();
// Function to fetch historical data
async function fetchHistoricalData(symbol, timeframe, limit = 100) {
    try {
        const endpoint = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${timeframe}&limit=${limit}`;
        console.log('Hello');
        const response = await axios_1.default.get(endpoint);
        const data = response.data;
        // Format data for the chart [time, open, high, low, close, ...]
        return data.map((candle) => ({
            timestamp: candle[0],
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
        }));
    }
    catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
}
// Initialize WebSocket server
function initWebSocketServer(server) {
    const wss = new ws_1.default.Server({ server });
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket server');
        let clientSubscription = null;
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
                            // If no more clients, close the Binance connection
                            if (connection.clients.size === 0) {
                                connection.binanceWs.close();
                                activeConnections.delete(key);
                                console.log(`Closed Binance connection for ${key}`);
                            }
                        }
                    }
                    // Set new subscription
                    clientSubscription = { symbol, timeframe };
                    const key = `${symbol}_${timeframe}`;
                    // Send historical data first
                    try {
                        const historicalData = await fetchHistoricalData(symbol, timeframe);
                        ws.send(JSON.stringify({
                            type: 'historical',
                            data: historicalData,
                        }));
                    }
                    catch (error) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Failed to fetch historical data',
                        }));
                        return;
                    }
                    // Check if we already have a connection for this symbol/timeframe
                    if (!activeConnections.has(key)) {
                        // Connect to Binance WebSocket
                        const binanceWsEndpoint = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeframe}`;
                        const binanceWs = new ws_1.default(binanceWsEndpoint);
                        const newConnection = {
                            binanceWs,
                            clients: new Set([ws]),
                        };
                        activeConnections.set(key, newConnection);
                        binanceWs.on('open', () => {
                            console.log(`Connected to Binance WebSocket for ${key}`);
                        });
                        binanceWs.on('message', (binanceData) => {
                            const parsedData = JSON.parse(binanceData.toString());
                            // Forward the message to all connected clients
                            for (const client of newConnection.clients) {
                                if (client.readyState === ws_1.default.OPEN) {
                                    client.send(JSON.stringify({
                                        type: 'update',
                                        data: parsedData,
                                    }));
                                }
                            }
                        });
                        binanceWs.on('error', (error) => {
                            console.error(`Binance WebSocket error for ${key}:`, error);
                            // Notify all clients about the error
                            for (const client of newConnection.clients) {
                                if (client.readyState === ws_1.default.OPEN) {
                                    client.send(JSON.stringify({
                                        type: 'error',
                                        message: 'Binance WebSocket error',
                                    }));
                                }
                            }
                        });
                        binanceWs.on('close', () => {
                            console.log(`Binance WebSocket closed for ${key}`);
                            activeConnections.delete(key);
                            // Notify all clients about the closure
                            for (const client of newConnection.clients) {
                                if (client.readyState === ws_1.default.OPEN) {
                                    client.send(JSON.stringify({
                                        type: 'closed',
                                        message: 'Binance WebSocket connection closed',
                                    }));
                                }
                            }
                        });
                    }
                    else {
                        // Add this client to existing connection
                        activeConnections.get(key).clients.add(ws);
                    }
                }
            }
            catch (error) {
                console.error('Error processing WebSocket message:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format',
                }));
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
                    // If no more clients, close the Binance connection
                    if (connection.clients.size === 0) {
                        connection.binanceWs.close();
                        activeConnections.delete(key);
                        console.log(`Closed Binance connection for ${key}`);
                    }
                }
            }
        });
    });
}
//# sourceMappingURL=CryptoPriceController.js.map