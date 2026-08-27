import {
  AlarmEntity,
  AppSettings,
  ChatEntity,
  MessageEntity,
  NotificationCamouflageStyle,
  RemoteShredCommand,
  SyncPayload,
  SyncTimeRange,
  UserProfile,
  UserPresence,
} from '../types';
import { EncryptedFileVault } from './vault';
import { PrayerTimeCalculator } from './prayerTimeCalculator';

// Storage Keys
const KEY_ALARMS = 'honor_alarms_list';
const KEY_USER_HANDLE = 'shosho_user_handle';
const KEY_DISPLAY_NAME = 'shosho_display_name';
const KEY_CHATS = 'shosho_chats_list';
const KEY_MESSAGES = 'shosho_messages_store';
const KEY_SETTINGS = 'shosho_settings_prefs';
const KEY_SYNC_REQUESTS = 'shosho_sync_requests';
const KEY_REGISTERED_USERS = 'shosho_registered_users_directory';
const KEY_REMOTE_SHRED_COMMANDS = 'shosho_remote_shred_queue';

// Default initial alarms matching Honor MagicOS Clock
const DEFAULT_ALARMS: AlarmEntity[] = [
  {
    id: 1,
    hour: 6,
    minute: 30,
    label: 'الاستيقاظ الصباحي',
    isEnabled: true,
    repeatDays: '1,2,3,4,5',
    ringtone: 'Honor Morning Mist',
    vibrate: true,
    snoozeCount: 3,
  },
  {
    id: 2,
    hour: 7,
    minute: 15,
    label: 'الاستعداد للعمل',
    isEnabled: false,
    repeatDays: '1,2,3,4,5',
    ringtone: 'Magic Breeze',
    vibrate: true,
    snoozeCount: 3,
  },
  {
    id: 3,
    hour: 14,
    minute: 0,
    label: 'استراحة الغداء',
    isEnabled: true,
    repeatDays: '1,2,3,4,5',
    ringtone: 'Crystal Bell',
    vibrate: false,
    snoozeCount: 2,
  },
];

// Default sample contact directory
const DEFAULT_USERS_DIRECTORY: UserProfile[] = [
  { handle: '@shosho', displayName: 'شوشو 🔒', createdAt: Date.now() - 10000000 },
  { handle: '@anas', displayName: 'أنس المهندس', createdAt: Date.now() - 9000000 },
  { handle: '@sara', displayName: 'سارة خالد', createdAt: Date.now() - 8000000 },
  { handle: '@omar_tech', displayName: 'عمر التميمي', createdAt: Date.now() - 7000000 },
  { handle: '@nour_design', displayName: 'نور المصممة', createdAt: Date.now() - 6000000 },
];

const DEFAULT_SETTINGS: AppSettings = {
  enterIsSend: false,
  chatFontSize: 'MEDIUM',
  autoDownloadMedia: true,
  readReceiptsEnabled: true,
  activeStatusEnabled: true,
  isNotificationEnabled: true,
  camouflageStyle: 'PRAYER_TIMES_GPS',
};

type Listener = () => void;

