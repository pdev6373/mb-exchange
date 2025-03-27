import { Expo } from 'expo-server-sdk';
import { UserModel } from 'models/User';

const expo = new Expo();

export class PushNotificationService {
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      const user = await UserModel.findById(userId).select('pushToken');

      if (!user || !user.pushToken) {
        console.warn(`No push token found for user ${userId}`);
        return;
      }

      if (!Expo.isExpoPushToken(user.pushToken)) {
        console.warn(`Invalid Expo push token: ${user.pushToken}`);
        return;
      }

      const response = await expo.sendPushNotificationsAsync([
        {
          to: user.pushToken,
          title,
          body,
          sound: 'default',
          data,
        },
      ]);
      console.log(`Push notification sent to user ${userId}:`, response);
    } catch (error) {
      console.error(
        `Error sending push notification to user ${userId}:`,
        error,
      );
    }
  }
}
