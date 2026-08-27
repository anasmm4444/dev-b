import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Bell,
  Volume2,
  Check,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';
import { AlarmEntity } from '../../types';
import { chatRepository } from '../../services/chatRepository';

interface HonorAlarmScreenProps {
  onStealthTrigger: () => void;
}

export const HonorAlarmScreen: React.FC<HonorAlarmScreenProps> = ({ onStealthTrigger }) => {
  const [activeTab, setActiveTab] = useState<'alarm' | 'world' | 'stopwatch' | 'timer'>('alarm');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<AlarmEntity[]>([]);

  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmEntity | null>(null);
  const [inputHour, setInputHour] = useState(6);
  const [inputMinute, setInputMinute] = useState(30);
  const [inputLabel, setInputLabel] = useState('منبه جديد');
  const [inputRepeat, setInputRepeat] = useState('1,2,3,4,5');
  const [inputRingtone, setInputRingtone] = useState('Honor Morning Mist');
  const [inputVibrate, setInputVibrate] = useState(true);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min default
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load alarms
  useEffect(() => {
    setAlarms(chatRepository.getAlarms());
    const unsub = chatRepository.subscribe(() => {
      setAlarms(chatRepository.getAlarms());
    });
    return unsub;
  }, []);

  // Stopwatch interval
  useEffect(() => {
    let interval: any;
    if (stopwatchRunning) {
      const start = Date.now() - stopwatchTime;
      interval = setInterval(() => {
        setStopwatchTime(Date.now() - start);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning, stopwatchTime]);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleToggleAlarm = (id: number) => {
    chatRepository.toggleAlarm(id);
  };

  const handleDeleteAlarm = (id: number) => {
    chatRepository.deleteAlarm(id);
    setShowAddModal(false);
  };

  const handleOpenAddModal = (alarm?: AlarmEntity) => {
    if (alarm) {
      setEditingAlarm(alarm);
      setInputHour(alarm.hour);
      setInputMinute(alarm.minute);
      setInputLabel(alarm.label);
      setInputRepeat(alarm.repeatDays);
      setInputRingtone(alarm.ringtone);
      setInputVibrate(alarm.vibrate);
    } else {
      setEditingAlarm(null);
      setInputHour(new Date().getHours());
      setInputMinute(new Date().getMinutes() + 1);
      setInputLabel('المنبه');
      setInputRepeat('1,2,3,4,5');
      setInputRingtone('Honor Morning Mist');
      setInputVibrate(true);
    }
    setShowAddModal(true);
  };

  const handleSaveAlarm = () => {
    // Check stealth 11:11 intercept
    if (inputHour === 11 && inputMinute === 11) {
      setShowAddModal(false);
      onStealthTrigger();
      return;
    }

    if (editingAlarm) {
      chatRepository.saveAlarm({
        ...editingAlarm,
        hour: inputHour,
        minute: inputMinute,
        label: inputLabel || 'المنبه',
        repeatDays: inputRepeat,
        ringtone: inputRingtone,
        vibrate: inputVibrate,
        isEnabled: true,
      });
    } else {
      chatRepository.saveAlarm({
        hour: inputHour,
        minute: inputMinute,
        label: inputLabel || 'المنبه',
        repeatDays: inputRepeat,
        ringtone: inputRingtone,
        vibrate: inputVibrate,
        isEnabled: true,
        snoozeCount: 3,
      });
    }
    setShowAddModal(false);
  };

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const daysLabels = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const worldCities = [
    { city: 'الرياض', country: 'السعودية', offset: 3, diff: 'التوقيت المحلي' },
    { city: 'دبي', country: 'الإمارات', offset: 4, diff: '+1 ساعة' },
    { city: 'لندن', country: 'المملكة المتحدة', offset: 0, diff: '-3 ساعات' },
    { city: 'نيويورك', country: 'الولايات المتحدة', offset: -5, diff: '-8 ساعات' },
    { city: 'طوكيو', country: 'اليابان', offset: 9, diff: '+6 ساعات' },
  ];

  const getWorldTime = (offset: number) => {
    const utc = currentTime.getTime() + currentTime.getTimezoneOffset() * 60000;
    const cityDate = new Date(utc + 3600000 * offset);
    return cityDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-200 select-none overflow-hidden max-w-2xl mx-auto" dir="rtl">
      {/* Top Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-zinc-900 bg-black">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>
              {activeTab === 'alarm' && 'المنبه'}
              {activeTab === 'world' && 'الساعة العالمية'}
              {activeTab === 'stopwatch' && 'ساعة الإيقاف'}
              {activeTab === 'timer' && 'المؤقت'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
              MagicOS
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">الرياض (GMT+3)</p>
        </div>

        {activeTab === 'alarm' && (
          <button
            onClick={() => handleOpenAddModal()}
            className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-200 border border-zinc-800 flex items-center justify-center transition-all"
            title="إضافة منبه"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* TAB 1: ALARM */}
        {activeTab === 'alarm' && (
          <div className="space-y-5 max-w-lg mx-auto">
            {/* Digital Clock Display */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="text-6xl font-light tracking-wider text-zinc-100 font-mono">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
                <span className="text-2xl text-zinc-500 font-normal ml-2">
                  :{String(currentTime.getSeconds()).padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-medium">
                {currentTime.toLocaleDateString('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Alarms List */}
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-zinc-400">
                  قائمة المنبهات ({alarms.length})
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {alarms.filter((a) => a.isEnabled).length} نشط
                </span>
              </div>

              {alarms.map((alarm) => {
                const hourFormatted = String(alarm.hour).padStart(2, '0');
                const minuteFormatted = String(alarm.minute).padStart(2, '0');
                const period = alarm.hour >= 12 ? 'م' : 'ص';

                return (
                  <div
                    key={alarm.id}
                    className={`rounded-2xl border transition-all p-4 flex items-center justify-between ${
                      alarm.isEnabled
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-sm'
                        : 'bg-black/70 border-zinc-900/80 text-zinc-600'
                    }`}
                  >
                    <div
                      onClick={() => handleOpenAddModal(alarm)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold font-mono tracking-tight text-zinc-200">
                          {hourFormatted}:{minuteFormatted}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400">{period}</span>
                        {alarm.hour === 11 && alarm.minute === 11 && (
                          <span className="text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full font-mono">
                            نظام
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-zinc-400">{alarm.label}</span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {alarm.repeatDays
                            ? alarm.repeatDays
                                .split(',')
                                .map((d) => daysLabels[parseInt(d)])
                                .join('، ')
                            : 'مرة واحدة'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleAlarm(alarm.id)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                          alarm.isEnabled ? 'bg-zinc-700' : 'bg-zinc-900 border border-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-zinc-100 shadow-md transform transition-transform ${
                            alarm.isEnabled ? 'translate-x-0' : '-translate-x-6'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: WORLD CLOCK */}
        {activeTab === 'world' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 text-center">
              <span className="text-xs text-zinc-400">التوقيت المحلي (الرياض)</span>
              <div className="text-4xl font-light font-mono text-zinc-100 mt-1">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              {worldCities.map((city) => (
                <div
                  key={city.city}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-200">{city.city}</h3>
                    <p className="text-xs text-zinc-400">{city.country} • {city.diff}</p>
                  </div>
                  <div className="text-xl font-mono font-medium text-zinc-100">
                    {getWorldTime(city.offset)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STOPWATCH */}
        {activeTab === 'stopwatch' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-6 max-w-lg mx-auto">
            <div className="relative w-64 h-64 rounded-full border-4 border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-xl">
              <span className="text-4xl font-light font-mono tracking-wider text-zinc-100">
                {formatStopwatch(stopwatchTime)}
              </span>
              <span className="text-xs text-zinc-500 font-mono mt-1">دقيقة : ثانية : أجزاء</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setStopwatchTime(0);
                  setStopwatchRunning(false);
                  setLaps([]);
                }}
                disabled={stopwatchTime === 0 && !stopwatchRunning}
                className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-all"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setStopwatchRunning(!stopwatchRunning)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-zinc-100 shadow-xl transition-all active:scale-95 border ${
                  stopwatchRunning
                    ? 'bg-zinc-800 border-zinc-700'
                    : 'bg-zinc-900 border-zinc-700'
                }`}
              >
                {stopwatchRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 mr-1" />}
              </button>

              <button
                onClick={() => {
                  if (stopwatchRunning) {
                    setLaps([stopwatchTime, ...laps]);
                  }
                }}
                disabled={!stopwatchRunning}
                className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-all"
                title="دورة"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div className="w-full max-h-44 overflow-y-auto space-y-1.5 px-2">
                {laps.map((lap, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-300"
                  >
                    <span>الدورة {laps.length - i}</span>
                    <span>{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TIMER */}
        {activeTab === 'timer' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-6 max-w-lg mx-auto">
            <div className="relative w-64 h-64 rounded-full border-4 border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-xl">
              <span className="text-4xl font-light font-mono tracking-wider text-zinc-100">
                {formatTimer(timerSeconds)}
              </span>
              <span className="text-xs text-zinc-500 font-mono mt-1">ساعة : دقيقة : ثانية</span>
            </div>

            {/* Timer Presets */}
            {!timerRunning && (
              <div className="flex gap-2">
                {[
                  { label: '1 دقيقة', sec: 60 },
                  { label: '5 دقائق', sec: 300 },
                  { label: '10 دقائق', sec: 600 },
                  { label: '15 دقيقة', sec: 900 },
                ].map((preset) => (
                  <button
                    key={preset.sec}
                    onClick={() => {
                      setTimerSeconds(preset.sec);
                      setInitialTimerSeconds(preset.sec);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      timerSeconds === preset.sec
                        ? 'bg-zinc-800 border-zinc-750 text-zinc-100'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(initialTimerSeconds);
                }}
                className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-all"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-zinc-100 shadow-xl transition-all active:scale-95 border ${
                  timerRunning
                    ? 'bg-zinc-800 border-zinc-750'
                    : 'bg-zinc-900 border-zinc-750'
                }`}
              >
                {timerRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 mr-1" />}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bg-black border-t border-zinc-900 px-4 py-2 flex items-center justify-around z-20">
        {[
          { id: 'alarm', label: 'المنبه', icon: Bell },
          { id: 'world', label: 'الساعة العالمية', icon: Globe },
          { id: 'stopwatch', label: 'ساعة الإيقاف', icon: Timer },
          { id: 'timer', label: 'المؤقت', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-zinc-100 font-bold' : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-zinc-200' : 'text-zinc-600'} transition-transform`} />
              <span className="text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Add / Edit Alarm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h2 className="text-base font-bold text-zinc-100">
                {editingAlarm ? 'تعديل المنبه' : 'إضافة منبه جديد'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Picker Controls */}
            <div className="bg-black border border-zinc-850 rounded-2xl p-5 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <label className="text-xs text-zinc-400 mb-1">الساعة</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={inputHour}
                  onChange={(e) => setInputHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-20 bg-zinc-900 border border-zinc-750 rounded-xl py-2 text-center text-3xl font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <span className="text-3xl font-mono text-zinc-600 mt-4">:</span>

              <div className="flex flex-col items-center">
                <label className="text-xs text-zinc-400 mb-1">الدقيقة</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMinute}
                  onChange={(e) => setInputMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-20 bg-zinc-900 border border-zinc-750 rounded-xl py-2 text-center text-3xl font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Label input */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">اسم المنبه</label>
              <input
                type="text"
                value={inputLabel}
                onChange={(e) => setInputLabel(e.target.value)}
                placeholder="المنبه"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Repeat Days */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">أيام التكرار</label>
              <div className="grid grid-cols-7 gap-1">
                {daysLabels.map((day, idx) => {
                  const dayNum = String(idx);
                  const isSelected = inputRepeat.split(',').includes(dayNum);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const current = inputRepeat ? inputRepeat.split(',') : [];
                        const updated = isSelected
                          ? current.filter((d) => d !== dayNum)
                          : [...current, dayNum];
                        setInputRepeat(updated.join(','));
                      }}
                      className={`py-2 text-[11px] rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-zinc-200 text-zinc-950 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ringtone and Vibration */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between py-2 border-b border-zinc-900 text-sm">
                <span className="text-zinc-400">نغمة المنبه</span>
                <span className="text-xs text-zinc-400 font-mono font-medium">Honor Morning Mist</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-400">الاهتزاز</span>
                <button
                  type="button"
                  onClick={() => setInputVibrate(!inputVibrate)}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 flex items-center ${
                    inputVibrate ? 'bg-zinc-700' : 'bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-zinc-100 shadow-md transform transition-transform ${
                      inputVibrate ? 'translate-x-0' : '-translate-x-5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveAlarm}
                className="flex-1 bg-zinc-200 hover:bg-white active:scale-98 py-3 rounded-xl font-bold text-zinc-950 transition-all text-xs"
              >
                حفظ المنبه
              </button>
              {editingAlarm && (
                <button
                  type="button"
                  onClick={() => handleDeleteAlarm(editingAlarm.id)}
                  className="px-4 py-3 rounded-xl font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 text-xs"
                >
                  حذف
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-3 rounded-xl font-medium text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
