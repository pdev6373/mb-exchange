import { prop, getModelForClass } from '@typegoose/typegoose';

export class SocialPlatform {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public url!: string;

  @prop({ required: true })
  public icon!: string;
}

export const SocialPlatformModel = getModelForClass(SocialPlatform, {
  schemaOptions: {
    timestamps: true,
  },
});
