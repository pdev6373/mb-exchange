import {
  prop,
  getModelForClass,
  pre,
  ModelOptions,
} from '@typegoose/typegoose';
import { NotificationSlug } from '../schemas/user';
import { NotificationSlugType } from '../types';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { UserModel } from './User';

const expo = new Expo();

@pre<Notification>('save', async function () {
  if (this.isNew) await sendNotification(this);
})
@ModelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
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

async function sendNotification(notification: Notification) {
  try {
    if (notification.userId) await sendToSpecificUser(notification);
    else await sendToAllUsers(notification);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function sendToSpecificUser(notification: Notification) {
  const user = await UserModel.findById(notification.userId);

  if (!user || !user.pushToken) {
    console.error(`User not found or doesn't have a push token`);
    return;
  }

  const message = {
    to: user.pushToken,
    sound: 'default',
    title: notification.title,
    body: notification.content,
    data: {
      slug: notification.slug,
    },
  };

  await sendPushNotifications([message]);
}

async function sendToAllUsers(notification: Notification) {
  const users = await UserModel.find({
    expoPushToken: { $exists: true, $ne: null },
  });

  const messages: ExpoPushMessage[] = users.map((user) => ({
    to: user.pushToken as string,
    sound: 'default',
    title: notification.title,
    body: notification.content,
    data: {
      slug: notification.slug,
    },
  }));

  await sendPushNotifications(messages);
}

async function sendPushNotifications(messages: ExpoPushMessage[]) {
  const validMessages = messages.filter((message) =>
    Expo.isExpoPushToken(message.to),
  );

  const chunks = expo.chunkPushNotifications(validMessages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }
}

export const NotificationModel = getModelForClass(Notification);

NotificationModel.schema.pre('insertMany', async function (next, docs) {
  try {
    for (const doc of docs) {
      await sendNotification(doc);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});
