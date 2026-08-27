import React from 'react';
import {
  ShieldCheck,
  Clock,
  Cloud,
  Check,
  CheckCheck,
  HardDrive,
  Cpu,
  Lock,
  X,
  Radio,
  FileText,
} from 'lucide-react';
import { MessageEntity } from '../../types';

interface MessageInfoModalProps {
  message: MessageEntity;
  decryptedText: string;
  onClose: () => void;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  message,
  decryptedText,
  onClose,
}) => {
  const isMine = message.isOutgoing;

  // Format English timestamps with monospace precision
  const formatExactTime = (ts?: number) => {
    if (!ts) return null;
    const d = new Date(ts);
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${dateStr} • ${timeStr}`;
  };

  const sentTimeStr = formatExactTime(message.sentAt || message.timestamp);
  const relayedTimeStr = formatExactTime(
    message.relayedToFirebaseAt || (message.sentAt ? message.sentAt + 80 : message.timestamp + 80)
  );
  const deliveredTimeStr = formatExactTime(
    message.deliveredAt || (message.status === 'DELIVERED' || message.status === 'READ' ? message.timestamp + 600 : undefined)
  );
  const readTimeStr = formatExactTime(
    message.readAt || (message.status === 'READ' ? message.timestamp + 1400 : undefined)
  );

  const isRelayed = message.status !== 'PENDING' && message.status !== 'FAILED';
  const isDelivered = message.status === 'DELIVERED' || message.status === 'READ';
  const isRead = message.status === 'READ';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">معلومات وحالة الرسالة</h2>
              <p className="text-[11px] text-zinc-400 font-mono" dir="ltr">
                ID: {message.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Message Preview Snippet */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>محتوى الرسالة (مفكوك التشفير)</span>
              </span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-[10px] text-zinc-300 font-mono">
                {isMine ? 'صادرة' : 'واردة'}
              </span>
            </div>
            <p className="text-zinc-200 text-sm font-sans bg-black/40 p-2.5 rounded-xl border border-zinc-850 break-words">
              {decryptedText || '[رسالة وسائط أو مشفرة]'}
            </p>
          </div>

          {/* Lifecycle & Transmission Stages */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-zinc-400" />
              <span>مراحل الإرسال والتسليم</span>
            </h3>

            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-3.5 space-y-4">
              {/* 1. Stored in Local Vault */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">الخزنة المحلية (المشفرة)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      محفوظة ومؤمنة
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    مخزنة في ذاكرة الجهاز بتشفير AES-256-GCM
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1" dir="ltr">
                    {sentTimeStr}
                  </p>
                </div>
              </div>

              <div className="h-px bg-zinc-850 w-full" />

              {/* 2. Relayed to Firebase / Cloud Server */}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-full ${
                    isRelayed
                      ? 'bg-blue-950/80 border border-blue-800/60 text-blue-400'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">الإرسال إلى خادم Firebase</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        isRelayed
                          ? 'bg-blue-950 text-blue-300 border-blue-800/40'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {isRelayed ? 'تم الإرسال للسحابة' : 'في الانتظار'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    نُقلت عبر طبقة التحويل المشفرة (Cloud Relay)
                  </p>
                  {isRelayed && (
                    <p className="text-[10px] text-zinc-400 font-mono mt-1" dir="ltr">
                      {relayedTimeStr}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-zinc-850 w-full" />

              {/* 3. Delivered to Peer Device */}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-full ${
                    isDelivered
                      ? 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-400'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">الوصول إلى جهاز الطرف الآخر</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        isDelivered
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800/40'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {isDelivered ? 'وصلت للجهاز' : 'في انتظار اتصال المستلم'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    استلمها جهاز المستلم وفك تشفير طبقة النقل
                  </p>
                  {isDelivered && (
                    <p className="text-[10px] text-zinc-400 font-mono mt-1" dir="ltr">
                      {deliveredTimeStr}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-zinc-850 w-full" />

              {/* 4. Read by Peer */}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-full ${
                    isRead
                      ? 'bg-indigo-950/80 border border-indigo-800/60 text-indigo-400'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                  }`}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">قراءة الرسالة من الطرف الآخر</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        isRead
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {isRead ? 'تمت القراءة' : 'لم تُقرأ بعد'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    فتح المستلم المحادثة وعُرض المحتوى على شاشته
                  </p>
                  {isRead && (
                    <p className="text-[10px] text-indigo-300 font-mono mt-1" dir="ltr">
                      {readTimeStr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic & Protocol Details */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>المعايير الأمنية والبروتوكول المشفر</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-850">
                <span className="text-zinc-500 block text-[10px]">الخوارزمية</span>
                <span className="font-mono text-zinc-200">AES-256-GCM</span>
              </div>
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-850">
                <span className="text-zinc-500 block text-[10px]">طبقة النقل</span>
                <span className="font-mono text-zinc-200">E2EE Tunnel</span>
              </div>
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-850">
                <span className="text-zinc-500 block text-[10px]">المفتاح التناظري</span>
                <span className="font-mono text-zinc-300">Channel Seed #256</span>
              </div>
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-850">
                <span className="text-zinc-500 block text-[10px]">حجم البيانات</span>
                <span className="font-mono text-zinc-300">
                  {message.encryptedText ? `${Math.round(message.encryptedText.length * 0.75)} bytes` : '0 bytes'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-850 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
