import {
  Route,
  Tags,
  Request,
  Get,
  Security,
  Patch,
  Body,
  Post,
  Delete,
  Path,
  Query,
} from 'tsoa';
import { successResponse } from '../utils/responseWrapper';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/customErrors';
import { Request as ExpressRequest } from 'express';
import {
  AddAdminSchema,
  AddNotificationSchema,
  IAddAdminInput,
  IAddNotificationInput,
  IUpdateAdminInput,
  Role,
  UpdateAdminSchema,
} from '../schemas/admin';
import { Validate } from '../middleware/validateRequest';
import {
  generateTokens,
  getCurrentMonth,
  getCurrentYear,
  SALT_ROUNDS,
} from '../utils/helpers';
import bcrypt from 'bcryptjs';
import { Admin, AdminModel } from '../models/Admin';
import {
  IUpdatePasswordInput,
  NotificationSlug,
  UpdatePasswordSchema,
} from '../schemas/user';
import { sendMail } from '../utils/mailSender';
import { Transaction, TransactionModel } from '../models/Transaction';
import { RewardStatusType, TransactionStatusType } from '../types';
import { User, UserModel } from '../models/User';
import { Reward, RewardModel } from '../models/Reward';
import { CountModel } from '../models/Count';
import { Notification, NotificationModel } from '../models/Notification';
import { RegistrationStatus } from '../schemas/auth';

@Tags('Admin')
@Route('admin')
@Security('BearerAuth', Object.values(Role))
export class AdminController {
  @Get('/')
  public async getAdmin(@Request() req: ExpressRequest) {
    req.user.refreshToken = undefined;
    return successResponse('Admin fetched successfully', req.user);
  }

  @Post('/')
  @Validate(AddAdminSchema)
  @Security('BearerAuth', [Role.SUPER_ADMIN])
  public async addAdmin(
    @Body() data: IAddAdminInput,
    @Request() req: ExpressRequest,
  ) {
    const { email, name, role } = data;

    if (req.user?.email == email)
      throw new UnauthorizedError('You are already an admin');

    const existingActiveAdmin = await AdminModel.findOne({
      email,
      isActive: true,
    }).lean();
    if (existingActiveAdmin) throw new BadRequestError('Admin already exists');

    const existingAdmin = await AdminModel.findOne({
      email,
    });
    if (existingAdmin) await AdminModel.deleteOne(existingAdmin._id);

    const admin = await AdminModel.create({
      email,
      name,
      role,
      invitationExpires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      isActive: false,
    });

    const token = generateTokens({
      id: admin._id.toString(),
      email,
      role,
      accessExpiry: '2d',
      type: 'access',
    });
    admin.invitationToken = token.accessToken;
    await admin.save();

    const invitationLink = `https://mbexchangehub.com/auth/admin/invite?token=${token.accessToken}`;

    await sendMail({
      subject: 'Admin Invitation',
      to: email,
      html: `<p>Click <a href=${invitationLink} target="_blank">here</a> here to accept the request</p>`,
    });
    return successResponse('Admin request sent successfully');
  }

  @Get('/all')
  public async getAdmins() {
    const now = new Date();
    await AdminModel.deleteMany({
      invitationExpires: { $exists: true, $lt: now },
    });

    const admins = await AdminModel.find().select('-password');
    return successResponse('Admins fetched successfully', admins as Admin[]);
  }

  @Patch('/')
  @Validate(UpdateAdminSchema)
  public async updateAdmin(
    @Body() data: IUpdateAdminInput,
    @Request() req: ExpressRequest,
  ) {
    let admin;
    const { name } = data;
    if (name)
      admin = await AdminModel.findByIdAndUpdate(
        req.user._id,
        { name },
        { new: true },
      );

    return successResponse('Profile updated successfully', admin as Admin);
  }

