import { prop, getModelForClass } from '@typegoose/typegoose';

class NetworkAddress {
  @prop({ required: true })
  public platform!: string;

  @prop({ required: true })
  public address!: string;
}

export class Asset {
  @prop({ required: true })
  public cryptoId!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public symbol!: string;

  @prop()
  public image?: string;

  @prop({ required: true })
  public rate!: number;

  @prop()
  public vipRate?: number;

  @prop()
  public description?: string;

  @prop({ type: () => Object })
  public platforms?: Record<string, string>;

  @prop({ default: true })
  public isActive?: boolean;

  @prop({ type: () => [NetworkAddress], _id: false, default: [] })
  public networkAddresses!: NetworkAddress[];
}

export const AssetModel = getModelForClass(Asset, {
  schemaOptions: {
    timestamps: true,
  },
});
