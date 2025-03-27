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
exports.AuthController = void 0;
const tsoa_1 = require("tsoa");
const User_1 = require("../models/User");
const auth_1 = require("../schemas/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validateRequest_1 = require("../middleware/validateRequest");
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
const helpers_1 = require("../utils/helpers");
const mailSender_1 = require("../utils/mailSender");
const Count_1 = require("../models/Count");
const Reason_1 = require("../models/Reason");
let AuthController = class AuthController {
    async getUniqueReferralCode() {
        let referralCode = '';
        let isUnique = false;
        while (!isUnique) {
            referralCode = `MBE-${Math.random()
                .toString(36)
                .substring(2, 9)
                .toUpperCase()}`;
            const existingUser = await User_1.UserModel.findOne({ referralCode });
            if (!existingUser)
                isUnique = true;
        }
        return referralCode;
    }
    async sendOtp(data) {
        let { email, type } = data;
        email = email.toLowerCase();
        let user = await User_1.UserModel.findOne({ email });
        if (type === auth_1.OTPType.REGISTER) {
            if (user?.registrationStatus === auth_1.RegistrationStatus.ACTIVE)
                return (0, responseWrapper_1.successResponse)('You already have an active account', {
                    hasActiveAccount: true,
                });
            const otp = (0, helpers_1.generateOtp)();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            user = await User_1.UserModel.findOneAndUpdate({ email }, {
                email,
                otp,
                otpExpiresAt,
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            await (0, mailSender_1.sendMail)({
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
                to: email,
            });
            return (0, responseWrapper_1.successResponse)('OTP sent successfully', {
                hasActiveAccount: user?.registrationStatus === auth_1.RegistrationStatus.ACTIVE,
            });
        }
        if (!user)
            throw new customErrors_1.NotFoundError('No user found');
        const otp = (0, helpers_1.generateOtp)();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user = await User_1.UserModel.findOneAndUpdate({ email }, { otp, otpExpiresAt }, { new: true });
        await (0, mailSender_1.sendMail)({
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
            to: email,
        });
        return (0, responseWrapper_1.successResponse)('OTP sent successfully', {
            hasActiveAccount: user?.registrationStatus === auth_1.RegistrationStatus.ACTIVE,
        });
    }
    async verifyEmail(data) {
        const { email, otp } = data;
        const user = await User_1.UserModel.findOne({ email });
        if (!user ||
            user.otp !== otp ||
            !user.otpExpiresAt ||
            user.otpExpiresAt < new Date())
            throw new customErrors_1.BadRequestError('Invalid or expired OTP');
        const wasUnVerified = !user.emailVerified;
        if (wasUnVerified) {
            const counts = await Count_1.CountModel.findOne({});
            if (!counts)
                await Count_1.CountModel.create({
                    users: {
                        active: 0,
                        inactive: 1,
                        all: 1,
                        month: {
                            active: 0,
                            inactive: 1,
                            all: 1,
                            key: (0, helpers_1.getCurrentMonth)(),
                        },
                        year: {
                            active: 0,
                            inactive: 1,
                            all: 1,
                            key: (0, helpers_1.getCurrentYear)(),
                        },
                    },
                    revenue: {},
                    rewards: {},
                    transactions: {},
                });
            else {
                const currentMonth = counts.users?.month?.key;
                const currentYear = counts.users?.year?.key;
                const currentMonthAllCount = counts.users?.month?.all || 0;
                const currentMonthActiveCount = counts.users?.month?.active || 0;
                const currentMonthInactiveCount = counts.users?.month?.inactive || 0;
                const currentYearAllCount = counts.users?.year?.all || 0;
                const currentYearActiveCount = counts.users?.year?.active || 0;
                const currentYearInactiveCount = counts.users?.year?.inactive || 0;
                if (currentMonth === (0, helpers_1.getCurrentMonth)()) {
                    counts.users.month.all = currentMonthAllCount + 1;
                    counts.users.month.inactive = currentMonthInactiveCount + 1;
                    counts.users.month.active = currentMonthActiveCount;
                }
                else {
                    counts.users.month.all = 1;
                    counts.users.month.active = 0;
                    counts.users.month.inactive = 1;
                    counts.users.month.key = (0, helpers_1.getCurrentMonth)();
                }
                if (currentYear === (0, helpers_1.getCurrentYear)()) {
                    counts.users.year.all = currentYearAllCount + 1;
                    counts.users.year.inactive = currentYearInactiveCount + 1;
                    counts.users.year.active = currentYearActiveCount;
                }
                else {
                    counts.users.year.all = 1;
                    counts.users.year.active = 0;
                    counts.users.year.inactive = 1;
                    counts.users.year.key = (0, helpers_1.getCurrentYear)();
                }
                counts.users.inactive += 1;
                counts.users.all += 1;
                await counts.save();
            }
        }
        if (wasUnVerified)
            user.emailVerified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Email verified successfully', {
            registrationStatus: user.registrationStatus,
        });
    }
    async completeBasicProfile(data) {
        const { email, firstName, lastName, referrer, password, userName } = data;
        const hashedPassword = await bcryptjs_1.default.hash(password, helpers_1.SALT_ROUNDS);
        const user = await User_1.UserModel.findOne({ email });
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (user.registrationStatus)
            throw new customErrors_1.UnauthorizedError();
        const [userNameExists, referrerUser] = await Promise.all([
            userName ? User_1.UserModel.findOne({ userName }) : null,
            referrer ? User_1.UserModel.findOne({ referralCode: referrer }) : null,
        ]);
        if (userNameExists)
            throw new customErrors_1.BadRequestError('Username taken');
        if (referrer && !referrerUser)
            throw new customErrors_1.NotFoundError('Referrer not found');
        user.firstName = firstName;
        user.lastName = lastName;
        user.password = hashedPassword;
        user.userName = userName;
        user.registrationStatus = auth_1.RegistrationStatus.INCOMPLETE;
        if (referrerUser) {
            user.referrer = {
                id: referrerUser._id.toString(),
                firstName: referrerUser.firstName,
                lastName: referrerUser.lastName,
            };
            referrerUser.referred = (referrerUser.referred || 0) + 1;
        }
        await Promise.all([user.save(), referrerUser?.save()]);
        return (0, responseWrapper_1.successResponse)('Basic profile completed successfully');
    }
    async completeAdditionalProfile(data) {
        const { email, country, phoneNumber, dateOfBirth, gender } = data;
        if (!(0, helpers_1.isValidCountryCode)(country.code))
            throw new customErrors_1.BadRequestError('Invalid country code');
        if (!(0, helpers_1.isValidPhoneNumber)(phoneNumber, country.code))
            throw new customErrors_1.BadRequestError('Phone number and country mismatch');
        const user = await User_1.UserModel.findOne({ email });
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (user.registrationStatus !== auth_1.RegistrationStatus.INCOMPLETE)
            throw new customErrors_1.UnauthorizedError();
        const phoneNumberExists = await User_1.UserModel.findOne({ phoneNumber });
        if (phoneNumberExists)
            throw new customErrors_1.BadRequestError('Phone number taken');
        user.country = {
            code: country.code,
            name: country.name,
            flag: (0, helpers_1.getFlagEmojiFromCode)(country.code),
            currency: country.currency,
        };
        user.phoneNumber = phoneNumber;
        user.dateOfBirth = new Date(dateOfBirth);
        user.registrationStatus = auth_1.RegistrationStatus.COMPLETE;
        user.gender = gender;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Profile completed successfully');
    }
    async setupPin(data) {
        const { email, pin } = data;
        const user = await User_1.UserModel.findOne({ email });
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (user.registrationStatus !== auth_1.RegistrationStatus.COMPLETE || user.pin)
            throw new customErrors_1.UnauthorizedError();
        if (!user.referralCode)
            user.referralCode = await this.getUniqueReferralCode();
        user.pin = await bcryptjs_1.default.hash(pin, helpers_1.SALT_ROUNDS);
        user.registrationStatus = auth_1.RegistrationStatus.ACTIVE;
        const tokens = (0, helpers_1.generateTokens)({
            id: user._id.toString(),
            email: user.email,
        });
        user.refreshToken = tokens.refreshToken;
        await user.save();
        const counts = await Count_1.CountModel.findOne({});
        if (counts) {
            const currentMonth = counts.users?.month?.key;
            const currentYear = counts.users?.year?.key;
            const currentMonthAllCount = counts.users?.month?.all || 0;
            const currentMonthActiveCount = counts.users?.month?.active || 0;
            const currentMonthInactiveCount = counts.users?.month?.inactive || 0;
            const currentYearAllCount = counts.users?.year?.all || 0;
            const currentYearActiveCount = counts.users?.year?.active || 0;
            const currentYearInactiveCount = counts.users?.year?.inactive || 0;
            if (currentMonth === (0, helpers_1.getCurrentMonth)()) {
                counts.users.month.active = currentMonthActiveCount + 1;
                counts.users.month.inactive = currentMonthInactiveCount - 1;
                counts.users.month.all = currentMonthAllCount;
            }
            else {
                counts.users.month.all = 1;
                counts.users.month.active = 1;
                counts.users.month.inactive = 0;
                counts.users.month.key = (0, helpers_1.getCurrentMonth)();
            }
            if (currentYear === (0, helpers_1.getCurrentYear)()) {
                counts.users.year.active = currentYearActiveCount + 1;
                counts.users.year.inactive = currentYearInactiveCount - 1;
                counts.users.year.all = currentYearAllCount;
            }
            else {
                counts.users.year.all = 1;
                counts.users.year.active = 1;
                counts.users.year.inactive = 0;
                counts.users.year.key = (0, helpers_1.getCurrentYear)();
            }
            counts.users.active += 1;
            counts.users.inactive -= 1;
            await counts.save();
        }
        return (0, responseWrapper_1.successResponse)('PIN setup successfully', tokens);
    }
    async login(data) {
        const { email, password } = data;
        const user = await User_1.UserModel.findOne({ email });
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (user.registrationStatus !== auth_1.RegistrationStatus.ACTIVE)
            throw new customErrors_1.UnauthorizedError('Incomplete account creation');
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Invalid email or password');
        const tokens = (0, helpers_1.generateTokens)({
            id: user._id.toString(),
            email: user.email,
        });
        user.refreshToken = tokens.refreshToken;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Login successfully', tokens);
    }
    async confirmPin(data, req) {
        const { pin } = data;
        const user = await User_1.UserModel.findById(req.user._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        if (!user.pin)
            throw new customErrors_1.UnauthorizedError('No pin set');
        const isMatch = await bcryptjs_1.default.compare(pin, user.pin);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Incorrect pin');
        return (0, responseWrapper_1.successResponse)('Pin verified successfully');
    }
    async logout(req) {
        const user = await User_1.UserModel.findById(req.user?._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        user.refreshToken = undefined;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Logged out successfully');
    }
    async deleteAccount(req, data) {
        const { password, reason } = data;
        const user = await User_1.UserModel.findById(req.user._id);
        if (!user)
            throw new customErrors_1.NotFoundError('User not found');
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Incorrect password');
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
        if (reason)
            await Reason_1.ReasonModel.create({
                email: user.email,
                reason,
            });
        await User_1.UserModel.deleteOne(user._id);
        return (0, responseWrapper_1.successResponse)('Account deleted successfully');
    }
    async refreshToken(data) {
        const { refreshToken } = data;
        const decoded = jsonwebtoken_1.default.verify(refreshToken, helpers_1.REFRESH_TOKEN_SECRET);
        const user = await User_1.UserModel.findById(decoded._id);
        if (!user)
            throw new customErrors_1.NotFoundError('Invalid refresh token');
        const token = (0, helpers_1.generateTokens)({
            id: user._id.toString(),
            email: user.email,
            type: 'access',
        });
        return (0, responseWrapper_1.successResponse)('Token generated successfully', token);
    }
    async resetPassword(data) {
        const { email, otp, password } = data;
        const user = await User_1.UserModel.findOne({ email });
        if (!user ||
            user.otp !== otp ||
            !user.otpExpiresAt ||
            user.otpExpiresAt < new Date())
            throw new customErrors_1.BadRequestError('Invalid or expired OTP');
        const hashedPassword = await bcryptjs_1.default.hash(password, helpers_1.SALT_ROUNDS);
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        user.password = hashedPassword;
        await user.save();
        return (0, responseWrapper_1.successResponse)('Password changed successfully');
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, tsoa_1.Post)('/send-otp'),
    (0, validateRequest_1.Validate)(auth_1.SendOtpSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, tsoa_1.Post)('/verify-email'),
    (0, validateRequest_1.Validate)(auth_1.VerifyEmailSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, tsoa_1.Post)('/complete-basic-profile'),
    (0, validateRequest_1.Validate)(auth_1.CompleteBasicProfileSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeBasicProfile", null);
__decorate([
    (0, tsoa_1.Post)('/complete-additional-profile'),
    (0, validateRequest_1.Validate)(auth_1.CompleteAdditionalProfileSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeAdditionalProfile", null);
__decorate([
    (0, tsoa_1.Post)('/setup-pin'),
    (0, validateRequest_1.Validate)(auth_1.SetupPinSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setupPin", null);
__decorate([
    (0, tsoa_1.Post)('/login'),
    (0, validateRequest_1.Validate)(auth_1.LoginSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Post)('/confirm-pin'),
    (0, validateRequest_1.Validate)(auth_1.ConfirmPinSchema),
    (0, tsoa_1.Security)('BearerAuth'),
    __param(0, (0, tsoa_1.Body)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmPin", null);
__decorate([
    (0, tsoa_1.Get)('/logout'),
    (0, tsoa_1.Security)('BearerAuth'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, tsoa_1.Delete)('/delete-account'),
    (0, validateRequest_1.Validate)(auth_1.DeleteAccountSchema),
    (0, tsoa_1.Security)('BearerAuth'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteAccount", null);
__decorate([
    (0, tsoa_1.Post)('/refresh-token'),
    (0, validateRequest_1.Validate)(auth_1.RefreshTokenSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, tsoa_1.Patch)('/reset-password'),
    (0, validateRequest_1.Validate)(auth_1.ResetPasswordSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, tsoa_1.Tags)('Auth'),
    (0, tsoa_1.Route)('auth')
], AuthController);
//# sourceMappingURL=AuthController.js.map