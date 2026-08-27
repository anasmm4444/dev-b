import React, { useState, useEffect } from 'react';
import { Bell, MapPin, X } from 'lucide-react';
import { chatRepository } from '../../services/chatRepository';

export const CamouflageNotificationBanner: React.FC = () => {
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    // Listen for live camouflaged notifications
    const unsub = chatRepository.onNotification((notif) => {
      setNotification(notif);
    });
    return unsub;
  }, []);

  if (!notification) return null;

  const handleDismiss = () => {
    setNotification(null);
  };

  return (
    <div
      className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
      dir="rtl"
    >
      <div className="bg-zinc-950/95 border border-zinc-800 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Bell className="w-4 h-4 text-zinc-400" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-zinc-100">{notification.title}</h4>
              <span className="text-[10px] text-zinc-500 font-mono">تطبيق الأذان</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{notification.body}</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
