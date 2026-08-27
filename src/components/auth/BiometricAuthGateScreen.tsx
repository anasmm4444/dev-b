import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Fingerprint, Delete, ArrowRight, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BiometricSecurityManager } from '../../services/security';

interface BiometricAuthGateScreenProps {
  onAuthenticated: () => void;
  onBackToClock: () => void;
}

export const BiometricAuthGateScreen: React.FC<BiometricAuthGateScreenProps> = ({
  onAuthenticated,
  onBackToClock,
}) => {
  const isFirstTimeSetup = !BiometricSecurityManager.isSetupComplete();

  // Setup state
  const [setupStep, setSetupStep] = useState<'ENTER_PIN' | 'CONFIRM_PIN'>('ENTER_PIN');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Unlock state
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  // Auto trigger biometric prompt if supported on mount for returning users
  useEffect(() => {
    if (!isFirstTimeSetup && BiometricSecurityManager.isBiometricEnabled()) {
      handleBiometricAuth();
    }
  }, [isFirstTimeSetup]);

  const handleKeyPress = (num: string) => {
    setErrorMessage(null);
    if (isFirstTimeSetup) {
      if (setupStep === 'ENTER_PIN') {
        if (firstPin.length < 4) {
          const next = firstPin + num;
          setFirstPin(next);
          if (next.length === 4) {
            setTimeout(() => {
              setSetupStep('CONFIRM_PIN');
            }, 200);
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const next = confirmPin + num;
          setConfirmPin(next);
          if (next.length === 4) {
            handleCompleteSetup(firstPin, next);
          }
        }
      }
    } else {
      if (enteredPin.length < 4) {
        const next = enteredPin + num;
        setEnteredPin(next);
        if (next.length === 4) {
          handleVerifyPin(next);
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (isFirstTimeSetup) {
      if (setupStep === 'ENTER_PIN') {
        setFirstPin((prev) => prev.slice(0, -1));
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
    } else {
      setEnteredPin((prev) => prev.slice(0, -1));
    }
  };

  const handleCompleteSetup = async (pin1: string, pin2: string) => {
    if (pin1 !== pin2) {
      triggerError('الرمزان غير متطابقين، يرجى المحاولة ثانية');
      setFirstPin('');
      setConfirmPin('');
      setSetupStep('ENTER_PIN');
      return;
    }

    const success = await BiometricSecurityManager.setupInitialPin(pin1);
    if (success) {
      onAuthenticated();
    } else {
      triggerError('حدث خطأ أثناء تشفير المفتاح الرئيسي');
    }
  };

  const handleVerifyPin = async (pin: string) => {
    const valid = await BiometricSecurityManager.verifyPin(pin);
    if (valid) {
      onAuthenticated();
    } else {
      triggerError('رمز PIN غير صحيح');
      setEnteredPin('');
    }
  };

  const handleBiometricAuth = async () => {
    setIsBiometricScanning(true);
    setErrorMessage(null);
    const success = await BiometricSecurityManager.authenticateBiometric();
    setIsBiometricScanning(false);
    if (success) {
      onAuthenticated();
    } else {
      setErrorMessage('فشل التحقق من البصمة، استخدم رمز PIN');
    }
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const activeDigitsCount = isFirstTimeSetup
    ? setupStep === 'ENTER_PIN'
      ? firstPin.length
      : confirmPin.length
    : enteredPin.length;

  return (
    <div
      className="flex flex-col h-screen w-full bg-black text-zinc-200 select-none overflow-hidden justify-between p-6 max-w-md mx-auto"
      dir="rtl"
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToClock}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-900"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للساعة</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-900">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span>تشفير عتادي AES-256</span>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
        <div className="w-20 h-20 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-xl relative">
          <Lock className="w-9 h-9 text-zinc-300" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-zinc-100">
            {isFirstTimeSetup
              ? setupStep === 'ENTER_PIN'
                ? 'تعيين رمز الحماية الرئيسي'
                : 'تأكيد رمز الحماية'
              : 'الخزنة المشفرة'}
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs">
            {isFirstTimeSetup
              ? setupStep === 'ENTER_PIN'
                ? 'أدخل 4 أرقام لتوليد مفتاح التشفير لجهازك'
                : 'أعد إدخال نفس الرمز للتأكيد'
              : 'أدخل رمز PIN أو استخدم البصمة لفتح المحادثات'}
          </p>
        </div>

        {/* PIN Indicators */}
        <motion.div
          animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-4 py-3"
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < activeDigitsCount;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-zinc-100 scale-125 shadow-md shadow-zinc-500/20'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              />
            );
          })}
        </motion.div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs mx-auto pb-4">
        <div className="grid grid-cols-3 gap-3.5" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="w-18 h-18 mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 active:scale-95 text-2xl font-mono font-medium text-zinc-100 flex items-center justify-center transition-all shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button or Spacer */}
          <div className="flex items-center justify-center">
            {!isFirstTimeSetup && BiometricSecurityManager.isBiometricEnabled() ? (
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isBiometricScanning}
                className="w-18 h-18 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 flex items-center justify-center transition-all"
                title="مسح البصمة"
              >
                <Fingerprint
                  className={`w-7 h-7 ${isBiometricScanning ? 'animate-pulse text-zinc-100' : 'text-zinc-400'}`}
                />
              </button>
            ) : (
              <div className="w-18 h-18" />
            )}
          </div>

          {/* Zero button */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-18 h-18 mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 active:scale-95 text-2xl font-mono font-medium text-zinc-100 flex items-center justify-center transition-all shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-18 h-18 mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-all"
            title="حذف"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
