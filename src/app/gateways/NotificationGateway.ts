export type NotificationType = 'report' | 'praise';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  readAt: string | null;
  matchId?: string | null;
}

export interface CreateNotificationInput {
  playerId: string;
  type: NotificationType;
  message: string;
  matchId?: string | null;
  createdAt?: string;
}

export interface NotificationGateway {
  createNotification(input: CreateNotificationInput): Promise<void>;
  listNotifications(input: { playerId: string; read?: boolean }): Promise<Notification[]>;
  countUnread(input: { playerId: string }): Promise<number>;
  markAsRead(input: { playerId: string; notificationId: string }): Promise<void>;
  markAllAsRead(input: { playerId: string }): Promise<void>;
}

export const TkNotificationGateway = Symbol('NotificationGateway');
