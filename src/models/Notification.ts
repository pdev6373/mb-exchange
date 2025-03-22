import { prop, getModelForClass } from '@typegoose/typegoose';

export class Notification {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public message!: string;
}

export const NotificationModel = getModelForClass(Notification, {
  schemaOptions: {
    timestamps: true,
  },
});
