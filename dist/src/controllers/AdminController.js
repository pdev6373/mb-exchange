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
exports.AdminController = void 0;
const tsoa_1 = require("tsoa");
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
const admin_1 = require("../schemas/admin");
const validateRequest_1 = require("../middleware/validateRequest");
const helpers_1 = require("../utils/helpers");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_1 = require("../models/Admin");
const user_1 = require("../schemas/user");
const mailSender_1 = require("../utils/mailSender");
const Transaction_1 = require("../models/Transaction");
const User_1 = require("../models/User");
const Reward_1 = require("../models/Reward");
const Count_1 = require("../models/Count");
const Notification_1 = require("../models/Notification");
const auth_1 = require("../schemas/auth");
let AdminController = class AdminController {
    async getAdmin(req) {
        req.user.refreshToken = undefined;
        return (0, responseWrapper_1.successResponse)('Admin fetched successfully', req.user);
    }
    async addAdmin(data, req) {
        const { email, name, role } = data;
        if (req.user?.email == email)
            throw new customErrors_1.UnauthorizedError("You can't add yourself as an admin");
        const existingActiveAdmin = await Admin_1.AdminModel.findOne({
            email,
            isActive: true,
        }).lean();
        if (existingActiveAdmin)
            throw new customErrors_1.BadRequestError('Admin already exists');
        const existingAdmin = await Admin_1.AdminModel.findOne({
            email,
        });
        if (existingAdmin)
            await Admin_1.AdminModel.deleteOne(existingAdmin._id);
        const admin = await Admin_1.AdminModel.create({
            email,
            name,
            role,
            invitationExpires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            isActive: false,
        });
        const token = (0, helpers_1.generateTokens)({
            id: admin._id.toString(),
            email,
            role,
            accessExpiry: '2d',
            type: 'access',
        });
        admin.invitationToken = token.accessToken;
        await admin.save();
        const invitationLink = `${process.env.FRONTEND_URL}/auth/admin/invite?token=${token.accessToken}`;
        await (0, mailSender_1.sendMail)({
            subject: 'Admin Invitation',
            to: email,
            html: `<p>Click <a href=${invitationLink} target="_blank">here</a> here to accept the request</p>`,
        });
        return (0, responseWrapper_1.successResponse)('Admin request sent successfully');
    }
    async getAdmins() {
        const now = new Date();
        await Admin_1.AdminModel.deleteMany({
            invitationExpires: { $exists: true, $lt: now },
        });
        const admins = await Admin_1.AdminModel.find().select('-password');
        return (0, responseWrapper_1.successResponse)('Admins fetched successfully', admins);
    }
    async updateAdmin(data, req) {
        let admin;
        const { name } = data;
        if (name)
            admin = await Admin_1.AdminModel.findByIdAndUpdate(req.user._id, { name }, { new: true });
        return (0, responseWrapper_1.successResponse)('Profile updated successfully', admin);
    }
    async updateAdminData(id, data, req) {
        const { name, role } = data;
        const admin = await Admin_1.AdminModel.findById(id);
        if (!admin)
            throw new customErrors_1.NotFoundError('Admin not found');
        if (name)
            admin.name = name;
        if (role && admin.role !== 'superadmin')
            admin.role = role;
        await admin.save();
        return (0, responseWrapper_1.successResponse)('Admin updated successfully', admin);
    }
    async removeAdmin(id, req) {
        if (req.user?._id.toString() == id)
            throw new customErrors_1.UnauthorizedError("You can't delete your account");
        await Admin_1.AdminModel.findByIdAndDelete(id);
        return (0, responseWrapper_1.successResponse)('Admin removed successfully');
    }
    async updatePassword(data, req) {
        const { newPassword, oldPassword } = data;
        const admin = await Admin_1.AdminModel.findById(req.user?._id);
        if (!admin)
            throw new customErrors_1.NotFoundError('Admin not found');
        const isMatch = await bcryptjs_1.default.compare(oldPassword, admin.password);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Incorrect password');
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, helpers_1.SALT_ROUNDS);
        admin.password = hashedPassword;
        await admin.save();
        return (0, responseWrapper_1.successResponse)('Password updated successfully');
    }
    async getUsers(page = 1, limit = 10, status = 'all', sort, search) {
        const filter = { emailVerified: true };
        if (status == 'active' || status == 'inactive')
            filter.registrationStatus =
                status == 'active' ? 'active' : { $in: ['basic', 'almost'] };
        if (search)
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { 'country.name': { $regex: search, $options: 'i' } },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const users = (await User_1.UserModel.find(filter)
            .select('-password -pin')
            .sort({
            createdAt: sort || 'desc',
        })
            .skip(skip)
            .limit(Number(limit))
            .lean());
        const totalUsers = await User_1.UserModel.countDocuments(filter);
        return (0, responseWrapper_1.successResponse)('Users fetched successfully', {
            data: users,
            pagination: {
                total: totalUsers,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalUsers / Number(limit)),
            },
        });
    }
    async getUser(id) {
        const user = await User_1.UserModel.findById(id).select('-password -pin').lean();
        return (0, responseWrapper_1.successResponse)('User fetched successfully', user);
    }
    async deleteUser(id) {
        const user = await User_1.UserModel.findById(id).lean();
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        const userMonthCreated = (0, helpers_1.getCurrentMonth)(user?.createdAt);
        const userYearCreated = (0, helpers_1.getCurrentYear)(user?.createdAt);
        const counts = await Count_1.CountModel.findOne({});
        if (counts) {
            const currentMonth = counts.users?.month?.key;
            const currentYear = counts.users?.year?.key;
            if (userMonthCreated == currentMonth && userYearCreated == currentYear) {
                counts.users.month.all -= 1;
                counts.users.year.all -= 1;
                if (user.registrationStatus == auth_1.RegistrationStatus.ACTIVE) {
                    counts.users.month.active -= 1;
                    counts.users.year.active -= 1;
                }
                else {
                    counts.users.month.inactive -= 1;
                    counts.users.year.inactive -= 1;
                }
            }
            counts.users.all -= 1;
            if (user.registrationStatus == auth_1.RegistrationStatus.ACTIVE)
                counts.users.active -= 1;
            else
                counts.users.inactive -= 1;
            await counts.save();
        }
        await User_1.UserModel.deleteOne(user._id);
        return (0, responseWrapper_1.successResponse)('User deleted successfully');
    }
    async getTransactions(page = 1, limit = 10, status = 'all', sort, search) {
        const filter = {};
        if (status && status !== 'all')
            filter.status = status;
        if (search)
            filter.$or = [
                { key: { $regex: search, $options: 'i' } },
                { 'asset.name': { $regex: search, $options: 'i' } },
                { 'platform.name': { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const transactions = await Transaction_1.TransactionModel.find(filter)
            .sort({
            createdAt: sort || 'desc',
        })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const totalTransactions = await Transaction_1.TransactionModel.countDocuments(filter);
        return (0, responseWrapper_1.successResponse)('Transactions fetched successfully', {
            data: transactions,
            pagination: {
                total: totalTransactions,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalTransactions / Number(limit)),
            },
        });
    }
    async getTransaction(id) {
        const transaction = await Transaction_1.TransactionModel.findById(id).lean();
        return (0, responseWrapper_1.successResponse)('Transaction fetched successfully', transaction);
    }
    async getUserTransactions(id) {
        const transactions = await Transaction_1.TransactionModel.find({ 'user.id': id }).lean();
        return (0, responseWrapper_1.successResponse)('Transactions fetched successfully', transactions);
    }
    async validateTransaction(id, status, amount = 0) {
        const transaction = await Transaction_1.TransactionModel.findById(id);
        if (!transaction)
            throw new customErrors_1.NotFoundError('Transaction not found');
        const user = await User_1.UserModel.findById(transaction.user.id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (transaction.status == status)
            return (0, responseWrapper_1.successResponse)('Transaction updated successfully', transaction);
        if (status == 'successful' && amount <= 0)
            throw new customErrors_1.BadRequestError('Amount transferred in dollars must be provided');
        const previousStatus = transaction.status;
        transaction.status = status;
        if (status == 'pending')
            transaction.dateApproved = undefined;
        else
            transaction.dateApproved = new Date();
        transaction.amount = amount;
        await transaction.save();
        if (status == 'successful') {
            user.successfulTransactions = user.successfulTransactions
                ? user.successfulTransactions + 1
                : 1;
            if (previousStatus == 'pending')
                user.pendingTransactions = user.pendingTransactions
                    ? user.pendingTransactions - 1
                    : 0;
            else if (previousStatus == 'failed')
                user.failedTransactions = user.failedTransactions
                    ? user.failedTransactions - 1
                    : 0;
            if (!user.points || user?.points < 10000) {
                user.points = (user?.points || 0) + amount;
                await user.save();
            }
        }
        else if (status == 'failed') {
            user.failedTransactions = user.failedTransactions
                ? user.failedTransactions + 1
                : 1;
            if (previousStatus == 'successful') {
                user.successfulTransactions = user.successfulTransactions
                    ? user.successfulTransactions - 1
                    : 0;
                user.points = user?.points ? user.points - amount : 0;
                await user.save();
            }
            else if (previousStatus == 'pending')
                user.pendingTransactions = user.pendingTransactions
                    ? user.pendingTransactions - 1
                    : 0;
        }
        else if (status == 'pending') {
            user.pendingTransactions = user.pendingTransactions
                ? user.pendingTransactions + 1
                : 1;
            if (previousStatus == 'successful') {
                user.successfulTransactions = user.successfulTransactions
                    ? user.successfulTransactions - 1
                    : 0;
                user.points = user?.points ? user.points - amount : 0;
                await user.save();
            }
            else if (previousStatus == 'failed')
                user.failedTransactions = user.failedTransactions
                    ? user.failedTransactions - 1
                    : 0;
        }
        const counts = await Count_1.CountModel.findOne({});
        if (counts) {
            const currentMonth = counts.transactions?.month?.key;
            const currentYear = counts.transactions?.year?.key;
            const currentRevenueMonth = counts.revenue?.month?.key;
            const currentRevenueYear = counts.transactions?.year?.key;
            if (currentMonth === (0, helpers_1.getCurrentMonth)()) {
                if (status == 'successful') {
                    counts.transactions.month.successful =
                        counts.transactions.month.successful + 1;
                    if (previousStatus == 'pending')
                        counts.transactions.month.pending = counts.transactions.month
                            .pending
                            ? counts.transactions.month.pending - 1
                            : 0;
                    else if (previousStatus == 'failed')
                        counts.transactions.month.failed = counts.transactions.month.failed
                            ? counts.transactions.month.failed - 1
                            : 0;
                }
                else if (status == 'failed') {
                    counts.transactions.month.failed =
                        counts.transactions.month.failed + 1;
                    if (previousStatus == 'pending')
                        counts.transactions.month.pending = counts.transactions.month
                            .pending
                            ? counts.transactions.month.pending - 1
                            : 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.month.successful = counts.transactions.month
                            .successful
                            ? counts.transactions.month.successful - 1
                            : 0;
                }
                else if (status == 'pending') {
                    counts.transactions.month.pending =
                        counts.transactions.month.pending + 1;
                    if (previousStatus == 'failed')
                        counts.transactions.month.failed = counts.transactions.month.failed
                            ? counts.transactions.month.failed - 1
                            : 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.month.successful = counts.transactions.month
                            .successful
                            ? counts.transactions.month.successful - 1
                            : 0;
                }
            }
            else {
                if (status == 'successful') {
                    counts.transactions.month.successful = 1;
                    if (previousStatus == 'pending')
                        counts.transactions.month.pending = 0;
                    else if (previousStatus == 'failed')
                        counts.transactions.month.failed = 0;
                }
                else if (status == 'failed') {
                    counts.transactions.month.successful = 1;
                    if (previousStatus == 'pending')
                        counts.transactions.month.pending = 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.month.successful = 0;
                }
                else if (status == 'pending') {
                    counts.transactions.month.successful = 1;
                    if (previousStatus == 'failed')
                        counts.transactions.month.failed = 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.month.successful = 0;
                }
                counts.transactions.month.key = (0, helpers_1.getCurrentMonth)();
            }
            if (currentYear === (0, helpers_1.getCurrentYear)()) {
                if (status == 'successful') {
                    counts.transactions.year.successful =
                        counts.transactions.year.successful + 1;
                    if (previousStatus == 'pending')
                        counts.transactions.year.pending = counts.transactions.year.pending
                            ? counts.transactions.year.pending - 1
                            : 0;
                    else if (previousStatus == 'failed')
                        counts.transactions.year.failed = counts.transactions.year.failed
                            ? counts.transactions.year.failed - 1
                            : 0;
                }
                else if (status == 'failed') {
                    counts.transactions.year.failed = counts.transactions.year.failed + 1;
                    if (previousStatus == 'pending')
                        counts.transactions.year.pending = counts.transactions.year.pending
                            ? counts.transactions.year.pending - 1
                            : 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.year.successful = counts.transactions.year
                            .successful
                            ? counts.transactions.year.successful - 1
                            : 0;
                }
                else if (status == 'pending') {
                    counts.transactions.year.pending =
                        counts.transactions.year.pending + 1;
                    if (previousStatus == 'failed')
                        counts.transactions.year.failed = counts.transactions.year.failed
                            ? counts.transactions.year.failed - 1
                            : 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.year.successful = counts.transactions.year
                            .successful
                            ? counts.transactions.year.successful - 1
                            : 0;
                }
            }
            else {
                if (status == 'successful') {
                    counts.transactions.year.successful = 1;
                    if (previousStatus == 'pending')
                        counts.transactions.year.pending = 0;
                    else if (previousStatus == 'failed')
                        counts.transactions.year.failed = 0;
                }
                else if (status == 'failed') {
                    counts.transactions.year.successful = 1;
                    if (previousStatus == 'pending')
                        counts.transactions.year.pending = 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.year.successful = 0;
                }
                else if (status == 'pending') {
                    counts.transactions.year.successful = 1;
                    if (previousStatus == 'failed')
                        counts.transactions.year.failed = 0;
                    else if (previousStatus == 'successful')
                        counts.transactions.year.successful = 0;
                }
                counts.transactions.year.key = (0, helpers_1.getCurrentYear)();
            }
            if (status == 'successful') {
                counts.transactions.successful = counts.transactions.successful + 1;
                if (previousStatus == 'pending')
                    counts.transactions.pending = counts.transactions.pending
                        ? counts.transactions.pending - 1
                        : 0;
                else if (previousStatus == 'failed')
                    counts.transactions.failed = counts.transactions.failed
                        ? counts.transactions.failed - 1
                        : 0;
            }
            else if (status == 'failed') {
                counts.transactions.failed = counts.transactions.failed + 1;
                if (previousStatus == 'pending')
                    counts.transactions.pending = counts.transactions.pending
                        ? counts.transactions.pending - 1
                        : 0;
                else if (previousStatus == 'successful')
                    counts.transactions.successful = counts.transactions.successful
                        ? counts.transactions.successful - 1
                        : 0;
            }
            else if (status == 'pending') {
                counts.transactions.pending = counts.transactions.pending + 1;
                if (previousStatus == 'failed')
                    counts.transactions.failed = counts.transactions.failed
                        ? counts.transactions.failed - 1
                        : 0;
                else if (previousStatus == 'successful')
                    counts.transactions.successful = counts.transactions.successful
                        ? counts.transactions.successful - 1
                        : 0;
            }
            if (currentRevenueMonth === (0, helpers_1.getCurrentMonth)()) {
                if (status == 'successful')
                    counts.revenue.month.revenue =
                        counts.revenue.month.revenue + transaction.amount;
                else if (status == 'failed') {
                    if (previousStatus == 'successful')
                        counts.revenue.month.revenue =
                            counts.revenue.month.revenue - transaction.amount;
                }
                else if (status == 'pending') {
                    if (previousStatus == 'successful')
                        counts.revenue.month.revenue =
                            counts.revenue.month.revenue - transaction.amount;
                }
            }
            else {
                if (status == 'successful')
                    counts.revenue.month.revenue = transaction.amount;
                else
                    counts.revenue.month.revenue = 0;
                counts.revenue.month.key = (0, helpers_1.getCurrentMonth)();
            }
            if (currentRevenueYear === (0, helpers_1.getCurrentYear)()) {
                if (status == 'successful')
                    counts.revenue.year.revenue =
                        counts.revenue.year.revenue + transaction.amount;
                else if (status == 'failed') {
                    if (previousStatus == 'successful')
                        counts.revenue.year.revenue =
                            counts.revenue.year.revenue - transaction.amount;
                }
                else if (status == 'pending') {
                    if (previousStatus == 'successful')
                        counts.revenue.year.revenue =
                            counts.revenue.year.revenue - transaction.amount;
                }
            }
            else {
                if (status == 'successful')
                    counts.revenue.year.revenue = transaction.amount;
                else
                    counts.revenue.year.revenue = 0;
                counts.revenue.year.key = (0, helpers_1.getCurrentYear)();
            }
            if (status == 'successful')
                counts.revenue.all = counts.revenue.all + transaction.amount;
            else if (status == 'failed') {
                if (previousStatus == 'successful')
                    counts.revenue.all = counts.revenue.all - transaction.amount;
            }
            else if (status == 'pending') {
                if (previousStatus == 'successful')
                    counts.revenue.all = counts.revenue.all - transaction.amount;
            }
            await counts.save();
        }
        return (0, responseWrapper_1.successResponse)('Transaction updated successfully', transaction);
    }
    async getRewards(page = 1, limit = 10, status = 'all', sort, search) {
        const filter = {};
        if (status && status !== 'all')
            filter.status = status;
        if (search)
            filter.$or = [
                { key: { $regex: search, $options: 'i' } },
                { 'user.firstName': { $regex: search, $options: 'i' } },
                { 'user.lastName': { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const rewards = await Reward_1.RewardModel.find(filter)
            .sort({
            createdAt: sort || 'desc',
        })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const totalRewards = await Reward_1.RewardModel.countDocuments(filter);
        return (0, responseWrapper_1.successResponse)('Rewards fetched successfully', {
            data: rewards,
            pagination: {
                total: totalRewards,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalRewards / Number(limit)),
            },
        });
    }
    async getReward(id) {
        const reward = await Reward_1.RewardModel.findById(id).lean();
        return (0, responseWrapper_1.successResponse)('Reward fetched successfully', reward);
    }
    async getUserRewards(id) {
        const rewards = await Reward_1.RewardModel.find({ 'user.id': id }).lean();
        return (0, responseWrapper_1.successResponse)('Rewards fetched successfully', rewards);
    }
    async validateReward(id, status) {
        const reward = await Reward_1.RewardModel.findById(id);
        if (!reward)
            throw new customErrors_1.NotFoundError('Reward not found');
        const user = await User_1.UserModel.findById(reward.user.id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (reward.status == status)
            return (0, responseWrapper_1.successResponse)('Reward updated successfully', reward);
        const previousStatus = reward.status;
        reward.status = status;
        if (status == 'pending')
            reward.dateApproved = undefined;
        else
            reward.dateApproved = new Date();
        await reward.save();
        if (status == 'successful') {
            user.successfulRewards = user.successfulRewards
                ? user.successfulRewards + 1
                : 1;
            if (previousStatus == 'pending')
                user.pendingRewards = user.pendingRewards ? user.pendingRewards - 1 : 0;
            user.points = user.points ? user.points - 5000 : 0;
            await user.save();
        }
        else if (status == 'pending') {
            user.pendingRewards = user.pendingRewards ? user.pendingRewards + 1 : 1;
            if (previousStatus == 'successful') {
                user.successfulRewards = user.successfulRewards
                    ? user.successfulRewards - 1
                    : 0;
                user.points = user.points ? user.points + 5000 : 5000;
                await user.save();
            }
        }
        const counts = await Count_1.CountModel.findOne({});
        if (counts) {
            const currentMonth = counts.rewards?.month?.key;
            const currentYear = counts.rewards?.year?.key;
            if (currentMonth === (0, helpers_1.getCurrentMonth)()) {
                if (status == 'successful') {
                    counts.rewards.month.successful = counts.rewards.month.successful + 1;
                    if (previousStatus == 'pending')
                        counts.rewards.month.pending = counts.rewards.month.pending
                            ? counts.rewards.month.pending - 1
                            : 0;
                }
                else if (status == 'pending') {
                    counts.rewards.month.pending = counts.rewards.month.pending + 1;
                    if (previousStatus == 'successful')
                        counts.rewards.month.successful = counts.rewards.month.successful
                            ? counts.rewards.month.successful - 1
                            : 0;
                }
            }
            else {
                if (status == 'successful') {
                    counts.rewards.month.successful = 1;
                    if (previousStatus == 'pending')
                        counts.rewards.month.pending = 0;
                }
                else if (status == 'pending') {
                    counts.rewards.month.successful = 1;
                    if (previousStatus == 'successful')
                        counts.rewards.month.successful = 0;
                }
                counts.rewards.month.key = (0, helpers_1.getCurrentMonth)();
            }
            if (currentYear === (0, helpers_1.getCurrentYear)()) {
                if (status == 'successful') {
                    counts.rewards.year.successful = counts.rewards.year.successful + 1;
                    if (previousStatus == 'pending')
                        counts.rewards.year.pending = counts.rewards.year.pending
                            ? counts.rewards.year.pending - 1
                            : 0;
                }
                else if (status == 'pending') {
                    counts.rewards.year.pending = counts.rewards.year.pending + 1;
                    if (previousStatus == 'successful')
                        counts.rewards.year.successful = counts.rewards.year.successful
                            ? counts.rewards.year.successful - 1
                            : 0;
                }
            }
            else {
                if (status == 'successful') {
                    counts.rewards.year.successful = 1;
                    if (previousStatus == 'pending')
                        counts.rewards.year.pending = 0;
                }
                else if (status == 'pending') {
                    counts.rewards.year.successful = 1;
                    if (previousStatus == 'successful')
                        counts.rewards.year.successful = 0;
                }
                counts.rewards.year.key = (0, helpers_1.getCurrentYear)();
            }
            if (status == 'successful') {
                counts.rewards.successful = counts.rewards.successful + 1;
                if (previousStatus == 'pending')
                    counts.rewards.pending = counts.rewards.pending
                        ? counts.rewards.pending - 1
                        : 0;
            }
            else if (status == 'pending') {
                counts.rewards.pending = counts.rewards.pending + 1;
                if (previousStatus == 'successful')
                    counts.rewards.successful = counts.rewards.successful
                        ? counts.rewards.successful - 1
                        : 0;
            }
            await counts.save();
        }
        return (0, responseWrapper_1.successResponse)('Reward updated successfully', reward);
    }
    async getNotifications(page = 1, limit = 10, sort, search) {
        const filter = {};
        if (search)
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const notifications = await Notification_1.NotificationModel.find(filter)
            .sort({
            createdAt: sort || 'desc',
        })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const totalNotifications = await Notification_1.NotificationModel.countDocuments(filter);
        return (0, responseWrapper_1.successResponse)('Notifications fetched successfully', {
            data: notifications,
            pagination: {
                total: totalNotifications,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalNotifications / Number(limit)),
            },
        });
    }
    async addNotification(data) {
        const { message, title } = data;
        const notification = await Notification_1.NotificationModel.create({
            message,
            title,
        });
        return (0, responseWrapper_1.successResponse)('Notification added successfully', notification);
    }
    async getCounts() {
        const counts = await Count_1.CountModel.findOne({}).lean();
        return (0, responseWrapper_1.successResponse)('Count fetched successfully', counts);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdmin", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, validateRequest_1.Validate)(admin_1.AddAdminSchema),
    (0, tsoa_1.Security)('BearerAuth', [admin_1.Role.SUPER_ADMIN]),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addAdmin", null);
__decorate([
    (0, tsoa_1.Get)('/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdmins", null);
__decorate([
    (0, tsoa_1.Patch)('/'),
    (0, validateRequest_1.Validate)(admin_1.UpdateAdminSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdmin", null);
__decorate([
    (0, tsoa_1.Patch)('/:id'),
    (0, validateRequest_1.Validate)(admin_1.UpdateAdminSchema),
    (0, tsoa_1.Security)('BearerAuth', [admin_1.Role.SUPER_ADMIN]),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __param(2, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdminData", null);
__decorate([
    (0, tsoa_1.Delete)('/:id'),
    (0, tsoa_1.Security)('BearerAuth', [admin_1.Role.SUPER_ADMIN]),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeAdmin", null);
__decorate([
    (0, tsoa_1.Patch)('/password'),
    (0, validateRequest_1.Validate)(user_1.UpdatePasswordSchema),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePassword", null);
__decorate([
    (0, tsoa_1.Get)('/users'),
    __param(0, (0, tsoa_1.Query)()),
    __param(1, (0, tsoa_1.Query)()),
    __param(2, (0, tsoa_1.Query)()),
    __param(3, (0, tsoa_1.Query)()),
    __param(4, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, tsoa_1.Get)('/users/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, tsoa_1.Delete)('/users/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, tsoa_1.Get)('/transactions'),
    __param(0, (0, tsoa_1.Query)()),
    __param(1, (0, tsoa_1.Query)()),
    __param(2, (0, tsoa_1.Query)()),
    __param(3, (0, tsoa_1.Query)()),
    __param(4, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTransactions", null);
__decorate([
    (0, tsoa_1.Get)('/transactions/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTransaction", null);
__decorate([
    (0, tsoa_1.Get)('/transactions/user/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserTransactions", null);
__decorate([
    (0, tsoa_1.Patch)('/transactions/:id/:status/:amount'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Path)()),
    __param(2, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "validateTransaction", null);
__decorate([
    (0, tsoa_1.Get)('/rewards'),
    __param(0, (0, tsoa_1.Query)()),
    __param(1, (0, tsoa_1.Query)()),
    __param(2, (0, tsoa_1.Query)()),
    __param(3, (0, tsoa_1.Query)()),
    __param(4, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRewards", null);
__decorate([
    (0, tsoa_1.Get)('/rewards/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReward", null);
__decorate([
    (0, tsoa_1.Get)('/rewards/user/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserRewards", null);
__decorate([
    (0, tsoa_1.Patch)('/rewards/:id/:status'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "validateReward", null);
__decorate([
    (0, tsoa_1.Get)('/notifications'),
    __param(0, (0, tsoa_1.Query)()),
    __param(1, (0, tsoa_1.Query)()),
    __param(2, (0, tsoa_1.Query)()),
    __param(3, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNotifications", null);
__decorate([
    (0, tsoa_1.Post)('/notifications'),
    (0, validateRequest_1.Validate)(admin_1.AddNotificationSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addNotification", null);
__decorate([
    (0, tsoa_1.Get)('/counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCounts", null);
exports.AdminController = AdminController = __decorate([
    (0, tsoa_1.Tags)('Admin'),
    (0, tsoa_1.Route)('admin'),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role))
], AdminController);
//# sourceMappingURL=AdminController.js.map