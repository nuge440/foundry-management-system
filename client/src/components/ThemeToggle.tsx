import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("blue");
    else if (theme === "blue") setTheme("dark");
    else setTheme("light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      data-testid="button-theme-toggle"
      title={`Current theme: ${theme}`}
    >
      <Sun className="h-5 w-5 absolute transition-all opacity-100 scale-100 rotate-0 blue:opacity-0 blue:scale-0 blue:-rotate-90 dark:opacity-0 dark:scale-0 dark:-rotate-90" />
      <Palette className="h-5 w-5 absolute transition-all opacity-0 scale-0 rotate-90 blue:opacity-100 blue:scale-100 blue:rotate-0 dark:opacity-0 dark:scale-0 dark:rotate-90" />
      <Moon className="h-5 w-5 absolute transition-all opacity-0 scale-0 rotate-90 dark:opacity-100 dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </Button>
  );
}
