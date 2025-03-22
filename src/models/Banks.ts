import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { timestamps: true } })
export class Banks {
  @prop({ required: true })
  public data!: any;

  @prop({ required: true })
  public country!: string;

  @prop()
  public updatedAt!: Date;
}

export const BanksModel = getModelForClass(Banks, {
  schemaOptions: {
    timestamps: true,
  },
});
