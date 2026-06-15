//App:
import React, { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import AppNavigator from "./src/navigation/AppNavigator";
import { darkTheme, lightTheme } from "./src/theme/theme";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

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