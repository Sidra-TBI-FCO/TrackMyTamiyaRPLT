// Settings for photo slideshow and other app preferences
export interface SlideshowSettings {
  duration: number; // seconds per slide
  showCaptions: boolean;
  showTags: boolean;
  autoStart: boolean;
  shuffle: boolean;
}

// App theme settings
export type ColorScheme = 'tamiya' | 'military';

export interface AppSettings {
  colorScheme: ColorScheme;
  darkMode: boolean;
}

export const defaultAppSettings: AppSettings = {
  colorScheme: 'military',
  darkMode: false,
};

export const defaultSlideshowSettings: SlideshowSettings = {
  duration: 4,
  showCaptions: true,
  showTags: true,
  autoStart: true,
  shuffle: false,
};

const SETTINGS_KEY = 'tamiya_slideshow_settings';

export function getSlideshowSettings(): SlideshowSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSlideshowSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('Failed to load slideshow settings:', error);
  }
  return defaultSlideshowSettings;
}

export function saveSlideshowSettings(settings: Partial<SlideshowSettings>): void {
  try {
    const current = getSlideshowSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save slideshow settings:', error);
  }
}

// App settings functions
const APP_SETTINGS_KEY = 'tamiya_app_settings';

export function getAppSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(APP_SETTINGS_KEY);
    if (saved) {
      return { ...defaultAppSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('Failed to load app settings:', error);
  }
  return defaultAppSettings;
}

export function saveAppSettings(settings: Partial<AppSettings>): void {
  try {
    const current = getAppSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save app settings:', error);
  }
}