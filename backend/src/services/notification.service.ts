import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    const list = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(50);

    if (list.length === 0) {
      const initialAlerts = await Notification.insertMany([
        {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'system',
          title: 'Platform Governance Center Active',
          message: 'Real-time security auditing and service health are fully operational.',
          isRead: false,
          createdAt: new Date(),
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'application_update',
          title: 'Application Tracking Operational',
          message: 'Candidate applications pipeline is connected with moderation controls.',
          isRead: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
        },
      ]);
      return initialAlerts;
    }

    return list;
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
