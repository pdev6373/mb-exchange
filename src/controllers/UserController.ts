import {
  Route,
  Tags,
  Request,
  Get,
  Security,
  Patch,
  Body,
  Path,
  Post,
  Delete,
} from 'tsoa';
import { User, UserModel } from '../models/User';
import { successResponse } from '../utils/responseWrapper';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import { Request as ExpressRequest } from 'express';
import {
  AddBankSchema,
  EnableNotificationsSchema,
  IAddBankInput,
  IEnableNotificationsInput,
  IMakeTransactionInput,
  IUpdateBankInput,
  IUpdatePasswordInput,
  IUpdatePinInput,
  IUpdateProfileInput,
  MakeTransactionSchema,
  RewardStatus,
  TransactionStatus,
  UpdateBankSchema,
  UpdatecProfileSchema,
  UpdatePasswordSchema,
  UpdatePinSchema,
} from '../schemas/user';
import { Validate } from '../middleware/validateRequest';
import {
  getCurrentMonth,
  getCurrentYear,
  getFlagEmojiFromCode,
  isValidPhoneNumber,
  SALT_ROUNDS,
} from '../utils/helpers';
import bcrypt from 'bcryptjs';
import { Transaction, TransactionModel } from '../models/Transaction';
import { AssetModel } from '../models/Asset';
import { Reward, RewardModel } from '../models/Reward';
import { ObjectId } from 'mongoose';
import { CountModel } from '../models/Count';
import axios from 'axios';
import { BanksModel } from '../models/Banks';

@Tags('User')
@Route('user')
@Security('BearerAuth')
export class UserController {
  private isDataExpired = (lastUpdated: Date) => {
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
    return Date.now() - lastUpdated.getTime() > threeDaysInMillis;
  };

