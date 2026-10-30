import React, { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("relay_theme") as Theme;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
      }
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);
      
      setResolvedTheme(isDark ? "dark" : "light");

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();

    const handler = () => {
      if (theme === "system") applyTheme();
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("relay_theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const defaultThemeContext: ThemeContextType = {
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "dark",
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  return ctx || defaultThemeContext;
};

/**
 * Exactly one theme toggle component designed exclusively for the sidebar
 * and mobile navigation drawer.
 */
export const SidebarThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-[11px] font-mono text-white/50 px-1">
        <span>Interface Theme</span>
        <span className="capitalize text-white/80">{theme}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 bg-[#17263D] p-1 rounded-lg border border-white/10 select-none">
        <button
          onClick={() => setTheme("light")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            theme === "light"
              ? "bg-[#456BFA] text-white shadow-sm font-semibold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          title="Light Theme"
          aria-label="Set light theme"
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Light</span>
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            theme === "dark"
              ? "bg-[#456BFA] text-white shadow-sm font-semibold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          title="Dark Theme"
          aria-label="Set dark theme"
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dark</span>
        </button>

        <button
          onClick={() => setTheme("system")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            theme === "system"
              ? "bg-[#456BFA] text-white shadow-sm font-semibold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          title="System Preference"
          aria-label="Set system theme"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto</span>
        </button>
      </div>
    </div>
  );
};
