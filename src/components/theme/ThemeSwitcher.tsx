import { Palette, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, themes } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeSwitcher = () => {
  const { currentTheme, setTheme, darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDarkMode}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Change color theme">
            <Palette className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          {Object.entries(themes).map(([key, theme]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key)}
              className={cn(
                "cursor-pointer",
                currentTheme === key && "bg-secondary"
              )}
            >
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: `hsl(${theme.primary})` }}
              />
              {theme.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
