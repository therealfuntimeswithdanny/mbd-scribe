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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "amber";
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-foreground", theme.primaryForeground);
    root.style.setProperty("--accent", theme.accent);
    
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: string) => {
    if (themes[theme]) {
      setCurrentTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
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
