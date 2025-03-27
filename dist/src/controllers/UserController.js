"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const tsoa_1 = require("tsoa");
const User_1 = require("../models/User");
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
const user_1 = require("../schemas/user");
const validateRequest_1 = require("../middleware/validateRequest");
const helpers_1 = require("../utils/helpers");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Transaction_1 = require("../models/Transaction");
const Asset_1 = require("../models/Asset");
const Reward_1 = require("../models/Reward");
const Count_1 = require("../models/Count");
const axios_1 = __importDefault(require("axios"));
const Banks_1 = require("../models/Banks");
let UserController = class UserController {
    constructor() {
        this.isDataExpired = (lastUpdated) => {
            const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
            return Date.now() - lastUpdated.getTime() > threeDaysInMillis;
        };
        this.fetchBanksFromPaystack = async (country) => {
            try {
                const response = await axios_1.default.get(`https://api.paystack.co/bank`, {
                    params: { country },
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });
                console.log('res', response);
                return response.data.data?.filter((bank) => bank.active);
            }
            catch (error) {
                console.error('Error fetching banks from Paystack:', error?.message);
                throw error;
            }
        };
    }
    async getUniqueTransactionId() {
        let transactionId = '';
        let isUnique = false;
        const timestamp = Date.now();
        const randomComponent = Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase();
        while (!isUnique) {
            transactionId = `TXN-${timestamp}${randomComponent}`;
            const existingUser = await Transaction_1.TransactionModel.findOne({
                key: transactionId,
            });
            if (!existingUser)
                isUnique = true;
        }
        return transactionId;
    }
    async getUniqueRewardId() {
        let rewardId = '';
        let isUnique = false;
        const timestamp = Date.now();
        const randomComponent = Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase();
        while (!isUnique) {
            rewardId = `RWD-${timestamp}${randomComponent}`;
            const existingUser = await Reward_1.RewardModel.findOne({
                key: rewardId,
            });
            if (!existingUser)
                isUnique = true;
        }
        return rewardId;
    }
    async getUser(req) {
        req.user.refreshToken = undefined;
        return (0, responseWrapper_1.successResponse)('User fetched successfully', req.user);
    }
    async updateUser(data, req) {
        let { country, dateOfBirth, firstName, gender, lastName, phoneNumber, userName, } = data;
        const user = await User_1.UserModel.findById(req.user?._id).select('-password -pin -refreshToken');
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (phoneNumber) {
            const phoneNumberExists = await User_1.UserModel.findOne({
                phoneNumber,
                _id: { $ne: user._id },
            });
            if (phoneNumberExists)
                throw new customErrors_1.BadRequestError('Phone number taken');
            const currentCountryCode = user?.country?.code;
            if (!country &&
                (!currentCountryCode ||
                    !(0, helpers_1.isValidPhoneNumber)(phoneNumber, currentCountryCode)))
                throw new customErrors_1.BadRequestError('Phone number and country mismatch');
            if (country?.name) {
                const newCountryCode = country.code;
                if (!(0, helpers_1.isValidPhoneNumber)(phoneNumber, newCountryCode))
                    throw new customErrors_1.BadRequestError('Phone number and country mismatch');
                if (newCountryCode !== currentCountryCode &&
                    phoneNumber == user?.phoneNumber)
                    throw new customErrors_1.BadRequestError('Phone number and country mismatch');
                user.country = {
                    code: newCountryCode,
                    name: country.name,
                    flag: (0, helpers_1.getFlagEmojiFromCode)(newCountryCode),
                    currency: country.currency,
                };
            }
            user.phoneNumber = phoneNumber;
        }
        if (country && !phoneNumber)
            throw new customErrors_1.BadRequestError('Phone number and country mismatch');
        if (userName && userName !== user.userName) {
            const userNameExists = await User_1.UserModel.findOne({
                userName,
                _id: { $ne: user._id },
            });
            if (userNameExists)
                throw new customErrors_1.BadRequestError('Username taken');
            user.userName = userName;
        }
        if (dateOfBirth)
            user.dateOfBirth = new Date(dateOfBirth);
        if (firstName && firstName !== user.firstName)
            user.firstName = firstName;
        if (lastName && lastName !== user.lastName)
            user.lastName = lastName;
        if (gender && gender !== user.gender)
            user.gender = gender;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Profile updated successfully', user);
    }
    async updatePassword(data, req) {
        const { newPassword, oldPassword } = data;
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Incorrect password');
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, helpers_1.SALT_ROUNDS);
        user.password = hashedPassword;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Password updated successfully');
    }
    async updatePin(data, req) {
        const { newPin, oldPin } = data;
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        const isMatch = await bcryptjs_1.default.compare(oldPin, user.pin);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Incorrect pin');
        const hashedPin = await bcryptjs_1.default.hash(newPin, helpers_1.SALT_ROUNDS);
        user.pin = hashedPin;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Pin updated successfully');
    }
    async enableNotifications(data, req) {
        const { enable } = data;
        const user = await User_1.UserModel.findByIdAndUpdate(req?.user?._id, { notificationsEnabled: enable }, { new: true });
        return (0, responseWrapper_1.successResponse)(enable ? 'Notifications enabled' : 'Notifications disabled', user?.notificationsEnabled);
    }
    async pushToken(req, pushToken) {
        await User_1.UserModel.findByIdAndUpdate(req?.user?._id, {
            pushToken,
        });
        return (0, responseWrapper_1.successResponse)('Token updated successfully');
    }
    async getAllBanks(country) {
        let banks = await Banks_1.BanksModel.findOne();
        const lowercaseCountry = country.toLowerCase();
        if (!banks ||
            this.isDataExpired(new Date(banks.updatedAt)) ||
            banks.country !== lowercaseCountry) {
            const freshData = await this.fetchBanksFromPaystack(lowercaseCountry);
            if (banks) {
                banks.data = freshData;
                banks.country = lowercaseCountry;
                await banks?.save();
            }
            else {
                banks = new Banks_1.BanksModel({ data: freshData, country: lowercaseCountry });
                await banks.save();
            }
        }
        return (0, responseWrapper_1.successResponse)('Banks fetched successfully', banks.data);
    }
    async getRewards(req) {
        const rewards = await Reward_1.RewardModel.find({ 'user.id': req?.user?._id });
        return (0, responseWrapper_1.successResponse)('Rewards fetched successfully', rewards);
    }
    async getTransactions(req) {
        const transactions = await Transaction_1.TransactionModel.find({
            'user.id': req.user._id,
        })
            .sort({ createdAt: -1 })
            .lean();
        return (0, responseWrapper_1.successResponse)('Transactions fetched successfully', transactions);
    }
    async getTransaction(id) {
        const transaction = await Transaction_1.TransactionModel.findById(id).lean();
        if (!transaction)
            throw new customErrors_1.NotFoundError('Transaction not found');
        return (0, responseWrapper_1.successResponse)('Transaction fetched successfully', transaction);
    }
    async makeTransaction(data, req) {
        const { assetId, address, quantity, proof, platform } = data;
        const assetExist = await Asset_1.AssetModel.findById(assetId);
        if (!assetExist)
            throw new customErrors_1.NotFoundError('Asset not found');
        const platforms = assetExist.platformAddresses;
        const platformExist = platforms.find((pl) => pl.platform === platform);
        if (!platformExist)
            throw new customErrors_1.NotFoundError('Platform not found');
        if (platformExist.address !== address)
            throw new customErrors_1.BadRequestError('Invalid address');
        const user = req.user;
        const key = await this.getUniqueTransactionId();
        await Transaction_1.TransactionModel.create({
            user: {
                id: user?._id,
                firstName: user?.firstName,
                lastName: user?.lastName,
            },
            asset: {
                id: assetExist._id,
                name: assetExist.name,
                symbol: assetExist.symbol,
            },
            platform: {
                platform: platformExist.platform,
                address: platformExist.address,
            },
            quantity,
            address,
            proof,
            rate: assetExist.rate,
            status: user_1.TransactionStatus.PENDING,
            key,
        });
        const counts = await Count_1.CountModel.findOne({});
        if (counts) {
            const currentMonth = counts.transactions?.month?.key;
            const currentYear = counts.transactions?.year?.key;
            const currentMonthAllCount = counts.transactions?.month?.all || 0;
            const currentMonthPendingCount = counts.transactions?.month?.pending || 0;
            const currentMonthSuccessfulCount = counts.transactions?.month?.successful || 0;
            const currentMonthFailedCount = counts.transactions?.month?.failed || 0;
            const currentYearAllCount = counts.transactions?.year?.all || 0;
            const currentYearPendingCount = counts.transactions?.year?.pending || 0;
            const currentYearSuccessfulCount = counts.transactions?.year?.successful || 0;
            const currentYearFailedCount = counts.transactions?.year?.failed || 0;
            if (currentMonth === (0, helpers_1.getCurrentMonth)()) {
                counts.transactions.month.all = currentMonthAllCount + 1;
                counts.transactions.month.pending = currentMonthPendingCount + 1;
                counts.transactions.month.failed = currentMonthFailedCount;
                counts.transactions.month.successful = currentMonthSuccessfulCount;
            }
            else {
                counts.transactions.month.all = 1;
                counts.transactions.month.pending = 1;
                counts.transactions.month.failed = 0;
                counts.transactions.month.successful = 0;
                counts.transactions.month.key = (0, helpers_1.getCurrentMonth)();
            }
            if (currentYear === (0, helpers_1.getCurrentYear)()) {
                counts.transactions.year.all = currentYearAllCount + 1;
                counts.transactions.year.pending = currentYearPendingCount + 1;
                counts.transactions.year.failed = currentYearFailedCount;
                counts.transactions.year.successful = currentYearSuccessfulCount;
            }
            else {
                counts.transactions.year.all = 1;
                counts.transactions.year.pending = 1;
                counts.transactions.year.failed = 0;
                counts.transactions.year.successful = 0;
                counts.transactions.year.key = (0, helpers_1.getCurrentYear)();
            }
            counts.transactions.all += 1;
            counts.transactions.pending += 1;
            await counts.save();
        }
        const updatedUser = await User_1.UserModel.findOneAndUpdate({ _id: req.user?._id }, { $inc: { pendingTransactions: 1, totalTransactions: 1 } }, { new: true });
        return (0, responseWrapper_1.successResponse)('Transaction in process', updatedUser);
    }
    async payReward(req) {
        const user = req.user;
        if (!user.points || user?.points < 5000)
            throw new customErrors_1.NotFoundError('Minimum of 5000 points needed');
        if (user.pendingRewards)
            throw new customErrors_1.NotFoundError('You have a pending reward');
        const key = await this.getUniqueRewardId();
        await Reward_1.RewardModel.create({
            user: {
                id: user._id,
                firstName: user?.firstName,
                lastName: user?.lastName,
            },
            amount: 10,
            status: user_1.RewardStatus.PENDING,
            key,
        });
        const counts = await Count_1.CountModel.findOne({});
        if (counts) {
            const currentMonth = counts.rewards?.month?.key;
            const currentYear = counts.rewards?.year?.key;
            const currentMonthAllCount = counts.rewards?.month?.all || 0;
            const currentMonthPendingCount = counts.rewards?.month?.pending || 0;
            const currentMonthSuccessfulCount = counts.rewards?.month?.successful || 0;
            const currentYearAllCount = counts.rewards?.year?.all || 0;
            const currentYearPendingCount = counts.rewards?.year?.pending || 0;
            const currentYearSuccessfulCount = counts.rewards?.year?.successful || 0;
            if (currentMonth === (0, helpers_1.getCurrentMonth)()) {
                counts.rewards.month.all = currentMonthAllCount + 1;
                counts.rewards.month.pending = currentMonthPendingCount + 1;
                counts.rewards.month.successful = currentMonthSuccessfulCount;
            }
            else {
                counts.rewards.month.all = 1;
                counts.rewards.month.pending = 1;
                counts.rewards.month.successful = 0;
                counts.rewards.month.key = (0, helpers_1.getCurrentMonth)();
            }
            if (currentYear === (0, helpers_1.getCurrentYear)()) {
                counts.rewards.year.all = currentYearAllCount + 1;
                counts.rewards.year.pending = currentYearPendingCount + 1;
                counts.rewards.year.successful = currentYearSuccessfulCount;
            }
            else {
                counts.rewards.year.all = 1;
                counts.rewards.year.pending = 1;
                counts.rewards.year.successful = 0;
                counts.rewards.year.key = (0, helpers_1.getCurrentYear)();
            }
            counts.rewards.all += 1;
            counts.rewards.pending += 1;
            await counts.save();
        }
        const updatedUser = await User_1.UserModel.findOneAndUpdate({ _id: req.user?._id }, { $inc: { pendingRewards: 1, totalRewards: 1 } }, { new: true });
        return (0, responseWrapper_1.successResponse)('Reward claim in progress', updatedUser);
    }
    async getBanks(req) {
        const user = await User_1.UserModel.findById(req.user?._id).select('banks');
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        return (0, responseWrapper_1.successResponse)('Banks retrieved successfully', user.banks);
    }
    async getBank(id, req) {
        const user = await User_1.UserModel.findById(req.user?._id).select('banks');
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        const bank = user.banks?.find((b) => b._id.toString() === id);
        if (!bank)
            throw new customErrors_1.NotFoundError('Bank not found');
        return (0, responseWrapper_1.successResponse)('Bank retrieved successfully', bank);
    }
    async addBank(data, req) {
        const { accountName, accountNumber, bankName } = data;
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (!user.banks)
            user.banks = [];
        if (user.banks.length >= 5)
            throw new customErrors_1.BadRequestError('Maximum of 5 accounts allowed');
        user.banks.push({
            accountName,
            accountNumber,
            bankName,
            default: !user.banks.length,
        });
        await user.save();
        return (0, responseWrapper_1.successResponse)('Bank added successfully', user.banks);
    }
    async updateBank(id, req, bank) {
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (!user.banks || user.banks.length === 0)
            throw new customErrors_1.NotFoundError('No banks found');
        const bankIndex = user.banks?.findIndex((b) => b._id.toString() == id);
        if (bankIndex === -1)
            throw new customErrors_1.NotFoundError('Bank not found');
        Object.assign(user.banks[bankIndex], bank);
        await user.save();
        return (0, responseWrapper_1.successResponse)('Bank updated successfully', user.banks[bankIndex]);
    }
    async deleteBank(id, req) {
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (!user.banks || user.banks.length === 0)
            throw new customErrors_1.NotFoundError('No banks found');
        const bankIndex = user.banks.findIndex((b) => b._id.toString() === id);
        if (bankIndex === -1)
            throw new customErrors_1.NotFoundError('Bank not found');
        const wasDefault = user.banks[bankIndex].default;
        user.banks.splice(bankIndex, 1);
        if (wasDefault && user.banks.length > 0)
            user.banks[0].default = true;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Bank deleted successfully', user.banks);
    }
    async setDefaultBank(id, req) {
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (!user.banks || user.banks.length === 0)
            throw new customErrors_1.NotFoundError('No banks found');
        const bankIndex = user.banks.findIndex((b) => b._id.toString() === id);
        if (bankIndex === -1)
            throw new customErrors_1.NotFoundError('Bank not found');
        user.banks.forEach((b) => (b.default = false));
        user.banks[bankIndex].default = true;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Default bank updated successfully', user.banks);
    }
};
exports.UserController = UserController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    (0, tsoa_1.Patch)('/'),
    (0, validateRequest_1.Validate)(user_1.UpdatecProfileSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, tsoa_1.Patch)('/password'),
    (0, validateRequest_1.Validate)(user_1.UpdatePasswordSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePassword", null);
__decorate([
    (0, tsoa_1.Patch)('/pin'),
    (0, validateRequest_1.Validate)(user_1.UpdatePinSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePin", null);
__decorate([
    (0, tsoa_1.Post)('/enable-notifications'),
    (0, validateRequest_1.Validate)(user_1.EnableNotificationsSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "enableNotifications", null);
__decorate([
    (0, tsoa_1.Patch)('/push-token/:pushToken'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "pushToken", null);
__decorate([
    (0, tsoa_1.Get)('/all-banks/:country'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllBanks", null);
__decorate([
    (0, tsoa_1.Get)('/rewards'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getRewards", null);
__decorate([
    (0, tsoa_1.Get)('/transactions'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getTransactions", null);
__decorate([
    (0, tsoa_1.Get)('/transactions/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getTransaction", null);
__decorate([
    (0, tsoa_1.Post)('/transaction'),
    (0, validateRequest_1.Validate)(user_1.MakeTransactionSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "makeTransaction", null);
__decorate([
    (0, tsoa_1.Get)('/reward'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "payReward", null);
__decorate([
    (0, tsoa_1.Get)('/banks'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getBanks", null);
__decorate([
    (0, tsoa_1.Get)('/bank/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getBank", null);
__decorate([
    (0, tsoa_1.Post)('/bank'),
    (0, validateRequest_1.Validate)(user_1.AddBankSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "addBank", null);
__decorate([
    (0, tsoa_1.Patch)('/bank/:id'),
    (0, validateRequest_1.Validate)(user_1.UpdateBankSchema),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __param(2, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateBank", null);
__decorate([
    (0, tsoa_1.Delete)('/bank/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteBank", null);
__decorate([
    (0, tsoa_1.Patch)('/bank/default/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "setDefaultBank", null);
exports.UserController = UserController = __decorate([
    (0, tsoa_1.Tags)('User'),
    (0, tsoa_1.Route)('user'),
    (0, tsoa_1.Security)('BearerAuth')
], UserController);
//# sourceMappingURL=UserController.js.map