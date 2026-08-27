import React, { useState, useEffect } from 'react';
import {
  Lock,
  Settings,
  Plus,
  Search,
  RefreshCw,
  MessageSquare,
  Shield,
  VolumeX,
  Ban,
  Trash2,
  MoreVertical,
  Check,
  X,
  UserPlus,
  AtSign,
} from 'lucide-react';
import { ChatEntity, SyncPayload, UserProfile } from '../../types';
import { chatRepository } from '../../services/chatRepository';
import { SendP2PSyncModal, IncomingP2PSyncModal } from '../p2p/P2PSyncDialog';

interface ShoshoChatListScreenProps {
  onSelectChat: (chatId: string) => void;
  onNavigateToSettings: () => void;
  onLockToClock: () => void;
}

export const ShoshoChatListScreen: React.FC<ShoshoChatListScreenProps> = ({
  onSelectChat,
  onNavigateToSettings,
  onLockToClock,
}) => {
  const [chats, setChats] = useState<ChatEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [selectedChatForOptions, setSelectedChatForOptions] = useState<ChatEntity | null>(null);

  // Incoming sync request
  const [pendingSync, setPendingSync] = useState<SyncPayload | null>(null);

  // New Chat Form
  const [newChatHandle, setNewChatHandle] = useState('');
  const [newChatError, setNewChatError] = useState<string | null>(null);

  const currentUserHandle = chatRepository.getCurrentUserHandle() || '@user';
  const currentDisplayName = chatRepository.getCurrentDisplayName();
  const settings = chatRepository.getAppSettings();

  const loadChats = () => {
    setChats(chatRepository.getAllChatsList());
    setPendingSync(chatRepository.getPendingIncomingSync());
  };

  useEffect(() => {
    loadChats();
    const unsub = chatRepository.subscribe(loadChats);
    return unsub;
  }, []);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newChatHandle.trim();
    if (!clean) {
      setNewChatError('يرجى كتابة معرّف المستخدم');
      return;
    }

    const check = chatRepository.checkUserExists(clean);
    if (check.error) {
      setNewChatError(check.error);
      return;
    }

    const newChat = await chatRepository.createOrGetChat(clean, check.name);
    setShowNewChatModal(false);
    setNewChatHandle('');
    setNewChatError(null);
    onSelectChat(newChat.chatId);
  };

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().replace('@', '');
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const directoryUsers = chatRepository.searchUsersByHandle(searchQuery);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-200 select-none overflow-hidden max-w-2xl mx-auto" dir="rtl">
      {/* Top Header */}
      <header className="px-5 py-4 bg-black border-b border-zinc-900 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-750 flex items-center justify-center font-bold text-lg text-zinc-100 shadow-md relative">
            {currentDisplayName.slice(0, 1)}
            {settings.activeStatusEnabled && (
              <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-zinc-300 rounded-full border-2 border-black" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-zinc-100">{currentDisplayName}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                {currentUserHandle}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-zinc-400" />
              <span>محادثات مشفرة E2EE</span>
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowP2PModal(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="مزامنة P2P"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </button>

          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="محادثة جديدة"
          >
            <Plus className="w-5 h-5 text-zinc-300" />
          </button>

          <button
            onClick={onNavigateToSettings}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
          </button>

          <button
            onClick={onLockToClock}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition-colors shadow-sm"
            title="قفل فوري والعودة للساعة"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 pb-2 bg-black">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المحادثات أو المعرفات..."
            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pr-10 pl-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Incoming Sync Request Notification Banner */}
      {pendingSync && (
        <div className="mx-4 my-2 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
            <span>طلب مزامنة سجل وارد من <strong className="font-mono text-zinc-200">{pendingSync.requesterHandle}</strong></span>
          </div>
          <button
            onClick={() => setPendingSync(pendingSync)}
            className="px-3 py-1 bg-zinc-200 text-zinc-950 font-bold rounded-lg hover:bg-white text-[11px]"
          >
            استعراض
          </button>
        </div>
      )}

      {/* Chats List */}
      <main className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {filteredChats.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-900 mx-auto flex items-center justify-center text-zinc-600">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-300">لا توجد محادثات نشطة</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                ابدأ محادثة مشفرة جديدة بكتابة المعرف السري أو اختر من قائمة المستخدمين.
              </p>
            </div>

            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-2 bg-zinc-200 hover:bg-white px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>بدء محادثة جديدة</span>
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const timeFormatted = new Date(chat.lastTimestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={chat.chatId}
                onClick={() => onSelectChat(chat.chatId)}
                className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-200 shrink-0 relative">
                    {chat.displayName.slice(0, 1)}
                    {settings.activeStatusEnabled && (
                      <span className="absolute bottom-0 left-0 w-3 h-3 bg-zinc-400 rounded-full border-2 border-zinc-950" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-zinc-100 truncate">{chat.displayName}</h2>
                      <span className="text-[10px] text-zinc-500 font-mono">{chat.handle}</span>
                      {chat.isMuted && <VolumeX className="w-3 h-3 text-zinc-500" />}
                      {chat.isBlocked && <Ban className="w-3 h-3 text-zinc-500" />}
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{chat.lastMessage}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0" dir="ltr">
                  <span className="text-[11px] text-zinc-500 font-mono tracking-tight">{timeFormatted}</span>
                  {chat.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-950 text-[11px] font-bold flex items-center justify-center shadow-md font-mono">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Directory Contacts suggestion when searching */}
        {searchQuery.trim() && directoryUsers.length > 0 && (
          <div className="pt-4 space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
              مستخدمين في الدليل السري
            </h3>
            {directoryUsers.map((user) => (
              <div
                key={user.handle}
                onClick={async () => {
                  const c = await chatRepository.createOrGetChat(user.handle, user.displayName);
                  onSelectChat(c.chatId);
                }}
                className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-3 flex items-center justify-between hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center justify-center font-bold text-sm">
                    {user.displayName.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-200">{user.displayName}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">{user.handle}</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-300 font-medium">محادثة</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-100">بدء محادثة مشفرة جديدة</h2>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                  معرّف الطرف الآخر (@handle)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
                    <AtSign className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={newChatHandle}
                    onChange={(e) => {
                      setNewChatError(null);
                      setNewChatHandle(e.target.value);
                    }}
                    placeholder="اسم المعرف (مثال: @anas)"
                    dir="ltr"
                    className="w-full bg-black border border-zinc-850 rounded-xl pr-10 pl-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                    autoFocus
                  />
                </div>
              </div>

              {newChatError && (
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                  {newChatError}
                </div>
              )}

              {/* Quick Contacts suggestion */}
              <div>
                <span className="text-[11px] text-zinc-500 block mb-1.5">جهات اتصال مقترحة:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['@shosho', '@anas', '@sara', '@omar_tech'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setNewChatHandle(h)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 font-mono"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-zinc-200 hover:bg-white py-3 rounded-xl font-bold text-zinc-950 text-xs shadow-lg transition-all"
                >
                  فتح المحادثة
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-3 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* P2P Sync Modal */}
      {showP2PModal && (
        <SendP2PSyncModal
          onClose={() => setShowP2PModal(false)}
          onSuccess={() => {
            alert('تم إرسال طلب المزامنة بنجاح!');
          }}
        />
      )}

      {/* Incoming Sync Modal */}
      {pendingSync && (
        <IncomingP2PSyncModal
          syncPayload={pendingSync}
          onClose={() => setPendingSync(null)}
        />
      )}
    </div>
  );
};