  @Patch('/:id')
  @Validate(UpdateAdminSchema)
  @Security('BearerAuth', [Role.SUPER_ADMIN])
  public async updateAdminData(
    @Path() id: string,
    @Body() data: IUpdateAdminInput,
    @Request() req: ExpressRequest,
  ) {
    const { name, role } = data;
    const admin = await AdminModel.findById(id);
    if (!admin) throw new NotFoundError('Admin not found');

    if (name) admin.name = name;
    if (role && admin.role !== 'superadmin') admin.role = role;
    await admin.save();

    return successResponse('Admin updated successfully', admin as Admin);
  }

  @Delete('/:id')
  @Security('BearerAuth', [Role.SUPER_ADMIN])
  public async removeAdmin(@Path() id: string, @Request() req: ExpressRequest) {
    if (req.user?._id.toString() == id)
      throw new UnauthorizedError("You can't delete your account");

    await AdminModel.findByIdAndDelete(id);
    return successResponse('Admin removed successfully');
  }

  @Patch('/password')
  @Validate(UpdatePasswordSchema)
  public async updatePassword(
    @Body() data: IUpdatePasswordInput,
    @Request() req: ExpressRequest,
  ) {
    const { newPassword, oldPassword } = data;
    const admin = await AdminModel.findById(req.user?._id);
    if (!admin) throw new NotFoundError('Admin not found');

    const isMatch = await bcrypt.compare(oldPassword, admin.password!);
    if (!isMatch) throw new BadRequestError('Incorrect password');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    admin.password = hashedPassword;
    await admin.save();

    return successResponse('Password updated successfully');
  }

