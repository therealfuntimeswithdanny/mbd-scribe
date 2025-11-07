import { createContext, useContext, useEffect, useState } from "react";

type Theme = {
  name: string;
  primary: string;
  primaryForeground: string;
  accent: string;
};

export const themes: Record<string, Theme> = {
  amber: {
    name: "Amber",
    primary: "25 95% 53%",
    primaryForeground: "0 0% 100%",
    accent: "35 95% 60%",
  },
  red: {
    name: "Red",
    primary: "0 84% 60%",
    primaryForeground: "0 0% 100%",
    accent: "0 72% 51%",
  },
  orange: {
    name: "Orange",
    primary: "24 95% 53%",
    primaryForeground: "0 0% 100%",
    accent: "31 91% 60%",
  },
  yellow: {
    name: "Yellow",
    primary: "45 93% 47%",
    primaryForeground: "0 0% 100%",
    accent: "48 96% 53%",
  },
  green: {
    name: "Green",
    primary: "142 71% 45%",
    primaryForeground: "0 0% 100%",
    accent: "142 76% 36%",
  },
  blue: {
    name: "Blue",
    primary: "221 83% 53%",
    primaryForeground: "0 0% 100%",
    accent: "217 91% 60%",
  },
  purple: {
    name: "Purple",
    primary: "271 81% 56%",
    primaryForeground: "0 0% 100%",
    accent: "271 91% 65%",
  },
  pink: {
    name: "Pink",
    primary: "330 81% 60%",
    primaryForeground: "0 0% 100%",
    accent: "330 91% 70%",
  },
};

interface ThemeContextType {
  currentTheme: string;
  setTheme: (theme: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "amber";
  });

  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return saved === "true";
    }
    // Check system preference if no saved preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-foreground", theme.primaryForeground);
    root.style.setProperty("--accent", theme.accent);
    
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const setTheme = (theme: string) => {
    if (themes[theme]) {
      setCurrentTheme(theme);
    }
  };

  const setDarkMode = (dark: boolean) => {
    setDarkModeState(dark);
  };

  const toggleDarkMode = () => {
    setDarkModeState(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
