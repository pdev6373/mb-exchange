import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

export class CryptoNetwork {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public address!: string;

  @prop({ default: 'https://icon.png' })
  public icon?: string;
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Asset {
  @prop({ required: true, unique: true })
  public name!: string;

  @prop({ required: true, unique: true })
  public symbol!: string;

  @prop({ required: true })
  public icon!: string;

  @prop({ required: true })
  public rate!: number;

  @prop({ required: true })
  public vipRate!: number;

  @prop({ type: () => [CryptoNetwork], default: [] })
  public networks!: CryptoNetwork[];
}

export const AssetModel = getModelForClass(Asset, {
  schemaOptions: {
    timestamps: true,
  },
});
