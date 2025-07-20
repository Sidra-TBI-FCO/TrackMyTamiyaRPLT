// Settings for photo slideshow and other app preferences
export interface SlideshowSettings {
  duration: number; // seconds per slide
  showCaptions: boolean;
  showTags: boolean;
  autoStart: boolean;
  shuffle: boolean;
}

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