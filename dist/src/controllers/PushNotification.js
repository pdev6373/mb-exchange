"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const User_1 = require("../models/User");
const expo = new expo_server_sdk_1.Expo();
class PushNotificationService {
    static async sendPushNotification(userId, title, body, data = {}) {
        try {
            const user = await User_1.UserModel.findById(userId).select('pushToken');
            if (!user || !user.pushToken) {
                console.warn(`No push token found for user ${userId}`);
                return;
            }
            if (!expo_server_sdk_1.Expo.isExpoPushToken(user.pushToken)) {
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
        }
        catch (error) {
            console.error(`Error sending push notification to user ${userId}:`, error);
        }
    }
}
exports.PushNotificationService = PushNotificationService;
//# sourceMappingURL=PushNotification.js.map