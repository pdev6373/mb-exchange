import { prop, getModelForClass } from '@typegoose/typegoose';
import { NotificationSlug } from '../schemas/user';
import { NotificationSlugType } from '../types';

export class Notification {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public content!: string;

  @prop({ default: NotificationSlug.INFO, enum: NotificationSlug })
  public slug!: NotificationSlugType;

  @prop()
  public userId?: string;
}

export const NotificationModel = getModelForClass(Notification, {
  schemaOptions: {
    timestamps: true,
  },
});
