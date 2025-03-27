import {
  Route,
  Post,
  Body,
  Tags,
  Security,
  Request,
  Delete,
  Patch,
  Get,
} from 'tsoa';
import { UserModel } from '../models/User';
import {
  SendOtpSchema,
  CompleteBasicProfileSchema,
  CompleteAdditionalProfileSchema,
  SetupPinSchema,
  ISendOtpInput,
  ICompleteBasicProfileInput,
  ICompleteAdditionalProfileInput,
  ISetupPinInput,
  ILoginInput,
  LoginSchema,
  RefreshTokenSchema,
  IRefreshTokenInput,
  IDeleteAccountInput,
  DeleteAccountSchema,
  IResetPasswordInput,
  ResetPasswordSchema,
  VerifyEmailSchema,
  IVerifyEmailInput,
  RegistrationStatus,
  ConfirmPinSchema,
  IConfirmPinInput,
  OTPType,
} from '../schemas/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Validate } from '../middleware/validateRequest';
import { errorResponse, successResponse } from '../utils/responseWrapper';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/customErrors';
import { Request as ExpressRequest } from 'express';
import {
  generateOtp,
  generateTokens,
  getCurrentMonth,
  getCurrentYear,
  getFlagEmojiFromCode,
  isValidCountryCode,
  isValidPhoneNumber,
  REFRESH_TOKEN_SECRET,
  SALT_ROUNDS,
} from '../utils/helpers';
import { sendMail } from '../utils/mailSender';
import { CountModel } from '../models/Count';
import { ReasonModel } from '../models/Reason';

@Tags('Auth')
@Route('auth')
export class AuthController {
  private async getUniqueReferralCode() {
    let referralCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      referralCode = `MBE-${Math.random()
        .toString(36)
        .substring(2, 9)
        .toUpperCase()}`;
      const existingUser = await UserModel.findOne({ referralCode });
      if (!existingUser) isUnique = true;
    }

