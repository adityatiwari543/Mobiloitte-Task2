import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    return Notification.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  static async markAsRead(notificationId: string, userId: string) {
    await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { isRead: true }
    );
    return { message: 'Notification marked as read.' };
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
    return { message: 'All notifications marked as read.' };
  }
}
