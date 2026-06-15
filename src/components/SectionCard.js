//Importaciones:
import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

//JS:
export default function SectionCard({ icon, title, description }) {
  const theme = useTheme();

  return (
    <Card
      mode="contained"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <Card.Content style={styles.content}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: theme.colors.primary + "18",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.textBox}>
          <Text
            variant="titleMedium"
            style={[
              styles.title,
              {
                color: theme.colors.onSurface,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              {
                color: theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {description}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontWeight: "800",
    marginBottom: 4,
  },
  description: {
    lineHeight: 20,
  },
});