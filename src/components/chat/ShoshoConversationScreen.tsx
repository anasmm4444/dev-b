import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Send,
  Lock,
  MoreVertical,
  Paperclip,
  Trash2,
  RefreshCw,
  Clock,
  Mic,
  Smile,
  Shield,
  VolumeX,
  Volume2,
  Ban,
  Check,
  CheckCheck,
  Zap,
  Info,
  Copy,
  Flame,
} from 'lucide-react';
import { ChatEntity, MessageEntity, SyncTimeRange } from '../../types';
import { chatRepository } from '../../services/chatRepository';
import { EncryptedFileVault } from '../../services/vault';
import { SendP2PSyncModal } from '../p2p/P2PSyncDialog';
import { MessageActionSheet } from './MessageActionSheet';
import { MessageInfoModal } from './MessageInfoModal';

interface ShoshoConversationScreenProps {
  chatId: string;
  onBack: () => void;
}

export const ShoshoConversationScreen: React.FC<ShoshoConversationScreenProps> = ({
  chatId,
  onBack,
}) => {
  const [chat, setChat] = useState<ChatEntity | null>(null);
  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({});
  const [inputText, setInputText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Message Actions & Info State
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<MessageEntity | null>(null);
  const [messageForInfoModal, setMessageForInfoModal] = useState<MessageEntity | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserHandle = chatRepository.getCurrentUserHandle() || '@user';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    const c = chatRepository.getChatById(chatId);
    if (c) {
      setChat(c);
      const rawMessages = chatRepository.getMessagesForChat(chatId);
      setMessages(rawMessages);

      // Decrypt all messages for view
      const decMap: Record<string, string> = {};
      for (const m of rawMessages) {
        decMap[m.id] = await EncryptedFileVault.decryptString(m.encryptedText, chatId);
      }
      setDecryptedTexts(decMap);
    }
  };

  useEffect(() => {
    loadData();
    chatRepository.markChatAsRead(chatId);
    const unsub = chatRepository.subscribe(loadData);
    return unsub;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, decryptedTexts]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !chat) return;

    setInputText('');
    await chatRepository.sendTextMessage(chat.chatId, chat.handle, text);
  };

  const handleToggleMute = () => {
    if (chat) {
      chatRepository.toggleMute(chat.chatId);
      setShowOptions(false);
    }
  };

  const handleToggleBlock = () => {
    if (chat) {
      chatRepository.toggleBlock(chat.chatId);
      setShowOptions(false);
    }
  };

  const handleClearChat = async () => {
    if (chat && confirm('هل أنت متأكد من مسح جميع رسائل هذه المحادثة محلياً؟')) {
      await chatRepository.clearChatHistory(chat.chatId);
      setShowOptions(false);
    }
  };

  // --- Long-press & Touch Handlers ---
  const handleTouchStart = (msg: MessageEntity) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageForAction(msg);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: MessageEntity) => {
    e.preventDefault();
    setSelectedMessageForAction(msg);
  };

  // --- Action Handlers ---
  const handleCopyMessage = async (msg: MessageEntity) => {
    const text = decryptedTexts[msg.id] || '';
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast('تم نسخ نص الرسالة إلى الحافظة 📋');
    }
  };

  const handleDeleteForMe = async (msg: MessageEntity) => {
    await chatRepository.deleteForMe(msg.id);
    showToast('تم إتلاف الرسالة وحذفها نهائياً من هذا الجهاز 🗑️');
  };

  const handleDeleteForEveryone = async (msg: MessageEntity) => {
    if (chat) {
      await chatRepository.deleteForEveryone(msg.id, chat.chatId, chat.handle);
      showToast('تم إتلاف الرسالة محلياً وجدولة أمر الإتلاف لجهاز المستلم 🔥');
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-zinc-400">
        المحادثة غير موجودة
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-200 select-none overflow-hidden max-w-2xl mx-auto relative" dir="rtl">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 z-40 flex justify-center animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <div className="bg-zinc-900/95 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-2xl text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="px-4 py-3 bg-black border-b border-zinc-900 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-100 relative">
            {chat.displayName.slice(0, 1)}
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-zinc-400 rounded-full border border-black" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-zinc-100">{chat.displayName}</h1>
              {chat.isMuted && <VolumeX className="w-3 h-3 text-zinc-500" />}
              {chat.isBlocked && <Ban className="w-3 h-3 text-zinc-500" />}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <span>{chat.handle}</span>
              <span>•</span>
              <span className="text-zinc-400">مشفّر AES-256-GCM</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSyncModal(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="مزامنة واسترجاع سجل المحادثة (P2P)"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Options */}
            {showOptions && (
              <div className="absolute left-0 mt-2 w-52 bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-50 text-xs space-y-1">
                <button
                  onClick={handleToggleMute}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-900 transition-colors text-right"
                >
                  {chat.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{chat.isMuted ? 'إلغاء كتم التنبيهات' : 'كتم التنبيهات'}</span>
                </button>

                <button
                  onClick={handleToggleBlock}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-900 transition-colors text-right"
                >
                  <Ban className="w-4 h-4" />
                  <span>{chat.isBlocked ? 'إلغاء حظر الطرف' : 'حظر الطرف'}</span>
                </button>

                <button
                  onClick={handleClearChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors text-right"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>مسح السجل نهائياً</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conversation Feed */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Encryption verification pill */}
        <div className="flex justify-center my-2">
          <div className="bg-zinc-950 border border-zinc-900 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[10px] text-zinc-500 font-mono max-w-sm text-center">
            <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>الرسائل مشفرة بنظام طرف-إلى-طرف عتادياً. اضغط مطولاً على أي رسالة لخيارات الحذف والمعلومات.</span>
          </div>
        </div>

        {messages.map((msg) => {
          const isMine = msg.isOutgoing;
          const msgDate = new Date(msg.timestamp);
          const timeFormatted = msgDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          const displayText = decryptedTexts[msg.id] || '[فك التشفير...]';

          return (
            <div
              key={msg.id}
              id={`msg-row-${msg.id}`}
              className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
            >
              <div
                id={`msg-bubble-${msg.id}`}
                onTouchStart={() => handleTouchStart(msg)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onMouseDown={() => handleTouchStart(msg)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed transition-all cursor-pointer active:scale-[0.98] ${
                  isMine
                    ? 'bg-zinc-200 text-zinc-950 rounded-br-sm hover:bg-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-sm hover:border-zinc-700'
                }`}
                title="اضغط مطولاً لخيارات الرسالة"
              >
                <p className="whitespace-pre-wrap select-text font-normal">{displayText}</p>

                <div
                  className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] ${
                    isMine ? 'text-zinc-600' : 'text-zinc-500'
                  }`}
                  dir="ltr"
                >
                  <span className="font-mono text-[10px] tracking-tight font-medium">{timeFormatted}</span>
                  {isMine && (
                    <span className="inline-flex items-center">
                      {msg.status === 'READ' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-zinc-700 inline" />
                      ) : msg.status === 'DELIVERED' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-zinc-500 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-500 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </main>

      {/* Message Input Box */}
      <footer className="p-3 bg-black border-t border-zinc-900">
        {chat.isBlocked ? (
          <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-950 border border-zinc-900 rounded-xl">
            هذا المستخدم محظور حالياً. يمكنك إلغاء الحظر من خيارات المحادثة.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('إرسال الصور والوسائط المشفرة متوافق مع نظام الخزنة')}
              className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالة مشفرة..."
              className="flex-1 bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-zinc-200 hover:bg-white disabled:opacity-30 disabled:hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        )}
      </footer>

      {/* Message Action Sheet (Long-Press Menu) */}
      {selectedMessageForAction && (
        <MessageActionSheet
          message={selectedMessageForAction}
          decryptedText={decryptedTexts[selectedMessageForAction.id] || ''}
          onCopy={() => handleCopyMessage(selectedMessageForAction)}
          onShowInfo={() => {
            setMessageForInfoModal(selectedMessageForAction);
            setSelectedMessageForAction(null);
          }}
          onDeleteForMe={() => handleDeleteForMe(selectedMessageForAction)}
          onDeleteForEveryone={() => handleDeleteForEveryone(selectedMessageForAction)}
          onClose={() => setSelectedMessageForAction(null)}
        />
      )}

      {/* Message Lifecycle Info Modal */}
      {messageForInfoModal && (
        <MessageInfoModal
          message={messageForInfoModal}
          decryptedText={decryptedTexts[messageForInfoModal.id] || ''}
          onClose={() => setMessageForInfoModal(null)}
        />
      )}

      {/* P2P Sync Request Dialog */}
      {showSyncModal && (
        <SendP2PSyncModal
          initialTargetHandle={chat.handle}
          onClose={() => setShowSyncModal(false)}
          onSuccess={() => {
            alert(`تم إرسال طلب استعادة السجل إلى ${chat.handle} بنجاح!`);
          }}
        />
      )}
    </div>
  );
};

