"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URI = process.env.DATABASE_URI;
mongoose_1.default
    .connect(DATABASE_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app_1.default.listen(PORT, '0.0.0.0', () => {
        // Bind to all interfaces
        console.log(`Server running on http://192.168.80.27:${PORT}`);
        console.log(`Server also accessible on http://localhost:${PORT}`);
        console.log(`WebSocket server is also running on the same port`);
    });
})
    .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});
//# sourceMappingURL=index.js.map