class ChatRepositoryClass {
  private listeners: Set<Listener> = new Set();
  private notificationListeners: Set<(notif: { title: string; body: string }) => void> = new Set();

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (!localStorage.getItem(KEY_ALARMS)) {
      localStorage.setItem(KEY_ALARMS, JSON.stringify(DEFAULT_ALARMS));
    }
    if (!localStorage.getItem(KEY_REGISTERED_USERS)) {
      localStorage.setItem(KEY_REGISTERED_USERS, JSON.stringify(DEFAULT_USERS_DIRECTORY));
    }
    if (!localStorage.getItem(KEY_SETTINGS)) {
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(KEY_CHATS)) {
      localStorage.setItem(KEY_CHATS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEY_MESSAGES)) {
      localStorage.setItem(KEY_MESSAGES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEY_SYNC_REQUESTS)) {
      localStorage.setItem(KEY_SYNC_REQUESTS, JSON.stringify([]));
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onNotification(listener: (notif: { title: string; body: string }) => void): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Alarms Management ---
  public getAlarms(): AlarmEntity[] {
    const raw = localStorage.getItem(KEY_ALARMS);
    return raw ? JSON.parse(raw) : DEFAULT_ALARMS;
  }

  public saveAlarm(alarm: Omit<AlarmEntity, 'id'> & { id?: number }): AlarmEntity {
    const alarms = this.getAlarms();
    if (alarm.id) {
      const idx = alarms.findIndex((a) => a.id === alarm.id);
      if (idx !== -1) {
        alarms[idx] = alarm as AlarmEntity;
        localStorage.setItem(KEY_ALARMS, JSON.stringify(alarms));
        this.notify();
        return alarms[idx];
      }
    }
    const newAlarm: AlarmEntity = {
      ...alarm,
      id: Date.now(),
    };
    alarms.unshift(newAlarm);
    localStorage.setItem(KEY_ALARMS, JSON.stringify(alarms));
    this.notify();
    return newAlarm;
  }

  public deleteAlarm(id: number): void {
    const alarms = this.getAlarms().filter((a) => a.id !== id);
    localStorage.setItem(KEY_ALARMS, JSON.stringify(alarms));
    this.notify();
  }

  public toggleAlarm(id: number): void {
    const alarms = this.getAlarms().map((a) =>
      a.id === id ? { ...a, isEnabled: !a.isEnabled } : a
    );
    localStorage.setItem(KEY_ALARMS, JSON.stringify(alarms));
    this.notify();
  }

  // --- User Profile ---
  public getCurrentUserHandle(): string | null {
    return localStorage.getItem(KEY_USER_HANDLE);
  }

  public getCurrentDisplayName(): string {
    return localStorage.getItem(KEY_DISPLAY_NAME) || 'المستخدم';
  }

  public async registerUserProfile(handle: string, displayName: string): Promise<string> {
    const cleanHandle = handle.startsWith('@')
      ? handle.trim().toLowerCase()
      : `@${handle.trim().toLowerCase()}`;
    const cleanName = displayName.trim() || 'مستخدم shosho';

    localStorage.setItem(KEY_USER_HANDLE, cleanHandle);
    localStorage.setItem(KEY_DISPLAY_NAME, cleanName);

    // Save to users directory
    const users = this.getRegisteredUsers();
    const existingIdx = users.findIndex((u) => u.handle.toLowerCase() === cleanHandle);
    if (existingIdx !== -1) {
      users[existingIdx].displayName = cleanName;
    } else {
      users.unshift({
        handle: cleanHandle,
        displayName: cleanName,
        createdAt: Date.now(),
      });
    }
    localStorage.setItem(KEY_REGISTERED_USERS, JSON.stringify(users));

    // If user has no chats yet, add a secure welcome contact
    const chats = this.getAllChatsList();
    if (chats.length === 0) {
      await this.createOrGetChat('@shosho', 'شوشو 🔒 (النظام الآمن)');
      const chatId = this.generateChatId(cleanHandle, '@shosho');
      await this.sendIncomingTextMessage(
        chatId,
        '@shosho',
        'مرحباً بك في المحادثة المشفرة ذات الطبقة المزدوجة. جميع البيانات محمية بتشفير AES-256-GCM ومعزولة تماماً خلف منبه MagicOS.'
      );
    }

    this.notify();
    return cleanHandle;
  }

  public getRegisteredUsers(): UserProfile[] {
    const raw = localStorage.getItem(KEY_REGISTERED_USERS);
    return raw ? JSON.parse(raw) : DEFAULT_USERS_DIRECTORY;
  }

  public searchUsersByHandle(query: string): UserProfile[] {
    const cleanQuery = query.trim().toLowerCase().replace('@', '');
    const myHandle = (this.getCurrentUserHandle() || '').toLowerCase();
    const users = this.getRegisteredUsers();
    return users.filter(
      (u) =>
        u.handle.toLowerCase() !== myHandle &&
        (u.handle.toLowerCase().includes(cleanQuery) ||
          u.displayName.toLowerCase().includes(cleanQuery))
    );
  }

  public checkUserExists(handle: string): { exists: boolean; name?: string; error?: string } {
    const clean = handle.startsWith('@')
      ? handle.trim().toLowerCase()
      : `@${handle.trim().toLowerCase()}`;
    const myHandle = (this.getCurrentUserHandle() || '').toLowerCase();

    if (clean === myHandle) {
      return { exists: false, error: 'لا يمكنك فتح محادثة مع نفسك' };
    }

    const localChat = this.getAllChatsList().find((c) => c.handle.toLowerCase() === clean);
    if (localChat) {
      return { exists: true, name: localChat.displayName };
    }

    const user = this.getRegisteredUsers().find((u) => u.handle.toLowerCase() === clean);
    if (user) {
      return { exists: true, name: user.displayName };
    }

    return { exists: true, name: clean }; // Allow creating new peer conversation
  }

  // --- Chats & Messages ---
  public generateChatId(handle1: string, handle2: string): string {
    const sorted = [handle1.toLowerCase().trim(), handle2.toLowerCase().trim()].sort();
    return `chat_${sorted[0].replace('@', '')}_${sorted[1].replace('@', '')}`;
  }

  public getAllChatsList(): ChatEntity[] {
    const raw = localStorage.getItem(KEY_CHATS);
    const chats: ChatEntity[] = raw ? JSON.parse(raw) : [];
    return chats.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }

  public getChatById(chatId: string): ChatEntity | undefined {
    return this.getAllChatsList().find((c) => c.chatId === chatId);
  }

  public async createOrGetChat(targetHandle: string, displayName?: string): Promise<ChatEntity> {
    const myHandle = this.getCurrentUserHandle() || '@me';
    const cleanTarget = targetHandle.startsWith('@')
      ? targetHandle.trim().toLowerCase()
      : `@${targetHandle.trim().toLowerCase()}`;
    const chatId = this.generateChatId(myHandle, cleanTarget);

    const chats = this.getAllChatsList();
    const existing = chats.find((c) => c.chatId === chatId);
    if (existing) return existing;

    const newChat: ChatEntity = {
      chatId,
      handle: cleanTarget,
      displayName: displayName || cleanTarget,
      lastMessage: 'محادثة آمنة ومشفرة',
      lastTimestamp: Date.now(),
      unreadCount: 0,
    };
    chats.unshift(newChat);
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
    this.notify();
    return newChat;
  }

  public getAllMessages(): MessageEntity[] {
    const raw = localStorage.getItem(KEY_MESSAGES);
    return raw ? JSON.parse(raw) : [];
  }

  public getMessagesForChat(chatId: string): MessageEntity[] {
    return this.getAllMessages().filter((m) => m.chatId === chatId);
  }

  public async markChatAsRead(chatId: string): Promise<void> {
    const chats = this.getAllChatsList().map((c) =>
      c.chatId === chatId ? { ...c, unreadCount: 0 } : c
    );
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));

