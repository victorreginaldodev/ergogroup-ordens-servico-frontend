import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import { Label } from "@/components/ui/label";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <div className="flex items-center gap-2">
      <Sun className="w-4 h-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Alternar tema claro/escuro"
      />
      <Moon className="w-4 h-4 text-muted-foreground" />
      <Label className="sr-only">Tema</Label>
    </div>
  );
};

export default ThemeToggle;
