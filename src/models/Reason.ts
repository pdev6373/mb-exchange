import { prop, getModelForClass } from '@typegoose/typegoose';

export class Reason {
  @prop({ required: true })
  public reason!: string;

  @prop({ required: true })
  public email!: string;
}

export const ReasonModel = getModelForClass(Reason, {
  schemaOptions: {
    timestamps: true,
  },
});