    const messages = this.getAllMessages().map((m) =>
      m.chatId === chatId && !m.isOutgoing ? { ...m, status: 'READ' as const } : m
    );
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
    this.notify();
  }

  public async sendTextMessage(
    chatId: string,
    recipientHandle: string,
    text: string
  ): Promise<MessageEntity> {
    const myHandle = this.getCurrentUserHandle() || '@me';
    const cleanRecipient = recipientHandle.startsWith('@')
      ? recipientHandle.trim().toLowerCase()
      : `@${recipientHandle.trim().toLowerCase()}`;
    const actualChatId = chatId || this.generateChatId(myHandle, cleanRecipient);

    const encryptedText = await EncryptedFileVault.encryptString(text, actualChatId);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    const entity: MessageEntity = {
      id: msgId,
      chatId: actualChatId,
      senderHandle: myHandle,
      recipientHandle: cleanRecipient,
      encryptedText,
      timestamp,
      sentAt: timestamp,
      relayedToFirebaseAt: timestamp + 80,
      isOutgoing: true,
      status: 'SENT',
    };

    const messages = this.getAllMessages();
    messages.push(entity);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));

    this.updateChatLastMessage(actualChatId, cleanRecipient, text, timestamp);
    this.notify();

    // Trigger simulation of delivery & read receipt & optional response
    this.simulatePeerDeliveryAndReply(actualChatId, cleanRecipient, text);

    return entity;
  }

  public async sendImageMessage(
    chatId: string,
    recipientHandle: string,
    dataUrl: string
  ): Promise<MessageEntity> {
    const myHandle = this.getCurrentUserHandle() || '@me';
    const cleanRecipient = recipientHandle.startsWith('@')
      ? recipientHandle.trim().toLowerCase()
      : `@${recipientHandle.trim().toLowerCase()}`;
    const actualChatId = chatId || this.generateChatId(myHandle, cleanRecipient);

    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const encryptedText = await EncryptedFileVault.encryptString('[صورة مشفرة]', actualChatId);
    const encryptedMedia = await EncryptedFileVault.encryptMediaDataUrl(dataUrl, actualChatId);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    const entity: MessageEntity = {
      id: msgId,
      chatId: actualChatId,
      senderHandle: myHandle,
      recipientHandle: cleanRecipient,
      encryptedText,
      mediaFileName: fileName,
      mediaType: 'IMAGE',
      mediaDataUrl: encryptedMedia,
      timestamp,
      isOutgoing: true,
      status: 'SENT',
    };

    const messages = this.getAllMessages();
    messages.push(entity);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));

    this.updateChatLastMessage(actualChatId, cleanRecipient, '📷 صورة مشفرة', timestamp);
    this.notify();

    this.simulatePeerDeliveryAndReply(actualChatId, cleanRecipient, '[صورة]');

    return entity;
  }

  public async sendVideoMessage(
    chatId: string,
    recipientHandle: string,
    dataUrl: string,
    durationSec: number = 0
  ): Promise<MessageEntity> {
    const myHandle = this.getCurrentUserHandle() || '@me';
    const cleanRecipient = recipientHandle.startsWith('@')
      ? recipientHandle.trim().toLowerCase()
      : `@${recipientHandle.trim().toLowerCase()}`;
    const actualChatId = chatId || this.generateChatId(myHandle, cleanRecipient);

    const fileName = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const encryptedText = await EncryptedFileVault.encryptString('[فيديو عالي الدقة مشفر]', actualChatId);
    const encryptedMedia = await EncryptedFileVault.encryptMediaDataUrl(dataUrl, actualChatId);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    const entity: MessageEntity = {
      id: msgId,
      chatId: actualChatId,
      senderHandle: myHandle,
      recipientHandle: cleanRecipient,
      encryptedText,
      mediaFileName: fileName,
      mediaType: 'VIDEO',
      mediaDataUrl: encryptedMedia,
      mediaDurationSec: durationSec,
      timestamp,
      isOutgoing: true,
      status: 'SENT',
    };

    const messages = this.getAllMessages();
    messages.push(entity);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));

    this.updateChatLastMessage(actualChatId, cleanRecipient, '🎥 فيديو عالي الدقة', timestamp);
    this.notify();

    this.simulatePeerDeliveryAndReply(actualChatId, cleanRecipient, '[فيديو]');

    return entity;
  }

  private async sendIncomingTextMessage(
    chatId: string,
    senderHandle: string,
    text: string
  ): Promise<void> {
    const myHandle = this.getCurrentUserHandle() || '@me';
    const encryptedText = await EncryptedFileVault.encryptString(text, chatId);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    const entity: MessageEntity = {
      id: msgId,
      chatId,
      senderHandle,
      recipientHandle: myHandle,
      encryptedText,
      timestamp,
      isOutgoing: false,
      status: 'DELIVERED',
    };

    const messages = this.getAllMessages();
    messages.push(entity);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));

    const chat = this.getChatById(chatId);
    const isMuted = chat?.isMuted || false;
    const isBlocked = chat?.isBlocked || false;

    if (!isBlocked) {
      const chats = this.getAllChatsList().map((c) =>
        c.chatId === chatId
          ? {
              ...c,
              lastMessage: text,
              lastTimestamp: timestamp,
              unreadCount: c.unreadCount + 1,
            }
          : c
      );
      localStorage.setItem(KEY_CHATS, JSON.stringify(chats));

      this.triggerCamouflageNotification(isMuted);
    }
    this.notify();
  }

  private updateChatLastMessage(
    chatId: string,
    targetHandle: string,
    text: string,
    timestamp: number
  ) {
    const chats = this.getAllChatsList();
    const idx = chats.findIndex((c) => c.chatId === chatId);
    if (idx !== -1) {
      chats[idx].lastMessage = text;
      chats[idx].lastTimestamp = timestamp;
    } else {
      chats.unshift({
        chatId,
        handle: targetHandle,
        displayName: targetHandle,
        lastMessage: text,
        lastTimestamp: timestamp,
        unreadCount: 0,
      });
    }
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
  }

  private simulatePeerDeliveryAndReply(
    chatId: string,
    peerHandle: string,
    userText: string
  ) {
    const chat = this.getChatById(chatId);
    if (chat?.isBlocked) return;

    // 1. Deliver after 600ms
    setTimeout(() => {
      const now = Date.now();
      const messages = this.getAllMessages().map((m) =>
        m.chatId === chatId && m.isOutgoing && m.status === 'SENT'
          ? { ...m, status: 'DELIVERED' as const, deliveredAt: now }
          : m
      );
      localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
      this.notify();
    }, 600);

    // 2. Read after 1400ms if read receipts are enabled
    const settings = this.getAppSettings();
    if (settings.readReceiptsEnabled) {
      setTimeout(() => {
        const now = Date.now();
        const messages = this.getAllMessages().map((m) =>
          m.chatId === chatId && m.isOutgoing && (m.status === 'DELIVERED' || m.status === 'SENT')
            ? { ...m, status: 'READ' as const, readAt: now }
            : m
        );
        localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
        this.notify();
      }, 1400);
    }

    // 3. Automated peer response for natural experience
    setTimeout(async () => {
      if (peerHandle === '@shosho') {
        let reply = 'تم استلام وتشفير رسالتك بنجاح في القناة المعزولة 🔐';
        if (userText.includes('مرحبا') || userText.includes('سلام') || userText.includes('هلا')) {
          reply = 'وعليكم السلام ورحمة الله وبركاته! نظام shosho المشفر في خدمتك.';
        } else if (userText.includes('سري') || userText.includes('قفل') || userText.includes('أمان')) {
          reply = 'جميع محادثاتنا مشفرة بـ AES-256 E2EE ولا تظهر بأي شكل في إشعارات النظام.';
        } else if (userText.includes('صورة') || userText.includes('فيديو')) {
          reply = 'تم حفظ الوسائط في الخزنة المشفرة بنجاح.';
        }
        await this.sendIncomingTextMessage(chatId, peerHandle, reply);
      }
    }, 2800);
  }

  // --- Remote Destruction Queue & Shred Protocol ---
  public getRemoteShredCommands(): RemoteShredCommand[] {
    const raw = localStorage.getItem(KEY_REMOTE_SHRED_COMMANDS);
    return raw ? JSON.parse(raw) : [];
  }

  public async deleteForMe(messageId: string): Promise<void> {
    const all = this.getAllMessages();
    const target = all.find((m) => m.id === messageId);
    const messages = all.filter((m) => m.id !== messageId);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));

    // Update last message in chat if needed
    if (target) {
      const remainingForChat = messages.filter((m) => m.chatId === target.chatId);
      if (remainingForChat.length > 0) {
        const last = remainingForChat[remainingForChat.length - 1];
        const plainLast = await EncryptedFileVault.decryptString(last.encryptedText, last.chatId);
        this.updateChatLastMessage(target.chatId, target.recipientHandle, plainLast, last.timestamp);
      } else {
        this.updateChatLastMessage(target.chatId, target.recipientHandle, 'لا توجد رسائل', Date.now());
      }
    }

    this.notify();
  }

  public async deleteForEveryone(
    messageId: string,
    chatId: string,
    targetHandle?: string
  ): Promise<{ commandId: string; status: 'QUEUED_OFFLINE' | 'DISPATCHED_TO_FIREBASE' | 'EXECUTED_ON_PEER' }> {
    const cleanTarget = targetHandle || '@peer';

    // 1. Shred and wipe message completely from local device storage
    const all = this.getAllMessages();
    const updatedMessages = all.filter((m) => m.id !== messageId);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(updatedMessages));

    // 2. Issue Remote Shred Command to destroy from recipient device
    const commandId = `shred_cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const shredCmd: RemoteShredCommand = {
      commandId,
      messageId,
      chatId,
      targetHandle: cleanTarget,
      issuedAt: Date.now(),
      status: 'QUEUED_OFFLINE',
    };

    const queue = this.getRemoteShredCommands();
    queue.unshift(shredCmd);
    localStorage.setItem(KEY_REMOTE_SHRED_COMMANDS, JSON.stringify(queue));

    // 3. Update chat last message
    const remainingForChat = updatedMessages.filter((m) => m.chatId === chatId);
    if (remainingForChat.length > 0) {
      const last = remainingForChat[remainingForChat.length - 1];
      const plainLast = await EncryptedFileVault.decryptString(last.encryptedText, last.chatId);
      this.updateChatLastMessage(chatId, cleanTarget, plainLast, last.timestamp);
    } else {
      this.updateChatLastMessage(chatId, cleanTarget, 'تم إتلاف الرسائل بنجاح 🗑️', Date.now());
    }

    // 4. Dispatch through encrypted relay / Firebase & simulate peer destruction
    setTimeout(() => {
      const q = this.getRemoteShredCommands();
      const idx = q.findIndex((c) => c.commandId === commandId);
      if (idx !== -1) {
        q[idx].status = 'DISPATCHED_TO_FIREBASE';
        localStorage.setItem(KEY_REMOTE_SHRED_COMMANDS, JSON.stringify(q));
        this.notify();
      }
    }, 400);

    setTimeout(() => {
      const q = this.getRemoteShredCommands();
      const idx = q.findIndex((c) => c.commandId === commandId);
      if (idx !== -1) {
        q[idx].status = 'EXECUTED_ON_PEER';
        q[idx].executedAt = Date.now();
        localStorage.setItem(KEY_REMOTE_SHRED_COMMANDS, JSON.stringify(q));
        this.notify();
      }
    }, 1200);

    this.notify();
    return { commandId, status: 'QUEUED_OFFLINE' };
  }

  public toggleMute(chatId: string): void {
    const chats = this.getAllChatsList().map((c) =>
      c.chatId === chatId ? { ...c, isMuted: !c.isMuted } : c
    );
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
    this.notify();
  }

  public toggleBlock(chatId: string): void {
    const chats = this.getAllChatsList().map((c) =>
      c.chatId === chatId ? { ...c, isBlocked: !c.isBlocked } : c
    );
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
    this.notify();
  }

  public async clearChatHistory(chatId: string): Promise<void> {
    const messages = this.getAllMessages().filter((m) => m.chatId !== chatId);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
    const chats = this.getAllChatsList().map((c) =>
      c.chatId === chatId
        ? { ...c, lastMessage: 'تم مسح المحتوى محلياً', unreadCount: 0 }
        : c
    );
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
    this.notify();
  }

  public async deleteChatForMe(chatId: string): Promise<void> {
    const messages = this.getAllMessages().filter((m) => m.chatId !== chatId);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
    const chats = this.getAllChatsList().filter((c) => c.chatId !== chatId);
    localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
    this.notify();
  }

  public async deleteChatForEveryone(chatId: string): Promise<void> {
    await this.deleteChatForMe(chatId);
  }

  public async wipeAllLocalData(): Promise<void> {
    EncryptedFileVault.shredAllVaults();
    localStorage.clear();
    this.initStorage();
    this.notify();
  }

  // --- Settings ---
  public getAppSettings(): AppSettings {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  }

  public updateAppSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getAppSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(updated));
    this.notify();
    return updated;
  }

  // --- Peer-to-Peer Sync ---
  public getSyncRequests(): SyncPayload[] {
    const raw = localStorage.getItem(KEY_SYNC_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  }

  public getPendingIncomingSync(): SyncPayload | null {
    const myHandle = this.getCurrentUserHandle() || '';
    return (
      this.getSyncRequests().find(
        (s) => s.targetHandle.toLowerCase() === myHandle.toLowerCase() && s.status === 'PENDING'
      ) || null
    );
  }

  public async sendSyncRequest(
    targetHandle: string,
    range: SyncTimeRange
  ): Promise<SyncPayload> {
    const myHandle = this.getCurrentUserHandle() || '@me';
    const requestId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload: SyncPayload = {
      requestId,
      requesterHandle: myHandle,
      targetHandle,
      requestedRange: range,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    const list = this.getSyncRequests();
    list.unshift(payload);
    localStorage.setItem(KEY_SYNC_REQUESTS, JSON.stringify(list));
    this.notify();

    // Auto simulate peer approval in demo environment
    setTimeout(() => {
      this.approveSyncRequest(requestId, range);
    }, 2000);

    return payload;
  }

  public async approveSyncRequest(
    requestId: string,
    range: SyncTimeRange
  ): Promise<void> {
    const list = this.getSyncRequests();
    const idx = list.findIndex((s) => s.requestId === requestId);
    if (idx !== -1) {
      list[idx].status = 'APPROVED';
      list[idx].completedAt = Date.now();
      localStorage.setItem(KEY_SYNC_REQUESTS, JSON.stringify(list));

      // Generate & merge recovered history
      const req = list[idx];
      const chatId = this.generateChatId(req.requesterHandle, req.targetHandle);
      const days = range === SyncTimeRange.LAST_24_HOURS ? 1 : range === SyncTimeRange.LAST_7_DAYS ? 7 : range === SyncTimeRange.LAST_30_DAYS ? 30 : 365;

      const now = Date.now();
      const sampleMessages = [
        {
          text: 'تمت استعادة هذه الرسالة المشفرة بنجاح عبر بروتوكول P2P 🔄',
          time: now - 3600000 * 5,
          outgoing: false,
        },
        {
          text: 'مزامنة السجل الزمني المؤمّنة كاملة بنجاح.',
          time: now - 3600000 * 2,
          outgoing: true,
        },
      ];

      for (const sm of sampleMessages) {
        const enc = await EncryptedFileVault.encryptString(sm.text, chatId);
        const msg: MessageEntity = {
          id: `msg_sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          chatId,
          senderHandle: sm.outgoing ? req.requesterHandle : req.targetHandle,
          recipientHandle: sm.outgoing ? req.targetHandle : req.requesterHandle,
          encryptedText: enc,
          timestamp: sm.time,
          isOutgoing: sm.outgoing,
          status: 'DELIVERED',
        };
        const all = this.getAllMessages();
        all.push(msg);
        localStorage.setItem(KEY_MESSAGES, JSON.stringify(all));
      }

      this.notify();
    }
  }

  public async rejectSyncRequest(requestId: string): Promise<void> {
    const list = this.getSyncRequests();
    const idx = list.findIndex((s) => s.requestId === requestId);
    if (idx !== -1) {
      list[idx].status = 'REJECTED';
      localStorage.setItem(KEY_SYNC_REQUESTS, JSON.stringify(list));
      this.notify();
    }
  }

  // --- Camouflaged Notifications Trigger ---
  public triggerCamouflageNotification(isMuted: boolean = false): void {
    const settings = this.getAppSettings();
    if (isMuted || !settings.isNotificationEnabled) return;
    if (settings.camouflageStyle === 'SILENT_SUPPRESSION') return;

    let notif: { title: string; body: string };
    if (settings.camouflageStyle === 'ALARM_CLOCK_NOTIFICATIONS') {
      notif = {
        title: 'منبه النظام الذكي',
        body: 'تذكير: تم ضبط المنبه التالي للعمل في موعده المحدد',
      };
    } else {
      notif = PrayerTimeCalculator.getContextualCamouflagePhrase();
    }

    this.notificationListeners.forEach((l) => l(notif));
  }
}

export const chatRepository = new ChatRepositoryClass();
