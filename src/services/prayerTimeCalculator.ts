/**
 * Astronomical Prayer Time Calculation Engine using device GPS coordinates.
 * Generates accurate real-time camouflage phrases matching current Islamic prayer windows.
 */

export interface PrayerSchedule {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export class PrayerTimeCalculator {
  /**
   * Calculates prayer times in fractional hours for a given latitude, longitude, and date.
   */
  public static calculatePrayerTimes(
    latitude: number = 24.7136, // Riyadh default
    longitude: number = 46.6753,
    date: Date = new Date()
  ): PrayerSchedule {
    // Day of the year
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const timeZoneOffsetHours = -date.getTimezoneOffset() / 60.0;

    // Solar declination & Equation of time approximation
    const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
    const declination = (23.45 * Math.PI) / 180 * Math.sin(b);

    const latRad = (latitude * Math.PI) / 180;

    // Solar noon (Dhuhr)
    const noon = 12.0 + (4 * (longitude - timeZoneOffsetHours * 15.0) - eot) / 60.0;

    // Helper for hour angle
    const hourAngle = (angleDeg: number): number => {
      const angleRad = (angleDeg * Math.PI) / 180;
      const cosHA =
        (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(declination)) /
        (Math.cos(latRad) * Math.cos(declination));
      const clamped = Math.max(-1.0, Math.min(1.0, cosHA));
      return ((Math.acos(clamped) * 180) / Math.PI) / 15.0;
    };

    // Fajr (18 degrees below horizon)
    const fajrHA = hourAngle(-18.0);
    const fajr = noon - fajrHA;

    // Sunrise (-0.833 degrees)
    const sunriseHA = hourAngle(-0.833);
    const sunrise = noon - sunriseHA;

    // Asr (Shafi'i: shadow length factor = 1)
    const asrAltRad = Math.atan(1.0 / (1.0 + Math.tan(Math.abs(latRad - declination))));
    const cosAsrHA =
      (Math.sin(asrAltRad) - Math.sin(latRad) * Math.sin(declination)) /
      (Math.cos(latRad) * Math.cos(declination));
    const asrHA = ((Math.acos(Math.max(-1.0, Math.min(1.0, cosAsrHA))) * 180) / Math.PI) / 15.0;
    const asr = noon + asrHA;

    // Maghrib (-0.833 degrees sunset)
    const maghrib = noon + sunriseHA;

    // Isha (18 degrees below horizon)
    const isha = noon + fajrHA;

    const dhuhr = noon + 2.0 / 60.0;

    return {
      fajr: (fajr + 24) % 24,
      sunrise: (sunrise + 24) % 24,
      dhuhr: (dhuhr + 24) % 24,
      asr: (asr + 24) % 24,
      maghrib: (maghrib + 24) % 24,
      isha: (isha + 24) % 24,
    };
  }

  /**
   * Determines current contextual camouflage notification phrase based on prayer times or alarm clock.
   */
  public static getContextualCamouflagePhrase(
    latitude: number = 24.7136,
    longitude: number = 46.6753,
    currentHour?: number,
    currentMinute?: number
  ): { title: string; body: string } {
    const now = new Date();
    const hour = currentHour !== undefined ? currentHour : now.getHours();
    const minute = currentMinute !== undefined ? currentMinute : now.getMinutes();
    const currentDecimalTime = hour + minute / 60.0;

    const schedule = this.calculatePrayerTimes(latitude, longitude, now);

    if (currentDecimalTime < schedule.sunrise) {
      return { title: 'تنبيه أوقات الصلاة', body: 'موعد صلاة الفجر قد فاتك' };
    }
    if (currentDecimalTime < schedule.dhuhr) {
      return { title: 'تطبيق الساعة', body: 'المنبه يعمل: الاستيقاظ الصباحي' };
    }
    if (currentDecimalTime < schedule.asr) {
      return { title: 'تنبيه أوقات الصلاة', body: 'موعد صلاة الظهر قد فاتك' };
    }
    if (currentDecimalTime < schedule.maghrib) {
      return { title: 'تنبيه أوقات الصلاة', body: 'موعد صلاة العصر قد فاتك' };
    }
    if (currentDecimalTime < schedule.isha) {
      return { title: 'تنبيه أوقات الصلاة', body: 'موعد صلاة المغرب قد فاتك' };
    }
    return { title: 'تنبيه أوقات الصلاة', body: 'موعد صلاة العشاء قد فاتك' };
  }
}
