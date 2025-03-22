"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require('express-async-errors');
const express_1 = __importDefault(require("express"));
const routes_1 = require("../public/routes");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("../public/swagger.json"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const tsoa_1 = require("tsoa");
const customErrors_1 = require("./utils/customErrors");
const multer_1 = __importDefault(require("multer"));
const authentication_1 = require("./middleware/authentication");
const http_1 = require("http");
const CryptoPriceController_1 = require("./controllers/CryptoPriceController");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('common'));
app.use('/api/upload', (req, res, next) => (0, authentication_1.expressAuthentication)(req, 'BearerAuth'), upload.single('file'));
// Add a simple endpoint to check if the Binance relay is working
app.get('/api/crypto/ping', (req, res) => {
    res.json({ success: true, message: 'Binance relay service is running' });
});
(0, routes_1.RegisterRoutes)(app);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.use((err, req, res, next) => {
    if (err instanceof tsoa_1.ValidateError)
        res.status(400).json({
            success: false,
            message: 'Validation Failed',
            errors: err.fields,
        });
    else if (err instanceof customErrors_1.AppError)
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    else
        res.status(500).json({
            success: false,
            message: err.message || 'Internal Server Error',
        });
});
// Initialize WebSocket server after Express setup
(0, CryptoPriceController_1.initWebSocketServer)(server);
// Export the HTTP server instead of the Express app
exports.default = server;
//# sourceMappingURL=app.js.map