  @Get('/users')
  public async getUsers(
    @Query() page = 1,
    @Query() limit = 10,
    @Query() status: 'active' | 'inactive' | 'all' = 'all',
    @Query() sort?: 'asc' | 'desc',
    @Query() search?: string,
  ) {
    const filter: any = { emailVerified: true };

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
    const users = (await UserModel.find(filter)
      .select('-password -pin')
      .sort({
        createdAt: sort || 'desc',
      })
      .skip(skip)
      .limit(Number(limit))
      .lean()) as User[];

    const totalUsers = await UserModel.countDocuments(filter);
    return successResponse('Users fetched successfully', {
      data: users as User[],
      pagination: {
        total: totalUsers,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalUsers / Number(limit)),
      },
    });
  }

  @Get('/users/:id')
  public async getUser(@Path() id: string) {
    const user = await UserModel.findById(id).select('-password -pin').lean();
    return successResponse('User fetched successfully', user as User);
  }

  @Delete('/users/:id')
  public async deleteUser(@Path() id: string) {
    const user = await UserModel.findById(id).lean();
    if (!user) throw new NotFoundError('User not found');

    const userMonthCreated = getCurrentMonth(user?.createdAt);
    const userYearCreated = getCurrentYear(user?.createdAt);

    const counts = await CountModel.findOne({});
    if (counts) {
      const currentMonth = counts.users?.month?.key;
      const currentYear = counts.users?.year?.key;

      if (userMonthCreated == currentMonth && userYearCreated == currentYear) {
        counts.users.month.all -= 1;
        counts.users.year.all -= 1;
        if (user.registrationStatus == RegistrationStatus.ACTIVE) {
          counts.users.month.active -= 1;
          counts.users.year.active -= 1;
        } else {
          counts.users.month.inactive -= 1;
          counts.users.year.inactive -= 1;
        }
      }

      counts.users.all -= 1;
      if (user.registrationStatus == RegistrationStatus.ACTIVE)
        counts.users.active -= 1;
      else counts.users.inactive -= 1;
      await counts.save();
    }

    await UserModel.deleteOne(user._id);
    return successResponse('User deleted successfully');
  }

  @Get('/transactions')
  public async getTransactions(
    @Query() page = 1,
    @Query() limit = 10,
    @Query() status: 'pending' | 'successful' | 'failed' | 'all' = 'all',
    @Query() sort?: 'asc' | 'desc',
    @Query() search?: string,
  ) {
    const filter: any = {};

    if (status && status !== 'all') filter.status = status;
    if (search)
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { 'asset.name': { $regex: search, $options: 'i' } },
        { 'platform.name': { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];

    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await TransactionModel.find(filter)
      .sort({
        createdAt: sort || 'desc',
      })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalTransactions = await TransactionModel.countDocuments(filter);
    return successResponse('Transactions fetched successfully', {
      data: transactions as Transaction[],
      pagination: {
        total: totalTransactions,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalTransactions / Number(limit)),
      },
    });
  }

  @Get('/transactions/:id')
  public async getTransaction(@Path() id: string) {
    const transaction = await TransactionModel.findById(id).lean();
    return successResponse(
      'Transaction fetched successfully',
      transaction as Transaction,
    );
  }

  @Get('/transactions/user/:id')
  public async getUserTransactions(@Path() id: string) {
    const transactions = await TransactionModel.find({ 'user.id': id }).lean();
    return successResponse(
      'Transactions fetched successfully',
      transactions as Transaction[],
    );
  }

  @Patch('/transactions/:id/:status/:amount')
  public async validateTransaction(
    @Path() id: string,
    @Path() status: TransactionStatusType,
    @Path() amount = 0,
  ) {
    const transaction = await TransactionModel.findById(id);
    if (!transaction) throw new NotFoundError('Transaction not found');
    const user = await UserModel.findById(transaction.user.id);
    if (!user) throw new NotFoundError('User not found');
    if (transaction.status == status)
      return successResponse(
        'Transaction updated successfully',
        transaction as Transaction,
      );

    if (status == 'successful' && amount <= 0)
      throw new BadRequestError(
        'Amount transferred in users currency must be provided',
      );

    const previousStatus = transaction.status;
    transaction.status = status;
    if (status == 'pending') {
      transaction.dateApproved = undefined;
      await NotificationModel.create({
        title: '⏳ Hold on! Double-Checking Your Order',
        content:
          "Your transaction is being reviewed again for accuracy. We'll update you soon!",
        slug: NotificationSlug.PENDING,
        userId: user._id,
      });
    } else {
      transaction.dateApproved = new Date();
      if (status == 'successful')
        await NotificationModel.create({
          title: '🎉 Crypto Received, Money Sent!',
          content:
            "Your transaction is complete! We've sent your payment. Thanks for selling with us!",
          slug: NotificationSlug.COMPLETED,
          userId: user._id,
        });
      else
        await NotificationModel.create({
          title: '⚠️ No Crypto Received!',
          content:
            "We didn't receive your crypto transfer. Please check your transaction details and ensure it was sent to the correct address.",
          slug: NotificationSlug.CANCELED,
          userId: user._id,
        });
    }
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
    } else if (status == 'failed') {
      user.failedTransactions = user.failedTransactions
        ? user.failedTransactions + 1
        : 1;

      if (previousStatus == 'successful') {
        user.successfulTransactions = user.successfulTransactions
          ? user.successfulTransactions - 1
          : 0;
        user.points = user?.points ? user.points - amount : 0;
        await user.save();
      } else if (previousStatus == 'pending')
        user.pendingTransactions = user.pendingTransactions
          ? user.pendingTransactions - 1
          : 0;
    } else if (status == 'pending') {
      user.pendingTransactions = user.pendingTransactions
        ? user.pendingTransactions + 1
        : 1;

      if (previousStatus == 'successful') {
        user.successfulTransactions = user.successfulTransactions
          ? user.successfulTransactions - 1
          : 0;
        user.points = user?.points ? user.points - amount : 0;
        await user.save();
      } else if (previousStatus == 'failed')
        user.failedTransactions = user.failedTransactions
          ? user.failedTransactions - 1
          : 0;
    }

    const counts = await CountModel.findOne({});
    if (counts) {
      const currentMonth = counts.transactions?.month?.key;
      const currentYear = counts.transactions?.year?.key;

      const currentRevenueMonth = counts.revenue?.month?.key;
      const currentRevenueYear = counts.transactions?.year?.key;

      if (currentMonth === getCurrentMonth()) {
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
        } else if (status == 'failed') {
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
        } else if (status == 'pending') {
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
      } else {
        if (status == 'successful') {
          counts.transactions.month.successful = 1;

          if (previousStatus == 'pending')
            counts.transactions.month.pending = 0;
          else if (previousStatus == 'failed')
            counts.transactions.month.failed = 0;
        } else if (status == 'failed') {
          counts.transactions.month.successful = 1;

          if (previousStatus == 'pending')
            counts.transactions.month.pending = 0;
          else if (previousStatus == 'successful')
            counts.transactions.month.successful = 0;
        } else if (status == 'pending') {
          counts.transactions.month.successful = 1;

          if (previousStatus == 'failed') counts.transactions.month.failed = 0;
          else if (previousStatus == 'successful')
            counts.transactions.month.successful = 0;
        }
        counts.transactions.month.key = getCurrentMonth();
      }

      if (currentYear === getCurrentYear()) {
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
        } else if (status == 'failed') {
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
        } else if (status == 'pending') {
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
      } else {
        if (status == 'successful') {
          counts.transactions.year.successful = 1;

          if (previousStatus == 'pending') counts.transactions.year.pending = 0;
          else if (previousStatus == 'failed')
            counts.transactions.year.failed = 0;
        } else if (status == 'failed') {
          counts.transactions.year.successful = 1;

          if (previousStatus == 'pending') counts.transactions.year.pending = 0;
          else if (previousStatus == 'successful')
            counts.transactions.year.successful = 0;
        } else if (status == 'pending') {
          counts.transactions.year.successful = 1;

          if (previousStatus == 'failed') counts.transactions.year.failed = 0;
          else if (previousStatus == 'successful')
            counts.transactions.year.successful = 0;
        }
        counts.transactions.year.key = getCurrentYear();
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
      } else if (status == 'failed') {
        counts.transactions.failed = counts.transactions.failed + 1;

        if (previousStatus == 'pending')
          counts.transactions.pending = counts.transactions.pending
            ? counts.transactions.pending - 1
            : 0;
        else if (previousStatus == 'successful')
          counts.transactions.successful = counts.transactions.successful
            ? counts.transactions.successful - 1
            : 0;
      } else if (status == 'pending') {
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

      if (currentRevenueMonth === getCurrentMonth()) {
        if (status == 'successful')
          counts.revenue.month.revenue =
            counts.revenue.month.revenue + transaction.amount;
        else if (status == 'failed') {
          if (previousStatus == 'successful')
            counts.revenue.month.revenue =
              counts.revenue.month.revenue - transaction.amount;
        } else if (status == 'pending') {
          if (previousStatus == 'successful')
            counts.revenue.month.revenue =
              counts.revenue.month.revenue - transaction.amount;
        }
      } else {
        if (status == 'successful')
          counts.revenue.month.revenue = transaction.amount;
        else counts.revenue.month.revenue = 0;
        counts.revenue.month.key = getCurrentMonth();
      }

      if (currentRevenueYear === getCurrentYear()) {
        if (status == 'successful')
          counts.revenue.year.revenue =
            counts.revenue.year.revenue + transaction.amount;
        else if (status == 'failed') {
          if (previousStatus == 'successful')
            counts.revenue.year.revenue =
              counts.revenue.year.revenue - transaction.amount;
        } else if (status == 'pending') {
          if (previousStatus == 'successful')
            counts.revenue.year.revenue =
              counts.revenue.year.revenue - transaction.amount;
        }
      } else {
        if (status == 'successful')
          counts.revenue.year.revenue = transaction.amount;
        else counts.revenue.year.revenue = 0;
        counts.revenue.year.key = getCurrentYear();
      }

      if (status == 'successful')
        counts.revenue.all = counts.revenue.all + transaction.amount;
      else if (status == 'failed') {
        if (previousStatus == 'successful')
          counts.revenue.all = counts.revenue.all - transaction.amount;
      } else if (status == 'pending') {
        if (previousStatus == 'successful')
          counts.revenue.all = counts.revenue.all - transaction.amount;
      }

      await counts.save();
    }

    return successResponse(
      'Transaction updated successfully',
      transaction as Transaction,
    );
  }

  @Get('/rewards')
  public async getRewards(
    @Query() page = 1,
    @Query() limit = 10,
    @Query() status: 'pending' | 'successful' | 'all' = 'all',
    @Query() sort?: 'asc' | 'desc',
    @Query() search?: string,
  ) {
    const filter: any = {};

    if (status && status !== 'all') filter.status = status;
    if (search)
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];

    const skip = (Number(page) - 1) * Number(limit);
    const rewards = await RewardModel.find(filter)
      .sort({
        createdAt: sort || 'desc',
      })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalRewards = await RewardModel.countDocuments(filter);
    return successResponse('Rewards fetched successfully', {
      data: rewards as Reward[],
      pagination: {
        total: totalRewards,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalRewards / Number(limit)),
      },
    });
  }

  @Get('/rewards/:id')
  public async getReward(@Path() id: string) {
    const reward = await RewardModel.findById(id).lean();
    return successResponse('Reward fetched successfully', reward as Reward);
  }

  @Get('/rewards/user/:id')
  public async getUserRewards(@Path() id: string) {
    const rewards = await RewardModel.find({ 'user.id': id }).lean();
    return successResponse('Rewards fetched successfully', rewards as Reward[]);
  }

  @Patch('/rewards/:id/:status')
  public async validateReward(
    @Path() id: string,
    @Path() status: RewardStatusType,
  ) {
    const reward = await RewardModel.findById(id);
    if (!reward) throw new NotFoundError('Reward not found');
    const user = await UserModel.findById(reward.user.id);
    if (!user) throw new NotFoundError('User not found');
    if (reward.status == status)
      return successResponse('Reward updated successfully', reward as Reward);

    const previousStatus = reward.status;
    reward.status = status;
    if (status == 'pending') {
      reward.dateApproved = undefined;
      await NotificationModel.create({
        title: '⏳ Hold on! Reviewing Your Reward',
        content:
          "We're taking another look at your reward cashout. No action needed—just sit tight!",
        slug: NotificationSlug.PENDING,
        userId: user._id,
      });
    } else {
      reward.dateApproved = new Date();
      await NotificationModel.create({
        title: '💸 Reward Sent!',
        content:
          'Congrats! Your reward has been sent. Check your account and enjoy your earnings! 🎊',
        slug: NotificationSlug.COMPLETED,
        userId: user._id,
      });
    }
    await reward.save();

    if (status == 'successful') {
      user.successfulRewards = user.successfulRewards
        ? user.successfulRewards + 1
        : 1;

      if (previousStatus == 'pending')
        user.pendingRewards = user.pendingRewards ? user.pendingRewards - 1 : 0;

      user.points = user.points ? user.points - 5000 : 0;
      await user.save();
    } else if (status == 'pending') {
      user.pendingRewards = user.pendingRewards ? user.pendingRewards + 1 : 1;

      if (previousStatus == 'successful') {
        user.successfulRewards = user.successfulRewards
          ? user.successfulRewards - 1
          : 0;
        user.points = user.points ? user.points + 5000 : 5000;
        await user.save();
      }
    }

    const counts = await CountModel.findOne({});
    if (counts) {
      const currentMonth = counts.rewards?.month?.key;
      const currentYear = counts.rewards?.year?.key;

      if (currentMonth === getCurrentMonth()) {
        if (status == 'successful') {
          counts.rewards.month.successful = counts.rewards.month.successful + 1;

          if (previousStatus == 'pending')
            counts.rewards.month.pending = counts.rewards.month.pending
              ? counts.rewards.month.pending - 1
              : 0;
        } else if (status == 'pending') {
          counts.rewards.month.pending = counts.rewards.month.pending + 1;

          if (previousStatus == 'successful')
            counts.rewards.month.successful = counts.rewards.month.successful
              ? counts.rewards.month.successful - 1
              : 0;
        }
      } else {
        if (status == 'successful') {
          counts.rewards.month.successful = 1;
          if (previousStatus == 'pending') counts.rewards.month.pending = 0;
        } else if (status == 'pending') {
          counts.rewards.month.successful = 1;
          if (previousStatus == 'successful')
            counts.rewards.month.successful = 0;
        }
        counts.rewards.month.key = getCurrentMonth();
      }

      if (currentYear === getCurrentYear()) {
        if (status == 'successful') {
          counts.rewards.year.successful = counts.rewards.year.successful + 1;

          if (previousStatus == 'pending')
            counts.rewards.year.pending = counts.rewards.year.pending
              ? counts.rewards.year.pending - 1
              : 0;
        } else if (status == 'pending') {
          counts.rewards.year.pending = counts.rewards.year.pending + 1;

          if (previousStatus == 'successful')
            counts.rewards.year.successful = counts.rewards.year.successful
              ? counts.rewards.year.successful - 1
              : 0;
        }
      } else {
        if (status == 'successful') {
          counts.rewards.year.successful = 1;
          if (previousStatus == 'pending') counts.rewards.year.pending = 0;
        } else if (status == 'pending') {
          counts.rewards.year.successful = 1;
          if (previousStatus == 'successful')
            counts.rewards.year.successful = 0;
        }
        counts.rewards.year.key = getCurrentYear();
      }

      if (status == 'successful') {
        counts.rewards.successful = counts.rewards.successful + 1;
        if (previousStatus == 'pending')
          counts.rewards.pending = counts.rewards.pending
            ? counts.rewards.pending - 1
            : 0;
      } else if (status == 'pending') {
        counts.rewards.pending = counts.rewards.pending + 1;
        if (previousStatus == 'successful')
          counts.rewards.successful = counts.rewards.successful
            ? counts.rewards.successful - 1
            : 0;
      }
      await counts.save();
    }

    return successResponse('Reward updated successfully', reward as Reward);
  }

  @Get('/notifications')
  public async getNotifications(
    @Query() page = 1,
    @Query() limit = 10,
    @Query() sort?: 'asc' | 'desc',
    @Query() search?: string,
  ) {
    const filter: any = {
      $or: [{ userId: { $exists: false } }, { userId: null }],
    };

    if (search)
      filter.$and = [
        {
          $or: [{ userId: { $exists: false } }, { userId: null }],
        },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
          ],
        },
      ];

    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await NotificationModel.find(filter)
      .sort({
        createdAt: sort || 'desc',
      })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalNotifications = await NotificationModel.countDocuments(filter);
    return successResponse('Notifications fetched successfully', {
      data: notifications as Notification[],
      pagination: {
        total: totalNotifications,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalNotifications / Number(limit)),
      },
    });
  }

  @Post('/notifications')
  @Validate(AddNotificationSchema)
  public async addNotification(@Body() data: IAddNotificationInput) {
    const { content, title } = data;
    await NotificationModel.create({
      content,
      title,
      slug: NotificationSlug.INFO,
    });
    return successResponse('Notification added successfully');
  }

  @Get('/counts')
  public async getCounts() {
    const counts = await CountModel.findOne({}).lean();
    return successResponse('Count fetched successfully', counts);
  }
}
