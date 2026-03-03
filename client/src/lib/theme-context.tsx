import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { getAppSettings, saveAppSettings, AppSettings, ColorScheme } from "./settings";

interface ThemeContextType {
  colorScheme: ColorScheme;
  darkMode: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

async function fetchServerTheme(): Promise<Partial<AppSettings> | null> {
  try {
    const res = await fetch('/api/user/theme-settings', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && (data.colorScheme || data.darkMode !== undefined)) {
      return data as Partial<AppSettings>;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveServerTheme(settings: Partial<AppSettings>): Promise<void> {
  try {
    await fetch('/api/user/theme-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });
  } catch {
    // Silently fail — localStorage is still the fallback
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const initialized = useRef(false);

  const applyTheme = (scheme: ColorScheme, dark: boolean) => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
    html.classList.remove("tamiya-theme", "military-theme");
    if (scheme === "tamiya") {
      html.classList.add("tamiya-theme");
    }
  };

  const setColorScheme = (scheme: ColorScheme) => {
    const newSettings = { ...settings, colorScheme: scheme };
    setSettings(newSettings);
    saveAppSettings({ colorScheme: scheme });
    applyTheme(scheme, settings.darkMode);
    saveServerTheme({ colorScheme: scheme, darkMode: settings.darkMode });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !settings.darkMode;
    const newSettings = { ...settings, darkMode: newDarkMode };
    setSettings(newSettings);
    saveAppSettings({ darkMode: newDarkMode });
    applyTheme(settings.colorScheme, newDarkMode);
    saveServerTheme({ colorScheme: settings.colorScheme, darkMode: newDarkMode });
  };

  // Apply theme from localStorage immediately on mount
  useEffect(() => {
    applyTheme(settings.colorScheme, settings.darkMode);
  }, []);

  // After mount, try to fetch server-side theme and override if present
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetchServerTheme().then((serverSettings) => {
      if (!serverSettings) return;

      const merged: AppSettings = {
        ...getAppSettings(),
        ...serverSettings,
      };

      // Only update if actually different from current
      if (
        merged.colorScheme !== settings.colorScheme ||
        merged.darkMode !== settings.darkMode
      ) {
        setSettings(merged);
        saveAppSettings(merged);
        applyTheme(merged.colorScheme, merged.darkMode);
      }
    });
  }, []);

  return (
    <ThemeContext.Provider value={{
      colorScheme: settings.colorScheme,
      darkMode: settings.darkMode,
      setColorScheme,
      toggleDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
