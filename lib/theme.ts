import type { Restaurant, RestaurantTheme } from "@/types";
import { hasRestaurantFeature } from "@/lib/features";

export const DEFAULT_THEME: Required<RestaurantTheme> = {
  primaryColor: "#602e31",
  secondaryColor: "#2d1719",
  accentColor: "#602e31",
  backgroundColor: "#ffffff",
  textColor: "#241416",
  buttonStyle: "filled",
  borderRadius: "rounded",
};

export function getRestaurantTheme(restaurant: Restaurant): Required<RestaurantTheme> {
  if (!hasRestaurantFeature(restaurant, "CUSTOM_THEME")) {
    return DEFAULT_THEME;
  }

  const color = (value: string | undefined, fallback: string) => value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
  return {
    primaryColor: color(restaurant.theme?.primaryColor, DEFAULT_THEME.primaryColor),
    secondaryColor: color(restaurant.theme?.secondaryColor, DEFAULT_THEME.secondaryColor),
    accentColor: color(restaurant.theme?.accentColor, DEFAULT_THEME.accentColor),
    backgroundColor: color(restaurant.theme?.backgroundColor, DEFAULT_THEME.backgroundColor),
    textColor: color(restaurant.theme?.textColor, DEFAULT_THEME.textColor),
    buttonStyle: restaurant.theme?.buttonStyle || DEFAULT_THEME.buttonStyle,
    borderRadius: restaurant.theme?.borderRadius || DEFAULT_THEME.borderRadius,
  };
}

export function getThemeCSSVariables(theme: Required<RestaurantTheme>): Record<string, string> {
  const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor, buttonStyle, borderRadius } = theme;

  const borderRadiusMap = {
    sharp: "0px",
    rounded: "0.75rem",
    pill: "9999px",
  };

  return {
    "--restaurant-primary": primaryColor,
    "--restaurant-primary-light": adjustColor(primaryColor, 20),
    "--restaurant-primary-dark": adjustColor(primaryColor, -20),
    "--restaurant-secondary": secondaryColor,
    "--restaurant-accent": accentColor,
    "--restaurant-background": backgroundColor,
    "--restaurant-text": textColor,
    "--restaurant-text-muted": adjustColor(textColor, -40),
    "--restaurant-border-radius": borderRadiusMap[borderRadius],
    "--restaurant-button-style": buttonStyle,
  };
}

function adjustColor(hex: string, amount: number): string {
  const color = hex.replace("#", "");
  const num = parseInt(color, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
