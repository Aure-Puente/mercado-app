//App:
import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppNavigator from "./src/navigation/AppNavigator";
import { darkTheme, lightTheme } from "./src/theme/theme";

//JS:
const THEME_STORAGE_KEY = "mi_mercado_theme_mode";

export default function App() {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    cargarTemaGuardado();
  }, []);

  const cargarTemaGuardado = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      if (savedTheme === "dark") {
        setIsDarkModeState(true);
      }

      if (savedTheme === "light") {
        setIsDarkModeState(false);
      }
    } catch (error) {
      console.log("Error al cargar tema guardado:", error);
    } finally {
      setThemeLoaded(true);
    }
  };

  const setIsDarkMode = async (value) => {
    try {
      setIsDarkModeState(value);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, value ? "dark" : "light");
    } catch (error) {
      console.log("Error al guardar tema:", error);
    }
  };

  const theme = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

  if (!themeLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <AppNavigator
        theme={theme}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    </PaperProvider>
  );
}