  public formatNumber = (number: number) => {
    const roundedNumber = Math.abs(Math.floor(number * 100) / 100);
    if (roundedNumber >= 1000)
      return `${roundedNumber.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    return `${roundedNumber.toFixed(2)}`;
  };

  private fetchBanksFromPaystack = async (country: string) => {
    try {
      const response = await axios.get(`https://api.paystack.co/bank`, {
        params: { country },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data.data?.filter((bank: any) => bank.active);
    } catch (error: any) {
      console.error('Error fetching banks from Paystack:', error?.message);
      throw new NotFoundError('could not find bank');
    }
  };

  @Get('/assets')
  public async getAssets(@Request() req: ExpressRequest) {
    const userCurrencyCode = (
      req?.user as User
    ).country?.currency?.toLowerCase();

    const assets = await AssetModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .transform((documents) =>
        documents.map((asset) => {
          let displayRate = asset.rate;
          let currencySymbol = '$';

          if (userCurrencyCode === 'ngn') {
            displayRate = asset.ngnRate;
            currencySymbol = '₦';
          } else if (userCurrencyCode === 'ghs' || userCurrencyCode === 'ghc') {
            displayRate = asset.ghcRate;
            currencySymbol = 'GH₵';
          }

          return {
            ...asset,
            rate: `${currencySymbol}${this.formatNumber(displayRate)}`,
          };
        }),
      );
    return successResponse('Assets fetched successfully', assets);
  }

  @Get('/:id')
  public async getAsset(@Path() id: string, @Request() req: ExpressRequest) {
    const userCurrencyCode = (
      req?.user as User
    ).country?.currency?.toLowerCase();

    const asset = await AssetModel.findById(id).lean();

    if (!asset) throw new NotFoundError('Asset not found');

    let displayRate = asset.rate;
    let currencySymbol = '$';

    if (userCurrencyCode === 'ngn') {
      displayRate = asset.ngnRate;
      currencySymbol = '₦';
    } else if (userCurrencyCode === 'ghs' || userCurrencyCode === 'ghc') {
      displayRate = asset.ghcRate;
      currencySymbol = 'GH₵';
    }
    const formattedAsset = {
      ...asset,
      rate: `${currencySymbol}${this.formatNumber(displayRate)}`,
    };

    return successResponse('Asset fetched successfully', formattedAsset);
  }

  private async getUniqueTransactionId() {
    let transactionId: string = '';
    let isUnique = false;
    const timestamp = Date.now();
    const randomComponent = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase();

    while (!isUnique) {
      transactionId = `TXN-${timestamp}${randomComponent}`;
      const existingUser = await TransactionModel.findOne({
        key: transactionId,
      });
      if (!existingUser) isUnique = true;
    }

    return transactionId;
  }

  private async getUniqueRewardId() {
    let rewardId: string = '';
    let isUnique = false;
    const timestamp = Date.now();
    const randomComponent = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase();

    while (!isUnique) {
      rewardId = `RWD-${timestamp}${randomComponent}`;
      const existingUser = await RewardModel.findOne({
        key: rewardId,
      });
      if (!existingUser) isUnique = true;
    }

    return rewardId;
  }
  @Get('/')
  public async getUser(@Request() req: ExpressRequest) {
    req.user.refreshToken = undefined;
    return successResponse('User fetched successfully', req.user as User);
  }

  @Patch('/')
  @Validate(UpdatecProfileSchema)
  public async updateUser(
    @Body() data: IUpdateProfileInput,
    @Request() req: ExpressRequest,
  ) {
    let {
      country,
      dateOfBirth,
      firstName,
      gender,
      lastName,
      phoneNumber,
      userName,
    } = data;
    const user = await UserModel.findById(req.user?._id).select(
      '-password -pin -refreshToken',
    );
    if (!user) throw new NotFoundError('User not found');

    if (phoneNumber) {
      const phoneNumberExists = await UserModel.findOne({
        phoneNumber,
        _id: { $ne: user._id },
      });
      if (phoneNumberExists) throw new BadRequestError('Phone number taken');

      const currentCountryCode = user?.country?.code;

      if (
        !country &&
        (!currentCountryCode ||
          !isValidPhoneNumber(phoneNumber, currentCountryCode))
      )
        throw new BadRequestError('Phone number and country mismatch');

      if (country?.name) {
        const newCountryCode = country.code;

        if (!isValidPhoneNumber(phoneNumber, newCountryCode))
          throw new BadRequestError('Phone number and country mismatch');

        if (
          newCountryCode !== currentCountryCode &&
          phoneNumber == user?.phoneNumber
        )
          throw new BadRequestError('Phone number and country mismatch');

        user.country = {
          code: newCountryCode,
          name: country.name,
          flag: getFlagEmojiFromCode(newCountryCode),
          currency: country.currency,
        };
      }

      user.phoneNumber = phoneNumber;
    }

    if (country && !phoneNumber)
      throw new BadRequestError('Phone number and country mismatch');

    if (userName && userName !== user.userName) {
      const userNameExists = await UserModel.findOne({
        userName,
        _id: { $ne: user._id },
      });
      if (userNameExists) throw new BadRequestError('Username taken');
      user.userName = userName;
    }
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (firstName && firstName !== user.firstName) user.firstName = firstName;
    if (lastName && lastName !== user.lastName) user.lastName = lastName;
    if (gender && gender !== user.gender) user.gender = gender;
    await user.save();

    return successResponse('Profile updated successfully', user as User);
  }

  @Patch('/password')
  @Validate(UpdatePasswordSchema)
  public async updatePassword(
    @Body() data: IUpdatePasswordInput,
    @Request() req: ExpressRequest,
  ) {
    const { newPassword, oldPassword } = data;
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password!);
    if (!isMatch) throw new BadRequestError('Incorrect password');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    return successResponse('Password updated successfully');
  }

  @Patch('/pin')
  @Validate(UpdatePinSchema)
  public async updatePin(
    @Body() data: IUpdatePinInput,
    @Request() req: ExpressRequest,
  ) {
    const { newPin, oldPin } = data;
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(oldPin, user.pin!);
    if (!isMatch) throw new BadRequestError('Incorrect pin');

    const hashedPin = await bcrypt.hash(newPin, SALT_ROUNDS);
    user.pin = hashedPin;
    await user.save();

    return successResponse('Pin updated successfully');
  }

  @Post('/enable-notifications')
  @Validate(EnableNotificationsSchema)
  public async enableNotifications(
    @Body() data: IEnableNotificationsInput,
    @Request() req: ExpressRequest,
  ) {
    const { enable } = data;

    const user = await UserModel.findByIdAndUpdate(
      req?.user?._id,
      { notificationsEnabled: enable },
      { new: true },
    );

    return successResponse(
      enable ? 'Notifications enabled' : 'Notifications disabled',
      user?.notificationsEnabled,
    );
  }

  @Patch('/push-token/:pushToken')
  public async pushToken(
    @Request() req: ExpressRequest,
    @Path() pushToken: string,
  ) {
    await UserModel.findByIdAndUpdate(req?.user?._id, {
      pushToken,
    });

    return successResponse('Token updated successfully');
  }

  @Get('/all-banks/:country')
  public async getAllBanks(@Path() country: string) {
    let banks = await BanksModel.findOne();
    const lowercaseCountry = country.toLowerCase();

    if (
      !banks ||
      this.isDataExpired(new Date(banks.updatedAt)) ||
      banks.country !== lowercaseCountry
    ) {
      const freshData = await this.fetchBanksFromPaystack(lowercaseCountry);

      if (banks) {
        banks.data = freshData;
        banks.country = lowercaseCountry;
        await banks?.save();
      } else {
        banks = new BanksModel({ data: freshData, country: lowercaseCountry });
        await banks.save();
      }
    }

    return successResponse('Banks fetched successfully', banks.data);
  }

  @Get('/rewards')
  public async getRewards(@Request() req: ExpressRequest) {
    const rewards = await RewardModel.find({
      'user.id': req?.user?._id?.toString(),
    });
    return successResponse('Rewards fetched successfully', rewards as Reward[]);
  }

  @Get('/transactions')
  public async getTransactions(@Request() req: ExpressRequest) {
    const transactions = await TransactionModel.find({
      'user.id': req.user._id.toString(),
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      'Transactions fetched successfully',
      transactions as Transaction[],
    );
  }

  @Get('/transactions/:id')
  public async getTransaction(@Path() id: string) {
    const transaction = await TransactionModel.findById(id).lean();
    if (!transaction) throw new NotFoundError('Transaction not found');
    return successResponse(
      'Transaction fetched successfully',
      transaction as Transaction,
    );
  }

  @Post('/transaction')
  @Validate(MakeTransactionSchema)
  public async makeTransaction(
    @Body() data: IMakeTransactionInput,
    @Request() req: ExpressRequest,
  ) {
    const { assetId, address, quantity, proof, platform, rate } = data;
    const assetExist = await AssetModel.findById(assetId);
    if (!assetExist) throw new NotFoundError('Asset not found');

    const platforms = assetExist.platformAddresses;
    const platformExist = platforms.find((pl) => pl.platform === platform);

    if (!platformExist) throw new NotFoundError('Platform not found');
    if (platformExist.address !== address)
      throw new BadRequestError('Invalid address');

    const user = req.user as unknown as User & {
      _id: ObjectId;
    };
    const key = await this.getUniqueTransactionId();
    await TransactionModel.create({
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
      rate,
      status: TransactionStatus.PENDING,
      key,
    });

    const counts = await CountModel.findOne({});
    if (counts) {
      const currentMonth = counts.transactions?.month?.key;
      const currentYear = counts.transactions?.year?.key;

      const currentMonthAllCount = counts.transactions?.month?.all || 0;
      const currentMonthPendingCount = counts.transactions?.month?.pending || 0;
      const currentMonthSuccessfulCount =
        counts.transactions?.month?.successful || 0;
      const currentMonthFailedCount = counts.transactions?.month?.failed || 0;

      const currentYearAllCount = counts.transactions?.year?.all || 0;
      const currentYearPendingCount = counts.transactions?.year?.pending || 0;
      const currentYearSuccessfulCount =
        counts.transactions?.year?.successful || 0;
      const currentYearFailedCount = counts.transactions?.year?.failed || 0;

      if (currentMonth === getCurrentMonth()) {
        counts.transactions.month.all = currentMonthAllCount + 1;
        counts.transactions.month.pending = currentMonthPendingCount + 1;
        counts.transactions.month.failed = currentMonthFailedCount;
        counts.transactions.month.successful = currentMonthSuccessfulCount;
      } else {
        counts.transactions.month.all = 1;
        counts.transactions.month.pending = 1;
        counts.transactions.month.failed = 0;
        counts.transactions.month.successful = 0;
        counts.transactions.month.key = getCurrentMonth();
      }

      if (currentYear === getCurrentYear()) {
        counts.transactions.year.all = currentYearAllCount + 1;
        counts.transactions.year.pending = currentYearPendingCount + 1;
        counts.transactions.year.failed = currentYearFailedCount;
        counts.transactions.year.successful = currentYearSuccessfulCount;
      } else {
        counts.transactions.year.all = 1;
        counts.transactions.year.pending = 1;
        counts.transactions.year.failed = 0;
        counts.transactions.year.successful = 0;
        counts.transactions.year.key = getCurrentYear();
      }

      counts.transactions.all += 1;
      counts.transactions.pending += 1;
      await counts.save();
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: req.user?._id },
      { $inc: { pendingTransactions: 1, totalTransactions: 1 } },
      { new: true },
    );
    return successResponse('Transaction in process', updatedUser as User);
  }

  @Get('/reward')
  public async payReward(@Request() req: ExpressRequest) {
    const user = req.user as unknown as User & {
      _id: ObjectId;
    };

    if (!user.points || user?.points < 5000)
      throw new NotFoundError('Minimum of 5000 points needed');
    if (user.pendingRewards)
      throw new NotFoundError('You have a pending reward');
    const key = await this.getUniqueRewardId();

    await RewardModel.create({
      user: {
        id: user._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      amount: 10,
      status: RewardStatus.PENDING,
      key,
    });

    const counts = await CountModel.findOne({});
    if (counts) {
      const currentMonth = counts.rewards?.month?.key;
      const currentYear = counts.rewards?.year?.key;

      const currentMonthAllCount = counts.rewards?.month?.all || 0;
      const currentMonthPendingCount = counts.rewards?.month?.pending || 0;
      const currentMonthSuccessfulCount =
        counts.rewards?.month?.successful || 0;

      const currentYearAllCount = counts.rewards?.year?.all || 0;
      const currentYearPendingCount = counts.rewards?.year?.pending || 0;
      const currentYearSuccessfulCount = counts.rewards?.year?.successful || 0;

      if (currentMonth === getCurrentMonth()) {
        counts.rewards.month.all = currentMonthAllCount + 1;
        counts.rewards.month.pending = currentMonthPendingCount + 1;
        counts.rewards.month.successful = currentMonthSuccessfulCount;
      } else {
        counts.rewards.month.all = 1;
        counts.rewards.month.pending = 1;
        counts.rewards.month.successful = 0;
        counts.rewards.month.key = getCurrentMonth();
      }

      if (currentYear === getCurrentYear()) {
        counts.rewards.year.all = currentYearAllCount + 1;
        counts.rewards.year.pending = currentYearPendingCount + 1;
        counts.rewards.year.successful = currentYearSuccessfulCount;
      } else {
        counts.rewards.year.all = 1;
        counts.rewards.year.pending = 1;
        counts.rewards.year.successful = 0;
        counts.rewards.year.key = getCurrentYear();
      }

      counts.rewards.all += 1;
      counts.rewards.pending += 1;
      await counts.save();
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: req.user?._id },
      { $inc: { pendingRewards: 1, totalRewards: 1 } },
      { new: true },
    );
    return successResponse('Reward claim in progress', updatedUser as User);
  }

  @Get('/banks')
  public async getBanks(@Request() req: ExpressRequest) {
    const user = await UserModel.findById(req.user?._id).select('banks');
    if (!user) throw new NotFoundError('User not found');

    return successResponse('Banks retrieved successfully', user.banks);
  }

  @Get('/bank/:id')
  public async getBank(@Path() id: string, @Request() req: ExpressRequest) {
    const user = await UserModel.findById(req.user?._id).select('banks');
    if (!user) throw new NotFoundError('User not found');

    const bank = user.banks?.find((b: any) => b._id.toString() === id);
    if (!bank) throw new NotFoundError('Bank not found');
    return successResponse('Bank retrieved successfully', bank);
  }

  @Post('/bank')
  @Validate(AddBankSchema)
  public async addBank(
    @Body() data: IAddBankInput,
    @Request() req: ExpressRequest,
  ) {
    const { accountName, accountNumber, bankName } = data;
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    if (!user.banks) user.banks = [];
    if (user.banks.length >= 5)
      throw new BadRequestError('Maximum of 5 accounts allowed');

    user.banks.push({
      accountName,
      accountNumber,
      bankName,
      default: !user.banks.length,
    });
    await user.save();
    return successResponse('Bank added successfully', user.banks);
  }

  @Patch('/bank/:id')
  @Validate(UpdateBankSchema)
  public async updateBank(
    @Path() id: string,
    @Request() req: ExpressRequest,
    @Body() bank: IUpdateBankInput,
  ) {
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    if (!user.banks || user.banks.length === 0)
      throw new NotFoundError('No banks found');

    const bankIndex = user.banks?.findIndex((b: any) => b._id.toString() == id);
    if (bankIndex === -1) throw new NotFoundError('Bank not found');

    Object.assign(user.banks[bankIndex], bank);
    await user.save();

    return successResponse('Bank updated successfully', user.banks[bankIndex]);
  }

  @Delete('/bank/:id')
  public async deleteBank(@Path() id: string, @Request() req: ExpressRequest) {
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    if (!user.banks || user.banks.length === 0)
      throw new NotFoundError('No banks found');

    const bankIndex = user.banks.findIndex((b: any) => b._id.toString() === id);
    if (bankIndex === -1) throw new NotFoundError('Bank not found');

    const wasDefault = user.banks[bankIndex].default;
    user.banks.splice(bankIndex, 1);

    if (wasDefault && user.banks.length > 0) user.banks[0].default = true;
    await user.save();

    return successResponse('Bank deleted successfully', user.banks);
  }

  @Patch('/bank/default/:id')
  public async setDefaultBank(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ) {
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    if (!user.banks || user.banks.length === 0)
      throw new NotFoundError('No banks found');

    const bankIndex = user.banks.findIndex((b: any) => b._id.toString() === id);
    if (bankIndex === -1) throw new NotFoundError('Bank not found');

    user.banks.forEach((b: any) => (b.default = false));
    user.banks[bankIndex].default = true;
    await user.save();

    return successResponse('Default bank updated successfully', user.banks);
  }
}
