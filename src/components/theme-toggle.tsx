"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useNotification } from "@/hooks/use-notification"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { showNotification } = useNotification();

  const handleThemeChange = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    showNotification(`Theme set to ${newTheme}`);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
    >
      <Sun className="h-[1.5rem] w-[1.3rem] dark:hidden" />
      <Moon className="hidden h-5 w-5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
