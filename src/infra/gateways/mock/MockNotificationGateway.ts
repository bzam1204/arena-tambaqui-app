import { injectable } from 'tsyringe';
import type {
  NotificationGateway,
  Notification,
  CreateNotificationInput,
} from '@/app/gateways/NotificationGateway';
import { createNotificationStore, type MockNotificationRecord } from './mockData';

@injectable()
export class MockNotificationGateway implements NotificationGateway {
  private notifications: MockNotificationRecord[] = createNotificationStore();

  async createNotification(input: CreateNotificationInput): Promise<void> {
    const createdAt = input.createdAt ?? new Date().toISOString();
    this.notifications = [
      {
        id: `notif-${Date.now()}`,
        playerId: input.playerId,
        type: input.type,
        message: input.message,
        matchId: input.matchId ?? null,
        createdAt,
        readAt: null,
      },
      ...this.notifications,
    ];
  }

  async listNotifications(input: { playerId: string; read?: boolean }): Promise<Notification[]> {
    const filtered = this.notifications.filter((notification) => {
      if (notification.playerId !== input.playerId) return false;
      if (input.read === undefined) return true;
      return input.read ? Boolean(notification.readAt) : !notification.readAt;
    });
    return this.sortByCreatedAt(filtered).map((notification) => ({ ...notification }));
  }

  async countUnread(input: { playerId: string }): Promise<number> {
    return this.notifications.filter((notification) => notification.playerId === input.playerId && !notification.readAt)
      .length;
  }

  async markAsRead(input: { playerId: string; notificationId: string }): Promise<void> {
    const target = this.notifications.find(
      (notification) => notification.id === input.notificationId && notification.playerId === input.playerId,
    );
    if (!target || target.readAt) return;
    target.readAt = new Date().toISOString();
  }

  async markAllAsRead(input: { playerId: string }): Promise<void> {
    const readAt = new Date().toISOString();
    this.notifications = this.notifications.map((notification) =>
      notification.playerId === input.playerId && !notification.readAt
        ? { ...notification, readAt }
        : notification,
    );
  }

  private sortByCreatedAt(items: MockNotificationRecord[]): MockNotificationRecord[] {
    return items.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
