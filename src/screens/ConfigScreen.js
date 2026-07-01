//Importaciones:
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Divider,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  activarRecordatorioHoras,
  desactivarRecordatorioHoras,
  guardarHorarioRecordatorioHoras,
  obtenerConfigRecordatorioHoras,
} from "../services/notificationsService";

//JS:
function formatHora(hour, minute) {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${h}:${m}`;
}

export default function ConfigScreen({ isDarkMode, setIsDarkMode }) {
  const theme = useTheme();

  const [notificacionesActivas, setNotificacionesActivas] = useState(false);
  const [hora, setHora] = useState("10");
  const [minutos, setMinutos] = useState("00");
  const [loadingNoti, setLoadingNoti] = useState(false);

  useEffect(() => {
    cargarConfigNotificaciones();
  }, []);

  const cargarConfigNotificaciones = async () => {
    try {
      const config = await obtenerConfigRecordatorioHoras();

      setNotificacionesActivas(config.enabled);
      setHora(String(config.hour).padStart(2, "0"));
      setMinutos(String(config.minute).padStart(2, "0"));
    } catch (error) {
      console.log("Error al cargar config de notificaciones:", error);
    }
  };

  const validarHorario = () => {
    const hourNumber = Number(hora);
    const minuteNumber = Number(minutos);

    if (
      Number.isNaN(hourNumber) ||
      Number.isNaN(minuteNumber) ||
      hourNumber < 0 ||
      hourNumber > 23 ||
      minuteNumber < 0 ||
      minuteNumber > 59
    ) {
      Alert.alert(
        "Horario inválido",
        "Ingresá una hora válida. Por ejemplo: 10 y 00, o 18 y 30."
      );

      return null;
    }

    return {
      hour: hourNumber,
      minute: minuteNumber,
    };
  };

  const toggleNotificaciones = async () => {
    const horario = validarHorario();

    if (!horario) return;

    try {
      setLoadingNoti(true);

      if (notificacionesActivas) {
        await desactivarRecordatorioHoras();
        setNotificacionesActivas(false);
      } else {
        await activarRecordatorioHoras(horario);
        setNotificacionesActivas(true);

        Alert.alert(
          "Recordatorio activado",
          `Te voy a recordar todos los días a las ${formatHora(
            horario.hour,
            horario.minute
          )}.`
        );
      }
    } catch (error) {
      console.log("Error con notificaciones:", error);

      Alert.alert(
        "No se pudo activar",
        "Revisá que hayas dado permiso para recibir notificaciones."
      );
    } finally {
      setLoadingNoti(false);
    }
  };

  const guardarHorario = async () => {
    const horario = validarHorario();

    if (!horario) return;

    try {
      setLoadingNoti(true);

      await guardarHorarioRecordatorioHoras(horario);

      Alert.alert(
        "Horario guardado",
        notificacionesActivas
          ? `El recordatorio quedó programado para las ${formatHora(
              horario.hour,
              horario.minute
            )}.`
          : `El horario quedó guardado para las ${formatHora(
              horario.hour,
              horario.minute
            )}. Activá el switch cuando quieras recibir el recordatorio.`
      );
    } catch (error) {
      console.log("Error al guardar horario:", error);

      Alert.alert("Error", "No se pudo guardar el horario del recordatorio.");
    } finally {
      setLoadingNoti(false);
    }
  };

  const horaActualVisible = formatHora(Number(hora), Number(minutos));

  return (
    <KeyboardAvoidingView
      style={[
        styles.keyboardContainer,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <View style={styles.headerTitleBox}>
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor: theme.colors.primary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <Text
              variant="headlineMedium"
              style={[
                styles.title,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Config
            </Text>
          </View>

          <Text
            variant="bodyLarge"
            style={[
              styles.subtitle,
              {
                color: theme.colors.onSurfaceVariant,
              },
            ]}
          >
            Ajustá la apariencia y los recordatorios de la app.
          </Text>
        </View>

        <Card
          mode="contained"
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.settingRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: theme.colors.primary + "14",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isDarkMode ? "weather-night" : "white-balance-sunny"}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.textBox}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Tema oscuro
                </Text>

                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  Cambiá entre modo claro y modo oscuro.
                </Text>
              </View>

              <Switch
                value={isDarkMode}
                onValueChange={() => setIsDarkMode(!isDarkMode)}
              />
            </View>
          </Card.Content>
        </Card>

        <Card
          mode="contained"
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.settingRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: theme.colors.secondary + "14",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={24}
                  color={theme.colors.secondary}
                />
              </View>

              <View style={styles.textBox}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Recordatorio de horas
                </Text>

                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  Recibí una notificación diaria para cargar tus horas.
                </Text>
              </View>

              <Switch
                value={notificacionesActivas}
                onValueChange={toggleNotificaciones}
                disabled={loadingNoti}
              />
            </View>

            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: notificacionesActivas
                    ? theme.colors.primary + "10"
                    : theme.colors.secondary + "10",
                  borderColor: notificacionesActivas
                    ? theme.colors.primary + "25"
                    : theme.colors.secondary + "25",
                },
              ]}
            >
              <View
                style={[
                  styles.statusIcon,
                  {
                    backgroundColor: notificacionesActivas
                      ? theme.colors.primary + "18"
                      : theme.colors.secondary + "18",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    notificacionesActivas
                      ? "bell-check-outline"
                      : "bell-off-outline"
                  }
                  size={20}
                  color={
                    notificacionesActivas
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                />
              </View>

              <View style={styles.statusTextBox}>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.statusTitle,
                    {
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  {notificacionesActivas
                    ? "Recordatorio activo"
                    : "Recordatorio desactivado"}
                </Text>

                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {notificacionesActivas
                    ? `Todos los días a las ${horaActualVisible}.`
                    : `Horario guardado: ${horaActualVisible}.`}
                </Text>
              </View>
            </View>

            <Divider
              style={[
                styles.divider,
                {
                  backgroundColor: theme.colors.outline + "30",
                },
              ]}
            />

            <View style={styles.timeHeader}>
              <View
                style={[
                  styles.timeIcon,
                  {
                    backgroundColor: theme.colors.primary + "14",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.timeHeaderText}>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.timeTitle,
                    {
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Horario del recordatorio
                </Text>

                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  Actualmente configurado a las {horaActualVisible}
                </Text>
              </View>
            </View>

            <View style={styles.timeInputs}>
              <TextInput
                label="Hora"
                value={hora}
                onChangeText={setHora}
                keyboardType="number-pad"
                mode="outlined"
                maxLength={2}
                style={styles.timeInput}
                outlineStyle={styles.inputOutline}
              />

              <TextInput
                label="Minutos"
                value={minutos}
                onChangeText={setMinutos}
                keyboardType="number-pad"
                mode="outlined"
                maxLength={2}
                style={styles.timeInput}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <Button
              mode="outlined"
              icon="content-save-outline"
              onPress={guardarHorario}
              loading={loadingNoti}
              disabled={loadingNoti}
              style={[
                styles.saveButton,
                {
                  borderColor: theme.colors.outline + "80",
                },
              ]}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.saveButtonContent}
            >
              Guardar horario
            </Button>
          </Card.Content>
        </Card>

        <Card
          mode="contained"
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.primary + "10",
              borderColor: theme.colors.primary + "25",
            },
          ]}
        >
          <Card.Content style={styles.infoContent}>
            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor: theme.colors.primary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoTextBox}>
              <Text
                variant="titleSmall"
                style={[
                  styles.infoTitle,
                  {
                    color: theme.colors.primary,
                  },
                ]}
              >
                Mercado App
              </Text>

              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Base lista para cargar pedidos, horas, pagos y cálculos del
                trabajo.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 210,
  },

  header: {
    marginBottom: 22,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    lineHeight: 24,
    maxWidth: 350,
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },
  cardContent: {
    paddingTop: 18,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  statusBox: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 13,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTextBox: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: "900",
    marginBottom: 3,
  },

  divider: {
    marginVertical: 18,
  },

  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  timeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timeHeaderText: {
    flex: 1,
  },
  timeTitle: {
    fontWeight: "900",
    marginBottom: 3,
  },
  timeInputs: {
    flexDirection: "row",
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  inputOutline: {
    borderRadius: 16,
  },

  saveButton: {
    borderRadius: 17,
    marginTop: 16,
  },
  saveButtonContent: {
    height: 50,
  },
  buttonLabel: {
    fontWeight: "900",
  },

  infoCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 18,
  },
  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 5,
  },
});