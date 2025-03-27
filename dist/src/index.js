"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const CryptoPriceController_1 = require("./controllers/CryptoPriceController");
const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URI = process.env.DATABASE_URI;
mongoose_1.default
    .connect(DATABASE_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    waitQueueTimeoutMS: 10000,
    connectTimeoutMS: 10000,
})
    .then(() => {
    console.log('Connected to MongoDB');
    // Initialize WebSocket server after MongoDB connection
    (0, CryptoPriceController_1.initWebSocketServer)(app_1.server);
    app_1.server.listen(PORT, () => {
        console.log(`Server running on http://192.168.80.27:${PORT}`);
        console.log(`Server also accessible on http://localhost:${PORT}`);
        console.log(`WebSocket server is also running on the same port`);
    });
})
    .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});
//# sourceMappingURL=index.js.map