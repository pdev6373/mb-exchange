"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentYear = exports.getCurrentMonth = exports.generateOtp = exports.generateTokens = exports.getFlagEmojiFromCode = exports.isValidPhoneNumber = exports.isValidCountryCode = exports.isAdult = exports.SALT_ROUNDS = exports.REFRESH_TOKEN_SECRET = exports.ACCESS_TOKEN_SECRET = void 0;
const libphonenumber_js_1 = __importStar(require("libphonenumber-js"));
const i18n_iso_countries_1 = __importDefault(require("i18n-iso-countries"));
const en_json_1 = __importDefault(require("i18n-iso-countries/langs/en.json"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
i18n_iso_countries_1.default.registerLocale(en_json_1.default);
exports.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
exports.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
exports.SALT_ROUNDS = 10;
const isAdult = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return (age > 18 ||
        (age === 18 &&
            today >= new Date(birthDate.setFullYear(today.getFullYear()))));
};
exports.isAdult = isAdult;
const isValidCountryCode = (countryCode) => new Set((0, libphonenumber_js_1.getCountries)()).has(countryCode);
exports.isValidCountryCode = isValidCountryCode;
const isValidPhoneNumber = (phoneNumber, countryCode) => (0, libphonenumber_js_1.default)(phoneNumber, countryCode)?.isValid() ?? false;
exports.isValidPhoneNumber = isValidPhoneNumber;
const getFlagEmojiFromCode = (countryCode) => countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
exports.getFlagEmojiFromCode = getFlagEmojiFromCode;
const generateTokens = ({ email, accessExpiry = '7d', refreshExpiry = '30d', role, type = 'both', id, }) => {
    const tokens = {};
    if (type === 'access' || type === 'both')
        tokens.accessToken = jsonwebtoken_1.default.sign({ _id: id, email, role }, exports.ACCESS_TOKEN_SECRET, {
            expiresIn: accessExpiry,
        });
    if (type === 'refresh' || type === 'both')
        tokens.refreshToken = jsonwebtoken_1.default.sign({ _id: id, email, role }, exports.REFRESH_TOKEN_SECRET, {
            expiresIn: refreshExpiry,
        });
    return tokens;
};
exports.generateTokens = generateTokens;
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
exports.generateOtp = generateOtp;
const getCurrentMonth = (date) => date ? new Date(date).getMonth() : new Date().getMonth();
exports.getCurrentMonth = getCurrentMonth;
const getCurrentYear = (date) => date ? new Date(date).getFullYear() : new Date().getFullYear();
exports.getCurrentYear = getCurrentYear;
//# sourceMappingURL=helpers.js.map