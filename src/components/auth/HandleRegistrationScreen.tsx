import React, { useState } from 'react';
import { User, AtSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { chatRepository } from '../../services/chatRepository';

interface HandleRegistrationScreenProps {
  onRegistered: () => void;
  onBackToClock: () => void;
}

export const HandleRegistrationScreen: React.FC<HandleRegistrationScreenProps> = ({
  onRegistered,
  onBackToClock,
}) => {
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.trim().replace(/^@+/, '');
    const cleanName = displayName.trim();

    if (!cleanHandle) {
      setError('يرجى إدخال اسم المعرف السري');
      return;
    }

    if (cleanHandle.length < 3) {
      setError('يجب أن يتكون المعرف من 3 أحرف على الأقل');
      return;
    }

    const fullHandle = `@${cleanHandle.toLowerCase()}`;
    await chatRepository.registerUserProfile(fullHandle, cleanName || cleanHandle);
    onRegistered();
  };

  return (
    <div
      className="flex flex-col h-screen w-full bg-black text-zinc-200 select-none overflow-hidden justify-between p-6 max-w-md mx-auto"
      dir="rtl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToClock}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-900"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للساعة</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-900">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>إنشاء هوية سرية</span>
        </div>
      </div>

      {/* Main Registration Form */}
      <div className="space-y-6 my-auto">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mx-auto shadow-xl">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">إنشاء المعرف السري</h1>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            اختر معرفاً سرياً لمشاركته مع من ترغب بالتواصل معهم بشكل مشفر ومحمي.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              المعرف السري الخاص بك (@handle)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
                <AtSign className="w-4 h-4 text-zinc-400" />
              </div>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  setError(null);
                  setHandle(e.target.value);
                }}
                placeholder="anas_vip"
                dir="ltr"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pr-10 pl-4 py-3 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              الاسم المستعار (اختياري)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثال: أنس"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-zinc-200 hover:bg-white text-zinc-950 py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-98"
          >
            تأكيد والدخول للخزنة
          </button>
        </form>
      </div>

      <div className="text-center pb-2 text-[11px] text-zinc-600 font-mono">
        الهوية محمية ومخزنة فقط على هذا الجهاز
      </div>
    </div>
  );
};
