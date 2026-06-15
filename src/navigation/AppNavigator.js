//Importaciones:
import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import MercadoScreen from "../screens/MercadoScreen";
import CajaScreen from "../screens/CajaScreen";
import PagosScreen from "../screens/PagosScreen";
import HorasScreen from "../screens/HorasScreen";
import CalculadoraScreen from "../screens/CalculadoraScreen";
import ConfigScreen from "../screens/ConfigScreen";

//JS:
const Tab = createBottomTabNavigator();

export default function AppNavigator({ theme, isDarkMode, setIsDarkMode }) {
  const getIconName = (routeName, focused) => {
    if (routeName === "Mercado") {
      return focused ? "food-apple" : "food-apple-outline";
    }

    if (routeName === "Caja") {
      return focused ? "cash-register" : "cash-register";
    }

    if (routeName === "Pedidos") {
      return focused ? "truck-delivery" : "truck-delivery-outline";
    }

    if (routeName === "Horas") {
      return focused ? "clock-check" : "clock-outline";
    }

    if (routeName === "Calculadora") {
      return focused ? "calculator" : "calculator-variant-outline";
    }

    if (routeName === "Config") {
      return focused ? "cog" : "cog-outline";
    }

    return "circle-outline";
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,

          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,

          tabBarStyle: {
            ...styles.tabBar,
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline + "25",
          },

          tabBarItemStyle: styles.tabBarItem,

          tabBarLabelStyle: {
            ...styles.tabBarLabel,
          },

          tabBarIcon: ({ color, focused }) => {
            const iconName = getIconName(route.name, focused);

            return (
              <View
                style={[
                  styles.iconWrapper,
                  focused && {
                    backgroundColor: theme.colors.primary + "18",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={focused ? 24 : 22}
                  color={color}
                />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Mercado" component={MercadoScreen} />

        <Tab.Screen name="Caja" component={CajaScreen} />

        <Tab.Screen
          name="Pedidos"
          component={PagosScreen}
        />

        <Tab.Screen name="Horas" component={HorasScreen} />

        <Tab.Screen
          name="Calculadora"
          component={CalculadoraScreen}
          options={{
            tabBarLabel: "Calc.",
          }}
        />

        <Tab.Screen name="Config">
          {() => (
            <ConfigScreen
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

//Estilos:
const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    elevation: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  iconWrapper: {
    width: 42,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});