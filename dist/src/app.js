"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
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
const http_1 = require("http");
const authentication_1 = require("./middleware/authentication");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const allowedOrigins = [
    'https://mbexchangehub.com',
    'https://admin-access-portal.mbexchangehub.com',
    'https://mbexchange-api.mbexchangehub.com',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin))
            callback(null, true);
        else
            callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use((0, morgan_1.default)('common'));
app.use('/api/upload', (req, res, next) => (0, authentication_1.expressAuthentication)(req, 'BearerAuth'), upload.single('file'));
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
//# sourceMappingURL=app.js.map