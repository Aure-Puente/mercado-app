//Theme:
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    primary: "#16A34A",
    onPrimary: "#FFFFFF",

    secondary: "#F59E0B",
    onSecondary: "#FFFFFF",

    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceVariant: "#EEF2F7",

    onSurface: "#0F172A",
    onSurfaceVariant: "#64748B",

    outline: "#D8DEE9",

    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    primary: "#4ADE80",
    onPrimary: "#052E16",

    secondary: "#FBBF24",
    onSecondary: "#422006",

    background: "#0F172A",
    surface: "#1E293B",
    surfaceVariant: "#334155",

    onSurface: "#F8FAFC",
    onSurfaceVariant: "#CBD5E1",

    outline: "#475569",

    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
  },
};