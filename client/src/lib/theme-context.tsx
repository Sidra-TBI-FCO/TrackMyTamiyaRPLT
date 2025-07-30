import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAppSettings, saveAppSettings, AppSettings, ColorScheme } from "./settings";

interface ThemeContextType {
  colorScheme: ColorScheme;
  darkMode: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  
  const setColorScheme = (scheme: ColorScheme) => {
    const newSettings = { ...settings, colorScheme: scheme };
    setSettings(newSettings);
    saveAppSettings({ colorScheme: scheme });
    applyTheme(scheme, settings.darkMode);
  };
  
  const toggleDarkMode = () => {
    const newDarkMode = !settings.darkMode;
    const newSettings = { ...settings, darkMode: newDarkMode };
    setSettings(newSettings);
    saveAppSettings({ darkMode: newDarkMode });
    applyTheme(settings.colorScheme, newDarkMode);
  };
  
  const applyTheme = (scheme: ColorScheme, dark: boolean) => {
    const html = document.documentElement;
    
    // Apply dark mode class
    html.classList.toggle("dark", dark);
    
    // Apply color scheme class - military is now default, tamiya is alternative
    html.classList.remove("tamiya-theme", "military-theme");
    if (scheme === "tamiya") {
      html.classList.add("tamiya-theme");
    }
    // military theme is default, so no class needed
  };
  
  // Initialize theme on mount
  useEffect(() => {
    applyTheme(settings.colorScheme, settings.darkMode);
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