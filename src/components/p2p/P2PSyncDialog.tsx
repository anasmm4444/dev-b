import React, { useState } from 'react';
import { SyncPayload, SyncTimeRange, SYNC_TIME_RANGE_LABELS } from '../../types';
import { chatRepository } from '../../services/chatRepository';
import { RefreshCw, ShieldAlert, Check, X, Clock, AlertTriangle } from 'lucide-react';

interface SendP2PSyncModalProps {
  initialTargetHandle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendP2PSyncModal: React.FC<SendP2PSyncModalProps> = ({
  initialTargetHandle = '',
  onClose,
  onSuccess,
}) => {
  const [targetHandle, setTargetHandle] = useState(initialTargetHandle);
  const [selectedRange, setSelectedRange] = useState<SyncTimeRange>(SyncTimeRange.LAST_7_DAYS);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!targetHandle.trim()) {
      setError('يرجى كتابة معرف الطرف الآخر');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await chatRepository.sendSyncRequest(targetHandle.trim(), selectedRange);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'فشل إرسال طلب المزامنة');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">طلب استعادة السجل (P2P)</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          يتيح لك هذا الخيار استعادة المحادثات المشفرة المفقودة مباشرة من جهاز الطرف الآخر (Peer-to-Peer) بناءً على النطاق الزمني المحدد.
        </p>

        {/* Target handle input */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
            معرّف الطرف الآخر المراد الاستعادة منه
          </label>
          <input
            type="text"
            value={targetHandle}
            onChange={(e) => setTargetHandle(e.target.value)}
            placeholder="@handle"
            dir="ltr"
            className="w-full bg-black border border-zinc-850 rounded-xl px-4 py-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Time Range Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
            النطاق الزمني للاسترجاع
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                SyncTimeRange.LAST_24_HOURS,
                SyncTimeRange.LAST_7_DAYS,
                SyncTimeRange.LAST_30_DAYS,
                SyncTimeRange.FULL_HISTORY,
              ] as SyncTimeRange[]
            ).map((range) => {
              const isSelected = selectedRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setSelectedRange(range)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-right flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-750 text-zinc-100'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{SYNC_TIME_RANGE_LABELS[range].labelArabic}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200" />}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 bg-zinc-200 hover:bg-white text-zinc-950 py-3 rounded-xl font-bold text-xs shadow-lg transition-all"
          >
            {isSending ? 'جاري الإرسال المشفر...' : 'إرسال طلب المزامنة'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

interface IncomingP2PSyncModalProps {
  syncPayload: SyncPayload;
  onClose: () => void;
}

export const IncomingP2PSyncModal: React.FC<IncomingP2PSyncModalProps> = ({
  syncPayload,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    await chatRepository.approveSyncRequest(syncPayload.requestId, syncPayload.requestedRange);
    setIsProcessing(false);
    onClose();
    alert('تمت الموافقة وتزويد الطرف الآخر بالسجل المشفر بنجاح!');
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await chatRepository.rejectSyncRequest(syncPayload.requestId);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2.5 text-zinc-300">
          <ShieldAlert className="w-5 h-5 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-100">طلب استعادة سجل محادثات وارد</h2>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          يرغب المستخدم <strong className="text-zinc-200 font-mono">{syncPayload.requesterHandle}</strong> في استعادة سجل المحادثات للفترة ({SYNC_TIME_RANGE_LABELS[syncPayload.requestedRange]?.labelArabic || 'المحددة'}).
        </p>

        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-[11px] text-zinc-400 space-y-1 font-mono">
          <div className="flex justify-between">
            <span>المعرّف:</span>
            <span className="text-zinc-200">{syncPayload.requesterHandle}</span>
          </div>
          <div className="flex justify-between">
            <span>النطاق:</span>
            <span className="text-zinc-200">{SYNC_TIME_RANGE_LABELS[syncPayload.requestedRange]?.labelArabic}</span>
          </div>
          <div className="flex justify-between">
            <span>التشفير:</span>
            <span className="text-zinc-400">P2P Session Key</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 bg-zinc-200 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md"
          >
            {isProcessing ? 'جاري التشفير...' : 'موافقة وإرسال'}
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
          >
            رفض
          </button>
        </div>
      </div>
    </div>
  );
};
