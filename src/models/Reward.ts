import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { RewardStatusType } from '../types';
import { RewardStatus } from '../schemas/user';

class RewardInitiator {
  @prop({ required: true })
  public id!: string;

  @prop({ required: true })
  public firstName!: string;

  @prop({ required: true })
  public lastName!: string;
}

export class Reward {
  @prop({ _id: false })
  public user!: RewardInitiator;

  @prop({ required: true })
  public amount!: number;

  @prop({ required: true })
  public key!: string;

  @prop({ default: RewardStatus.PENDING, enum: RewardStatus })
  public status!: RewardStatusType;

  @prop()
  public dateApproved?: Date;
}

export const RewardModel = getModelForClass(Reward, {
  schemaOptions: {
    timestamps: true,
  },
});
