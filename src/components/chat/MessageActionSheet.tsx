import React, { useState } from 'react';
import {
  Copy,
  Info,
  Trash2,
  Flame,
  Check,
  ShieldAlert,
  Radio,
  X,
  Sparkles,
} from 'lucide-react';
import { MessageEntity } from '../../types';

interface MessageActionSheetProps {
  message: MessageEntity;
  decryptedText: string;
  onCopy: () => void;
  onShowInfo: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}

export const MessageActionSheet: React.FC<MessageActionSheetProps> = ({
  message,
  decryptedText,
  onCopy,
  onShowInfo,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}) => {
  const [confirmDeleteEveryone, setConfirmDeleteEveryone] = useState(false);
  const [copiedState, setCopiedState] = useState(false);

  const handleCopyClick = () => {
    onCopy();
    setCopiedState(true);
    setTimeout(() => {
      setCopiedState(false);
      onClose();
    }, 500);
  };

  const isMine = message.isOutgoing;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Indicator */}
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-2" />

        {/* Message Snippet */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-[10px] text-zinc-500 block mb-0.5">الرسالة المحددة:</span>
            <p className="text-xs text-zinc-300 truncate font-sans">
              {decryptedText || '[رسالة مشفرة]'}
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded-lg shrink-0">
            {new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        </div>

        {/* Action Menu List */}
        <div className="space-y-1.5 pt-1">
          {/* 1. Copy (نسخ) */}
          <button
            onClick={handleCopyClick}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 active:scale-[0.98] border border-zinc-800/60 transition-all text-right"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-800 text-zinc-200">
                {copiedState ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-semibold text-xs text-zinc-100 block">
                  {copiedState ? 'تم النسخ للحافظة!' : 'نسخ النص'}
                </span>
                <span className="text-[10px] text-zinc-500">نسخ النص غير المشفر إلى الحافظة</span>
              </div>
            </div>
          </button>

          {/* 2. Message Info (معلومات الرسالة) */}
          <button
            onClick={() => {
              onClose();
              onShowInfo();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 active:scale-[0.98] border border-zinc-800/60 transition-all text-right"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-900/40">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-zinc-100 block">معلومات وحالة الرسالة</span>
                <span className="text-[10px] text-zinc-500">
                  معرفة هل أُرسلت، وصلت، أم قُرئت مع التوقيت الدقيق
                </span>
              </div>
            </div>
          </button>

          {/* 3. Delete for Me (حذف عندي - إتلاف فوري) */}
          <button
            onClick={() => {
              onDeleteForMe();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 active:scale-[0.98] border border-zinc-800/60 transition-all text-right group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-amber-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-zinc-200 block">حذف عندي (إتلاف محلي)</span>
                <span className="text-[10px] text-zinc-500">
                  إتلاف ومسح الرسالة نهائياً من تخزين هذا الجهاز فقط
                </span>
              </div>
            </div>
          </button>

          {/* 4. Delete for Everyone (حذف عند الجميع - بروتوكول الإتلاف عن بعد) */}
          {confirmDeleteEveryone ? (
            <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-800/60 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>تأكيد الإتلاف الشامل عند الجميع؟</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                سيتم إتلاف البيانات من هذا الجهاز وإرسال أمر إتلاف فوري لجهاز الطرف الآخر. في حال كان غير متصل، سيحتفظ نظامك بأمر الإتلاف حتى يتصل وينفذه فورياً.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onDeleteForEveryone();
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-lg transition-all"
                >
                  تأكيد الإتلاف عند الجميع
                </button>
                <button
                  onClick={() => setConfirmDeleteEveryone(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteEveryone(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-red-950/20 hover:bg-red-950/40 active:scale-[0.98] border border-red-900/30 transition-all text-right group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-950/80 text-red-400 border border-red-800/40 group-hover:scale-105 transition-transform">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-red-300 block">
                    حذف عند الجميع (بروتوكول الإتلاف)
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    إتلاف محلي + إرسال أمر تدمير دائم للطرف الآخر حتى لو كان غير متصل
                  </span>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors border border-zinc-850"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};
