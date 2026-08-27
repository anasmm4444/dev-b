export type AppNavigationScreen =
  | 'HONOR_ALARM'
  | 'BIOMETRIC_AUTH_GATE'
  | 'HANDLE_REGISTRATION'
  | 'CHAT_LIST'
  | 'CONVERSATION'
  | 'SETTINGS';

export interface AlarmEntity {
  id: number;
  hour: number;
  minute: number;
  label: string;
  isEnabled: boolean;
  repeatDays: string; // e.g. "1,2,3,4,5" (Mon-Fri)
  ringtone: string;
  vibrate: boolean;
  snoozeCount: number;
}

export interface ChatEntity {
  chatId: string;
  handle: string;
  displayName: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  isMuted?: boolean;
  isBlocked?: boolean;
}

export interface MessageEntity {
  id: string;
  chatId: string;
  senderHandle: string;
  recipientHandle: string;
  encryptedText: string;
  mediaFileName?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'CHAT_WIPE' | null;
  mediaDataUrl?: string | null;
  mediaDurationSec?: number;
  timestamp: number;
  sentAt?: number;
  relayedToFirebaseAt?: number;
  deliveredAt?: number;
  readAt?: number;
  isOutgoing: boolean;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  isDeletedForEveryone?: boolean;
}

export interface RemoteShredCommand {
  commandId: string;
  messageId: string;
  chatId: string;
  targetHandle: string;
  issuedAt: number;
  status: 'QUEUED_OFFLINE' | 'DISPATCHED_TO_FIREBASE' | 'EXECUTED_ON_PEER';
  executedAt?: number;
}

export interface UserPresence {
  handle: string;
  isOnline: boolean;
  activeChatId?: string;
  lastSeen?: number;
}

export enum SyncTimeRange {
  LAST_24_HOURS = 'LAST_24_HOURS',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  FULL_HISTORY = 'FULL_HISTORY',
}

export const SYNC_TIME_RANGE_LABELS: Record<SyncTimeRange, { labelArabic: string; days: number }> = {
  [SyncTimeRange.LAST_24_HOURS]: { labelArabic: 'آخر 24 ساعة فقط', days: 1 },
  [SyncTimeRange.LAST_7_DAYS]: { labelArabic: 'آخر 7 أيام', days: 7 },
  [SyncTimeRange.LAST_30_DAYS]: { labelArabic: 'آخر 30 يوم', days: 30 },
  [SyncTimeRange.FULL_HISTORY]: { labelArabic: 'كامل السجل التاريخي', days: 3650 },
};

export interface SyncPayload {
  requestId: string;
  requesterHandle: string;
  targetHandle: string;
  requestedRange: SyncTimeRange;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  messagesJson?: string;
  completedAt?: number;
}

export type NotificationCamouflageStyle =
  | 'PRAYER_TIMES_GPS'
  | 'ALARM_CLOCK_NOTIFICATIONS'
  | 'SILENT_SUPPRESSION';

export interface UserProfile {
  handle: string;
  displayName: string;
  createdAt: number;
}

export interface AppSettings {
  enterIsSend: boolean;
  chatFontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  autoDownloadMedia: boolean;
  readReceiptsEnabled: boolean;
  activeStatusEnabled: boolean;
  isNotificationEnabled: boolean;
  camouflageStyle: NotificationCamouflageStyle;
}