    return referralCode;
  }

  @Post('/send-otp')
  @Validate(SendOtpSchema)
  public async sendOtp(@Body() data: ISendOtpInput) {
    let { email, type } = data;
    email = email.toLowerCase();

    let user = await UserModel.findOne({ email });

    if (type === OTPType.REGISTER) {
      if (user?.registrationStatus === RegistrationStatus.ACTIVE)
        return successResponse('You already have an active account', {
          hasActiveAccount: true,
        });

      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user = await UserModel.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          otpExpiresAt,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      await sendMail({
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
        to: email,
      });

      return successResponse('OTP sent successfully', {
        hasActiveAccount:
          user?.registrationStatus === RegistrationStatus.ACTIVE,
      });
    }

    if (!user) throw new NotFoundError('No user found');

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user = await UserModel.findOneAndUpdate(
      { email },
      { otp, otpExpiresAt },
      { new: true },
    );

    await sendMail({
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      to: email,
    });

    return successResponse('OTP sent successfully', {
      hasActiveAccount: user?.registrationStatus === RegistrationStatus.ACTIVE,
    });
  }

  @Post('/verify-email')
  @Validate(VerifyEmailSchema)
  public async verifyEmail(@Body() data: IVerifyEmailInput) {
    const { email, otp } = data;
    const user = await UserModel.findOne({ email });
    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    )
      throw new BadRequestError('Invalid or expired OTP');

    const wasUnVerified = !user.emailVerified;
    if (wasUnVerified) {
      const counts = await CountModel.findOne({});
      if (!counts)
        await CountModel.create({
          users: {
            active: 0,
            inactive: 1,
            all: 1,
            month: {
              active: 0,
              inactive: 1,
              all: 1,
              key: getCurrentMonth(),
            },
            year: {
              active: 0,
              inactive: 1,
              all: 1,
              key: getCurrentYear(),
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

        if (currentMonth === getCurrentMonth()) {
          counts.users.month.all = currentMonthAllCount + 1;
          counts.users.month.inactive = currentMonthInactiveCount + 1;
          counts.users.month.active = currentMonthActiveCount;
        } else {
          counts.users.month.all = 1;
          counts.users.month.active = 0;
          counts.users.month.inactive = 1;
          counts.users.month.key = getCurrentMonth();
        }

        if (currentYear === getCurrentYear()) {
          counts.users.year.all = currentYearAllCount + 1;
          counts.users.year.inactive = currentYearInactiveCount + 1;
          counts.users.year.active = currentYearActiveCount;
        } else {
          counts.users.year.all = 1;
          counts.users.year.active = 0;
          counts.users.year.inactive = 1;
          counts.users.year.key = getCurrentYear();
        }

        counts.users.inactive += 1;
        counts.users.all += 1;
        await counts.save();
      }
    }

    if (wasUnVerified) user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return successResponse('Email verified successfully', {
      registrationStatus: user.registrationStatus,
    });
  }

  @Post('/complete-basic-profile')
  @Validate(CompleteBasicProfileSchema)
  public async completeBasicProfile(@Body() data: ICompleteBasicProfileInput) {
    const { email, firstName, lastName, referrer, password, userName } = data;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFoundError('User not found');
    if (user.registrationStatus) throw new UnauthorizedError();

    const [userNameExists, referrerUser] = await Promise.all([
      userName ? UserModel.findOne({ userName }) : null,
      referrer ? UserModel.findOne({ referralCode: referrer }) : null,
    ]);

    if (userNameExists) throw new BadRequestError('Username taken');
    if (referrer && !referrerUser)
      throw new NotFoundError('Referrer not found');

    user.firstName = firstName;
    user.lastName = lastName;
    user.password = hashedPassword;
    user.userName = userName;
    user.registrationStatus = RegistrationStatus.INCOMPLETE;

    if (referrerUser) {
      user.referrer = {
        id: referrerUser._id.toString(),
        firstName: referrerUser.firstName,
        lastName: referrerUser.lastName,
      };
      referrerUser.referred = (referrerUser.referred || 0) + 1;
    }

    await Promise.all([user.save(), referrerUser?.save()]);
    return successResponse('Basic profile completed successfully');
  }

  @Post('/complete-additional-profile')
  @Validate(CompleteAdditionalProfileSchema)
  public async completeAdditionalProfile(
    @Body() data: ICompleteAdditionalProfileInput,
  ) {
    const { email, country, phoneNumber, dateOfBirth, gender } = data;

    if (!isValidCountryCode(country.code))
      throw new BadRequestError('Invalid country code');

    if (!isValidPhoneNumber(phoneNumber, country.code))
      throw new BadRequestError('Phone number and country mismatch');

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFoundError('User not found');
    if (user.registrationStatus !== RegistrationStatus.INCOMPLETE)
      throw new UnauthorizedError();

    const phoneNumberExists = await UserModel.findOne({ phoneNumber });
    if (phoneNumberExists) throw new BadRequestError('Phone number taken');

    user.country = {
      code: country.code,
      name: country.name,
      flag: getFlagEmojiFromCode(country.code),
      currency: country.currency,
    };
    user.phoneNumber = phoneNumber;
    user.dateOfBirth = new Date(dateOfBirth);
    user.registrationStatus = RegistrationStatus.COMPLETE;
    user.gender = gender;

    await user.save();

    return successResponse('Profile completed successfully');
  }

  @Post('/setup-pin')
  @Validate(SetupPinSchema)
  public async setupPin(@Body() data: ISetupPinInput) {
    const { email, pin } = data;

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFoundError('User not found');
    if (user.registrationStatus !== RegistrationStatus.COMPLETE || user.pin)
      throw new UnauthorizedError();

    if (!user.referralCode)
      user.referralCode = await this.getUniqueReferralCode();

    user.pin = await bcrypt.hash(pin, SALT_ROUNDS);
    user.registrationStatus = RegistrationStatus.ACTIVE;

    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
    });
    user.refreshToken = tokens.refreshToken;
    await user.save();

    const counts = await CountModel.findOne({});
    if (counts) {
      const currentMonth = counts.users?.month?.key;
      const currentYear = counts.users?.year?.key;

      const currentMonthAllCount = counts.users?.month?.all || 0;
      const currentMonthActiveCount = counts.users?.month?.active || 0;
      const currentMonthInactiveCount = counts.users?.month?.inactive || 0;

      const currentYearAllCount = counts.users?.year?.all || 0;
      const currentYearActiveCount = counts.users?.year?.active || 0;
      const currentYearInactiveCount = counts.users?.year?.inactive || 0;

      if (currentMonth === getCurrentMonth()) {
        counts.users.month.active = currentMonthActiveCount + 1;
        counts.users.month.inactive = currentMonthInactiveCount - 1;
        counts.users.month.all = currentMonthAllCount;
      } else {
        counts.users.month.all = 1;
        counts.users.month.active = 1;
        counts.users.month.inactive = 0;
        counts.users.month.key = getCurrentMonth();
      }

      if (currentYear === getCurrentYear()) {
        counts.users.year.active = currentYearActiveCount + 1;
        counts.users.year.inactive = currentYearInactiveCount - 1;
        counts.users.year.all = currentYearAllCount;
      } else {
        counts.users.year.all = 1;
        counts.users.year.active = 1;
        counts.users.year.inactive = 0;
        counts.users.year.key = getCurrentYear();
      }

      counts.users.active += 1;
      counts.users.inactive -= 1;
      await counts.save();
    }

    return successResponse('PIN setup successfully', tokens);
  }

  @Post('/login')
  @Validate(LoginSchema)
  public async login(@Body() data: ILoginInput) {
    const { email, password } = data;

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFoundError('User not found');
    if (user.registrationStatus !== RegistrationStatus.ACTIVE)
      throw new UnauthorizedError('Incomplete account creation');

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) throw new BadRequestError('Invalid email or password');

    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
    });
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return successResponse('Login successfully', tokens);
  }

  @Post('/confirm-pin')
  @Validate(ConfirmPinSchema)
  @Security('BearerAuth')
  public async confirmPin(
    @Body() data: IConfirmPinInput,
    @Request() req: ExpressRequest,
  ) {
    const { pin } = data;

    const user = await UserModel.findById(req.user._id);
    if (!user) throw new NotFoundError('User not found');

    if (!user.pin) throw new UnauthorizedError('No pin set');

    const isMatch = await bcrypt.compare(pin, user.pin!);
    if (!isMatch) throw new BadRequestError('Incorrect pin');

    return successResponse('Pin verified successfully');
  }

  @Get('/logout')
  @Security('BearerAuth')
  public async logout(@Request() req: ExpressRequest) {
    const user = await UserModel.findById(req.user?._id);
    if (!user) throw new NotFoundError('User not found');

    user.refreshToken = undefined;
    await user.save();
    return successResponse('Logged out successfully');
  }

  @Delete('/delete-account')
  @Validate(DeleteAccountSchema)
  @Security('BearerAuth')
  public async deleteAccount(
    @Request() req: any,
    @Body() data: IDeleteAccountInput,
  ) {
    const { password, reason } = data;
    const user = await UserModel.findById(req.user._id);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) throw new BadRequestError('Incorrect password');

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

    if (reason)
      await ReasonModel.create({
        email: user.email,
        reason,
      });
    await UserModel.deleteOne(user._id);
    return successResponse('Account deleted successfully');
  }

  @Post('/refresh-token')
  @Validate(RefreshTokenSchema)
  public async refreshToken(@Body() data: IRefreshTokenInput) {
    const { refreshToken } = data;
    const decoded: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const user = await UserModel.findById(decoded._id);
    if (!user) throw new NotFoundError('Invalid refresh token');

    const token = generateTokens({
      id: user._id.toString(),
      email: user.email,
      type: 'access',
    });
    return successResponse('Token generated successfully', token);
  }

  @Patch('/reset-password')
  @Validate(ResetPasswordSchema)
  public async resetPassword(@Body() data: IResetPasswordInput) {
    const { email, otp, password } = data;
    const user = await UserModel.findOne({ email });

    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    )
      throw new BadRequestError('Invalid or expired OTP');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.password = hashedPassword;
    await user.save();
    return successResponse('Password changed successfully');
  }
}
