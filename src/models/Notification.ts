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

// Initialize Expo SDK
const expo = new Expo();

@pre<Notification>('save', async function () {
  if (this.isNew) {
    console.log('Sending notification:', this);
    await sendNotification(this);
  }
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
    // Add better logging to track what's happening
    console.log('Processing notification:', notification);
    console.log('Has userId?', !!notification.userId);

    if (notification.userId) {
      await sendToSpecificUser(notification);
    } else {
      await sendToAllUsers(notification);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function sendToSpecificUser(notification: Notification) {
  const user = await UserModel.findById(notification.userId);

  if (!user || !user.pushToken) {
    console.error(
      `User not found or doesn't have a push token:`,
      notification.userId,
    );
    return;
  }

  console.log('Sending to specific user:', user._id, user.pushToken);

  const message = {
    to: user.pushToken,
    sound: 'default',
    title: notification.title,
    body: notification.content,
  };

  await sendPushNotifications([message]);
}

async function sendToAllUsers(notification: Notification) {
  console.log('Attempting to send to all users');

  // Add a count to see how many users we're finding
  const userCount = await UserModel.countDocuments({
    pushToken: { $exists: true, $ne: null },
  });
  console.log(`Found ${userCount} users with push tokens`);

  // Get users with valid push tokens
  const users = await UserModel.find({
    pushToken: { $exists: true, $ne: null },
  });
  console.log(`Preparing to send to ${users.length} users`);

  if (users.length === 0) {
    console.warn('No users with valid push tokens found!');
    return;
  }

  // Create messages for all users
  const messages: ExpoPushMessage[] = users.map((user) => ({
    to: user.pushToken as string,
    sound: 'default',
    title: notification.title,
    body: notification.content,
  }));

  console.log(`Created ${messages.length} messages`);
  await sendPushNotifications(messages);
}

async function sendPushNotifications(messages: ExpoPushMessage[]) {
  console.log(`Attempting to send ${messages.length} notifications`);

  const validMessages = messages.filter((message) => {
    const isValid = Expo.isExpoPushToken(message.to);
    if (!isValid) console.warn(`Invalid Expo push token: ${message.to}`);
    return isValid;
  });

  console.log(`${validMessages.length} valid tokens out of ${messages.length}`);

  if (validMessages.length === 0) {
    console.warn('No valid push tokens found!');
    return;
  }

  const chunks = expo.chunkPushNotifications(validMessages);
  console.log(`Split into ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(
        `Sending chunk ${i + 1}/${chunks.length} with ${chunk.length} messages`,
      );
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notification tickets:', ticketChunk);

      // Check for errors in the tickets
      ticketChunk.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          console.error(
            `Error sending to token at index ${index}:`,
            ticket.message,
          );
        }
      });
    } catch (error) {
      console.error(`Error sending chunk ${i + 1}:`, error);
    }
  }
}

// Create the model
export const NotificationModel = getModelForClass(Notification);

// Add the insertMany hook directly to the schema after creating the model
NotificationModel.schema.pre('insertMany', async function (next, docs) {
  try {
    console.log(`Processing ${docs.length} notifications in batch`);
    for (const doc of docs) {
      await sendNotification(doc);
    }
    next();
  } catch (error: any) {
    console.error('Error in insertMany hook:', error);
    next(error);
  }
});
