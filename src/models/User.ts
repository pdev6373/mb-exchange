import { prop, getModelForClass } from '@typegoose/typegoose';
import { RegistrationStatus } from '../schemas/auth';
import { GenderType } from '../types';

class Country {
  @prop({ required: true })
  public code!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public flag!: string;

  @prop({ required: true })
  public currency!: string;
}

class Referrer {
  @prop({ required: true })
  public id!: string;

  @prop()
  public firstName?: string;

  @prop()
  public lastName?: string;
}

class Bank {
  @prop({ required: true })
  public bankName!: string;

  @prop({ required: true })
  public accountNumber!: string;

  @prop({ required: true })
  public accountName!: string;

  @prop({ default: false })
  public default!: boolean;
}

export class User {
  @prop({ required: true, unique: true })
  public email!: string;

  @prop()
  public firstName?: string;

  @prop()
  public lastName?: string;

  @prop({ default: 0 })
  public referred?: number;

  @prop({ _id: false })
  public referrer?: Referrer;

  @prop()
  public userName?: string;

  @prop()
  public referralCode?: string;

  @prop()
  public password?: string;

  @prop({ _id: false })
  public country?: Country;

  @prop()
  public phoneNumber?: string;

  @prop()
  public dateOfBirth?: Date;

  @prop()
  public gender?: GenderType;

  @prop()
  public pin?: string;

  @prop({ default: false })
  public notificationsEnabled?: boolean;

  @prop({ default: false })
  public emailVerified?: boolean;

  @prop()
  public registrationStatus?: RegistrationStatus;

  @prop()
  public refreshToken?: string;

  @prop()
  public otp?: string;

  @prop()
  public pushToken?: string;

  @prop({ default: 0 })
  public points?: number;

  @prop({ default: 0 })
  public successfulTransactions?: number;

  @prop({ default: 0 })
  public failedTransactions?: number;

  @prop({ default: 0 })
  public pendingTransactions?: number;

  @prop({ default: 0 })
  public totalTransactions?: number;

  @prop({ default: 0 })
  public successfulRewards?: number;

  @prop({ default: 0 })
  public pendingRewards?: number;

  @prop({ default: 0 })
  public totalRewards?: number;

  @prop()
  public otpExpiresAt?: Date;

  @prop({ type: () => [Bank], default: [] })
  public banks?: Bank[];

  @prop()
  public createdAt?: Date;

  @prop()
  public updatedAt?: Date;
}

export const UserModel = getModelForClass(User, {
  schemaOptions: {
    timestamps: true,
  },
});
