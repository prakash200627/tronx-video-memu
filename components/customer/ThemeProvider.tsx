"use client";

import { useEffect } from "react";
import type { Restaurant } from "@/types";
import { getRestaurantTheme, getThemeCSSVariables } from "@/lib/theme";

type ThemeProviderProps = {
  restaurant: Restaurant;
  children: React.ReactNode;
};

export default function ThemeProvider({ restaurant, children }: ThemeProviderProps) {
  useEffect(() => {
    const cssVars = getThemeCSSVariables(getRestaurantTheme(restaurant));
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => root.style.setProperty(key, value));

    return () => {
      Object.keys(cssVars).forEach((key) => root.style.removeProperty(key));
    };
  }, [restaurant]);

  return <>{children}</>;
}
