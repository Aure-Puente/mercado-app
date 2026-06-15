import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_ENABLED_KEY = "horas_notification_enabled";
const NOTIFICATION_HOUR_KEY = "horas_notification_hour";
const NOTIFICATION_MINUTE_KEY = "horas_notification_minute";

export async function activarRecordatorioHoras({ hour = 10, minute = 0 } = {}) {
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
  await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, String(minute));

  return true;
}

export async function desactivarRecordatorioHoras() {
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
}