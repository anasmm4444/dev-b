import React, { useState, useEffect } from 'react';
import { AppNavigationScreen } from './types';
import { chatRepository } from './services/chatRepository';
import { BiometricSecurityManager } from './services/security';
import { HonorAlarmScreen } from './components/alarm/HonorAlarmScreen';
import { BiometricAuthGateScreen } from './components/auth/BiometricAuthGateScreen';
import { HandleRegistrationScreen } from './components/auth/HandleRegistrationScreen';
import { ShoshoChatListScreen } from './components/chat/ShoshoChatListScreen';
import { ShoshoConversationScreen } from './components/chat/ShoshoConversationScreen';
import { ShoshoSettingsScreen } from './components/settings/ShoshoSettingsScreen';
import { CamouflageNotificationBanner } from './components/notification/CamouflageNotificationBanner';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppNavigationScreen>('HONOR_ALARM');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Stealth trigger from Honor Alarm when 11:11 is set
  const handleStealthTrigger = () => {
    setCurrentScreen('BIOMETRIC_AUTH_GATE');
  };

  // Auth gate unlocked
  const handleAuthenticated = () => {
    const handle = chatRepository.getCurrentUserHandle();
    if (!handle) {
      setCurrentScreen('HANDLE_REGISTRATION');
    } else {
      setCurrentScreen('CHAT_LIST');
    }
  };

  // Handle registered
  const handleRegistered = () => {
    setCurrentScreen('CHAT_LIST');
  };

  // Select chat
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setCurrentScreen('CONVERSATION');
  };

  // Navigate to settings
  const handleNavigateToSettings = () => {
    setCurrentScreen('SETTINGS');
  };

  // Lock to Clock
  const handleLockToClock = () => {
    BiometricSecurityManager.lockApp();
    setActiveChatId(null);
    setCurrentScreen('HONOR_ALARM');
  };

  return (
    <div className="w-full h-screen bg-black text-zinc-200 overflow-hidden flex flex-col font-sans select-none" dir="rtl">
      {/* Camouflaged notification banner */}
      <CamouflageNotificationBanner />

      <main className="w-full h-full flex-1 flex flex-col overflow-hidden relative">
        {currentScreen === 'HONOR_ALARM' && (
          <HonorAlarmScreen onStealthTrigger={handleStealthTrigger} />
        )}

        {currentScreen === 'BIOMETRIC_AUTH_GATE' && (
          <BiometricAuthGateScreen
            onAuthenticated={handleAuthenticated}
            onBackToClock={handleLockToClock}
          />
        )}

        {currentScreen === 'HANDLE_REGISTRATION' && (
          <HandleRegistrationScreen
            onRegistered={handleRegistered}
            onBackToClock={handleLockToClock}
          />
        )}

        {currentScreen === 'CHAT_LIST' && (
          <ShoshoChatListScreen
            onSelectChat={handleSelectChat}
            onNavigateToSettings={handleNavigateToSettings}
            onLockToClock={handleLockToClock}
          />
        )}

        {currentScreen === 'CONVERSATION' && activeChatId && (
          <ShoshoConversationScreen
            chatId={activeChatId}
            onBack={() => setCurrentScreen('CHAT_LIST')}
          />
        )}

        {currentScreen === 'SETTINGS' && (
          <ShoshoSettingsScreen
            onBack={() => setCurrentScreen('CHAT_LIST')}
            onLockToClock={handleLockToClock}
            onDataWiped={() => {
              handleLockToClock();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
