import { prop, getModelForClass } from '@typegoose/typegoose';
import { TransactionStatusType } from '../types';
import { TransactionStatus } from '../schemas/user';

class TransactionInitiator {
  @prop({ required: true })
  public id!: string;

  @prop({ required: true })
  public firstName!: string;

  @prop({ required: true })
  public lastName!: string;
}

class TransactionPlatform {
  @prop({ required: true })
  public platform!: string;

  @prop({ required: true })
  public address!: string;
}

class TransactionAsset {
  @prop({ required: true })
  public id!: string;

  @prop({ required: true })
  public name!: string;
}

export class Transaction {
  @prop({ _id: false })
  public user!: TransactionInitiator;

  @prop({ _id: false })
  public asset!: TransactionAsset;

  @prop({ _id: false })
  public platform!: TransactionPlatform;

  @prop({ required: true })
  public key!: string;

  @prop({ required: true })
  public address!: string;

  @prop({ required: true })
  public quantity!: number;

  @prop({ required: true })
  public rate!: number;

  @prop({ required: true })
  public amount!: number;

  @prop({ required: true })
  public proof!: string;

  @prop()
  public dateApproved?: Date;

  @prop({ default: TransactionStatus.PENDING, enum: TransactionStatus })
  public status!: TransactionStatusType;
}

export const TransactionModel = getModelForClass(Transaction, {
  schemaOptions: {
    timestamps: true,
  },
});
