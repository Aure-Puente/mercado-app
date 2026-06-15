//Importaciones:
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

//JS:
const NOTIFICATION_ENABLED_KEY = "horas_notification_enabled";
const NOTIFICATION_HOUR_KEY = "horas_notification_hour";
const NOTIFICATION_MINUTE_KEY = "horas_notification_minute";
const NOTIFICATION_ID_KEY = "horas_notification_id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function pedirPermisosNotificaciones() {
  const permisosActuales = await Notifications.getPermissionsAsync();

  if (permisosActuales.granted) {
    return true;
  }

  const permisosNuevos = await Notifications.requestPermissionsAsync();

  return permisosNuevos.granted;
}

async function cancelarRecordatorioActual() {
  const notificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);

  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.log("No se pudo cancelar la notificación anterior:", error);
    }
  }

  await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
}

export async function activarRecordatorioHoras({ hour = 10, minute = 0 } = {}) {
  const permisosOk = await pedirPermisosNotificaciones();

  if (!permisosOk) {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
    return false;
  }

  await cancelarRecordatorioActual();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Cargar horas",
      body: "No te olvides de cargar las horas y la mercadería del día.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
  await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, String(minute));
  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);

  return true;
}

export async function desactivarRecordatorioHoras() {
  await cancelarRecordatorioActual();
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
}

export async function obtenerConfigRecordatorioHoras() {
  const enabledValue = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
  const hourValue = await AsyncStorage.getItem(NOTIFICATION_HOUR_KEY);
  const minuteValue = await AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY);

  return {
    enabled: enabledValue === "true",
    hour: hourValue ? Number(hourValue) : 10,
    minute: minuteValue ? Number(minuteValue) : 0,
  };
}

export async function guardarHorarioRecordatorioHoras({ hour, minute }) {
  await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, String(minute));

  const enabledValue = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);

  if (enabledValue === "true") {
    await activarRecordatorioHoras({ hour, minute });
  }
}