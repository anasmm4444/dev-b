import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  Fingerprint,
  Bell,
  Trash2,
  Lock,
  User,
  Check,
  Smartphone,
  EyeOff,
  Sliders,
} from 'lucide-react';
import { AppSettings, NotificationCamouflageStyle } from '../../types';
import { chatRepository } from '../../services/chatRepository';
import { BiometricSecurityManager } from '../../services/security';

interface ShoshoSettingsScreenProps {
  onBack: () => void;
  onLockToClock?: () => void;
  onDataWiped?: () => void;
  onLoggedOut?: () => void;
}

export const ShoshoSettingsScreen: React.FC<ShoshoSettingsScreenProps> = ({
  onBack,
  onLockToClock,
  onDataWiped,
  onLoggedOut,
}) => {
  const [settings, setSettings] = useState<AppSettings>(chatRepository.getAppSettings());
  const [displayName, setDisplayName] = useState(chatRepository.getCurrentDisplayName());
  const [userHandle] = useState(chatRepository.getCurrentUserHandle() || '@user');
  const [biometricsActive, setBiometricsActive] = useState(
    BiometricSecurityManager.isBiometricEnabled()
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const s = chatRepository.getAppSettings();
    setSettings(s);
  }, []);

  const handleToggleSetting = (key: keyof AppSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    chatRepository.updateAppSettings(updated);
  };

  const handleSetCamouflage = (style: NotificationCamouflageStyle) => {
    const updated = {
      ...settings,
      camouflageStyle: style,
    };
    setSettings(updated);
    chatRepository.updateAppSettings(updated);
  };

  const handleToggleBiometrics = () => {
    const next = !biometricsActive;
    setBiometricsActive(next);
    BiometricSecurityManager.setBiometricEnabled(next);
  };

  const handleSaveProfile = async () => {
    if (displayName.trim()) {
      await chatRepository.registerUserProfile(userHandle, displayName.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleWipeData = async () => {
    if (
      confirm(
        'تحذير: سيتم مسح كافة المفاتيح المشفرة والمحادثات والوسائط محلياً بشكل نهائي وغير قابل للاسترداد. هل أنت متأكد؟'
      )
    ) {
      await chatRepository.wipeAllLocalData();
      BiometricSecurityManager.lockApp();
      if (onDataWiped) onDataWiped();
      if (onLoggedOut) onLoggedOut();
      if (onLockToClock) onLockToClock();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-200 select-none overflow-hidden max-w-2xl mx-auto" dir="rtl">
      {/* Top Header */}
      <header className="px-5 py-4 bg-black border-b border-zinc-900 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-zinc-100">إعدادات الخزنة المشفرة</h1>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* User Identity Section */}
        <section className="bg-zinc-950 border border-zinc-850 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 font-mono">المعرّف السري الفريد</span>
              <p className="text-sm font-bold font-mono text-zinc-200">{userHandle}</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              الاسم الظاهر للأطراف
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
              <button
                onClick={handleSaveProfile}
                className="bg-zinc-200 hover:bg-white text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
              >
                {isSaved ? <Check className="w-4 h-4 text-zinc-950" /> : 'حفظ'}
              </button>
            </div>
          </div>
        </section>

        {/* Security & Biometrics */}
        <section className="bg-zinc-950 border border-zinc-850 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-900">
            <Shield className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-300">الأمان ومفاتيح العتاد</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-200">الفتح ببصمة الإصبع أو الوجه</span>
              <p className="text-[11px] text-zinc-500">تمكين المصادقة البيومترية السريعة</p>
            </div>
            <button
              type="button"
              onClick={handleToggleBiometrics}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                biometricsActive ? 'bg-zinc-700' : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-zinc-100 shadow-md transform transition-transform ${
                  biometricsActive ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-200">مؤشرات قراءة الرسائل (Read Receipts)</span>
              <p className="text-[11px] text-zinc-500">إظهار علامة الصح المزدوجة عند قراءة الرسائل</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting('readReceiptsEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                settings.readReceiptsEnabled ? 'bg-zinc-700' : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-zinc-100 shadow-md transform transition-transform ${
                  settings.readReceiptsEnabled ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Camouflage Notifications */}
        <section className="bg-zinc-950 border border-zinc-850 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-900">
            <EyeOff className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-300">تمويه الإشعارات (Camouflage)</h2>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-200">تمكين إشعارات التمويه</span>
              <p className="text-[11px] text-zinc-500">إرسال إشعارات بديلة غير مشبوهة عند ورود رسائل</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting('isNotificationEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                settings.isNotificationEnabled ? 'bg-zinc-700' : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-zinc-100 shadow-md transform transition-transform ${
                  settings.isNotificationEnabled ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>

          {settings.isNotificationEnabled && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                نمط التمويه المختار
              </label>

              {[
                {
                  id: 'PRAYER_TIMES_GPS',
                  title: 'أوقات الصلاة والقبلة (موصى به)',
                  desc: 'يظهر الإشعار كتذكير صلاة (مثال: اقترب موعد صلاة العصر في الرياض)',
                },
                {
                  id: 'ALARM_CLOCK_NOTIFICATIONS',
                  title: 'إشعارات تطبيق المنبه',
                  desc: 'يظهر الإشعار كتنبيه منبه مجدول لنظام MagicOS',
                },
                {
                  id: 'SILENT_SUPPRESSION',
                  title: 'كتم وإخفاء تام (Silent)',
                  desc: 'لا يتم إظهار أي إشعار على الشاشة نهائياً',
                },
              ].map((cam) => {
                const isSelected = settings.camouflageStyle === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => handleSetCamouflage(cam.id as any)}
                    className={`w-full text-right p-3 rounded-2xl border transition-colors flex items-start justify-between ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                        : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold block">{cam.title}</span>
                      <p className="text-[11px] text-zinc-500 leading-normal">{cam.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-zinc-200 mt-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Emergency & Self-Destruct */}
        <section className="bg-zinc-950 border border-zinc-850 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Trash2 className="w-4 h-4" />
            <h2 className="text-xs font-bold text-zinc-300">التدمير الذاتي ومسح البيانات</h2>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            يقوم هذا الإجراء بتمزيق وتفريغ كافة المفاتيح التشفيرية AES-256 وحذف جميع سجلات المحادثات محلياً بدون إمكانية للاسترجاع.
          </p>
          <button
            onClick={handleWipeData}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-zinc-400" />
            <span>مسح وتدمير كافة البيانات محلياً</span>
          </button>
        </section>
      </main>
    </div>
  );
};
