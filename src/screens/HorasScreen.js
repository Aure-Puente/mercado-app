//Importaciones:
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  crearRegistroHoras,
  obtenerUltimosRegistrosHoras,
} from "../services/horasService";

//JS:
const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MODOS_VISTA = [
  {
    value: "mes",
    label: "Mes",
    icon: "calendar-month",
  },
  {
    value: "semana",
    label: "Semana",
    icon: "calendar-week",
  },
];

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getFechaInput(date) {
  const anio = date.getFullYear();
  const mes = padNumber(date.getMonth() + 1);
  const dia = padNumber(date.getDate());

  return `${anio}-${mes}-${dia}`;
}

function getFechaLocal(date) {
  return date.toISOString();
}

function normalizarNumero(value) {
  const normalizado = String(value || "").replace(",", ".");
  const number = Number(normalizado);

  if (Number.isNaN(number)) return 0;

  return number;
}

function formatearMonto(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
}

function formatearHoras(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("es-AR", {
    minimumFractionDigits: number % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

function formatearFechaVisible(fechaISO) {
  if (!fechaISO) return "Sin fecha";

  const fecha = new Date(fechaISO + "T12:00:00");
  const diaNombre = DIAS_SEMANA[fecha.getDay()];

  const fechaFormateada = fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${diaNombre} ${fechaFormateada}`;
}

function obtenerInicioSemana(date) {
  const nuevaFecha = new Date(date);
  const dia = nuevaFecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;

  nuevaFecha.setDate(nuevaFecha.getDate() + diferencia);
  nuevaFecha.setHours(0, 0, 0, 0);

  return nuevaFecha;
}

function estaEnSemanaActual(fechaTexto) {
  const fecha = new Date(fechaTexto + "T12:00:00");
  const hoy = new Date();

  const inicioSemana = obtenerInicioSemana(hoy);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);

  return fecha >= inicioSemana && fecha <= finSemana;
}

function estaEnMesActual(registro) {
  const hoy = new Date();

  return (
    registro.mes === hoy.getMonth() + 1 &&
    registro.anio === hoy.getFullYear()
  );
}

function calcularTotales(registros) {
  return registros.reduce(
    (acc, registro) => {
      acc.horas += Number(registro.horas) || 0;
      acc.mercaderia += Number(registro.mercaderia) || 0;
      return acc;
    },
    {
      horas: 0,
      mercaderia: 0,
    }
  );
}

function agruparPorMes(registros) {
  const grupos = {};

  registros.forEach((registro) => {
    const key = `${registro.anio}-${padNumber(registro.mes)}`;
    const mesNombre = MESES[(registro.mes || 1) - 1] || "Mes";

    if (!grupos[key]) {
      grupos[key] = {
        key,
        titulo: `${mesNombre} ${registro.anio}`,
        registros: [],
        totalHoras: 0,
        totalMercaderia: 0,
      };
    }

    grupos[key].registros.push(registro);
    grupos[key].totalHoras += Number(registro.horas) || 0;
    grupos[key].totalMercaderia += Number(registro.mercaderia) || 0;
  });

  return Object.values(grupos).sort((a, b) => b.key.localeCompare(a.key));
}

function agruparPorSemana(registros) {
  const grupos = {};

  registros.forEach((registro) => {
    const fecha = new Date(registro.fecha + "T12:00:00");
    const inicioSemana = obtenerInicioSemana(fecha);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const key = getFechaInput(inicioSemana);

    const titulo = `Semana del ${inicioSemana.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    })} al ${finSemana.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    })}`;

    if (!grupos[key]) {
      grupos[key] = {
        key,
        titulo,
        registros: [],
        totalHoras: 0,
        totalMercaderia: 0,
      };
    }

    grupos[key].registros.push(registro);
    grupos[key].totalHoras += Number(registro.horas) || 0;
    grupos[key].totalMercaderia += Number(registro.mercaderia) || 0;
  });

  return Object.values(grupos).sort((a, b) => b.key.localeCompare(a.key));
}

export default function HorasScreen() {
  const theme = useTheme();

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  const [modoVista, setModoVista] = useState("mes");
  const [modalVisible, setModalVisible] = useState(false);

  const [fecha, setFecha] = useState(getFechaInput(new Date()));
  const [horas, setHoras] = useState("");
  const [mercaderia, setMercaderia] = useState("");
  const [observacion, setObservacion] = useState("");

  const registrosMesActual = useMemo(() => {
    return registros.filter(estaEnMesActual);
  }, [registros]);

  const registrosSemanaActual = useMemo(() => {
    return registros.filter((registro) => estaEnSemanaActual(registro.fecha));
  }, [registros]);

  const totalesMes = useMemo(() => {
    return calcularTotales(registrosMesActual);
  }, [registrosMesActual]);

  const totalesSemana = useMemo(() => {
    return calcularTotales(registrosSemanaActual);
  }, [registrosSemanaActual]);

  const grupos = useMemo(() => {
    if (modoVista === "semana") {
      return agruparPorSemana(registros);
    }

    return agruparPorMes(registros);
  }, [registros, modoVista]);

  const cargarRegistros = async () => {
    try {
      setCargandoRegistros(true);
      const data = await obtenerUltimosRegistrosHoras();
      setRegistros(data);
    } catch (error) {
      console.log("Error al cargar horas:", error);
      Alert.alert("Error", "No se pudieron cargar las horas.");
    } finally {
      setCargandoRegistros(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarRegistros();
    }, [])
  );

  const abrirModal = () => {
    setFecha(getFechaInput(new Date()));
    setHoras("");
    setMercaderia("");
    setObservacion("");
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
  };

  const guardarHoras = async () => {
    const horasNumber = normalizarNumero(horas);
    const mercaderiaNumber = normalizarNumero(mercaderia);

    if (!fecha) {
      Alert.alert("Fecha requerida", "Ingresá la fecha del día trabajado.");
      return;
    }

    if (!horas || Number.isNaN(horasNumber) || horasNumber <= 0) {
      Alert.alert(
        "Horas inválidas",
        "Ingresá una cantidad válida. Por ejemplo: 7 o 7.5"
      );
      return;
    }

    if (horasNumber > 24) {
      Alert.alert("Revisá las horas", "No podés cargar más de 24 horas.");
      return;
    }

    if (mercaderiaNumber < 0) {
      Alert.alert("Mercadería inválida", "La mercadería no puede ser negativa.");
      return;
    }

    try {
      setLoading(true);

      const fechaDate = new Date(fecha + "T12:00:00");

      await crearRegistroHoras({
        fecha,
        fechaLocal: getFechaLocal(fechaDate),
        diaNombre: DIAS_SEMANA[fechaDate.getDay()],
        mes: fechaDate.getMonth() + 1,
        anio: fechaDate.getFullYear(),
        horas: horasNumber,
        mercaderia: mercaderiaNumber,
        observacion: observacion.trim(),
      });

      cerrarModal();
      cargarRegistros();
    } catch (error) {
      console.log("Error al guardar horas:", error);
      Alert.alert("Error", "No se pudieron guardar las horas.");
    } finally {
      setLoading(false);
    }
  };

  const renderRegistro = (registro) => {
    const mercaderiaRegistro = Number(registro.mercaderia) || 0;

    return (
      <View
        key={registro.id}
        style={[
          styles.registroItem,
          {
            backgroundColor: theme.dark
              ? theme.colors.background + "90"
              : theme.colors.primary + "07",
            borderColor: theme.colors.outline + "45",
          },
        ]}
      >
        <View style={styles.registroTop}>
          <View style={styles.registroLeft}>
            <View
              style={[
                styles.registroIcon,
                {
                  backgroundColor: theme.colors.primary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="clock-check"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.registroText}>
              <Text
                variant="titleSmall"
                style={[
                  styles.registroFecha,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                {formatearFechaVisible(registro.fecha)}
              </Text>

              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                {registro.observacion || "Sin observación"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.registroChips}>
          <Chip
            compact
            style={[
              styles.registroChip,
              {
                backgroundColor: theme.colors.primary + "18",
                borderColor: theme.colors.primary + "35",
              },
            ]}
            textStyle={{
              color: theme.colors.primary,
              fontWeight: "900",
            }}
          >
            {formatearHoras(registro.horas)} h
          </Chip>

          <Chip
            compact
            icon="basket-outline"
            style={[
              styles.registroChip,
              {
                backgroundColor: theme.colors.secondary + "18",
                borderColor: theme.colors.secondary + "35",
              },
            ]}
            textStyle={{
              color: theme.colors.secondary,
              fontWeight: "900",
            }}
          >
            ${formatearMonto(mercaderiaRegistro)}
          </Chip>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={cargandoRegistros}
            onRefresh={cargarRegistros}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
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
                name="clock-check"
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
              Horas
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
            Cargá tus horas y la mercadería consumida por día.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Card
            mode="contained"
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + "55",
              },
            ]}
          >
            <Card.Content style={styles.summaryContent}>
              <View
                style={[
                  styles.summaryIcon,
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

              <Text
                variant="bodyMedium"
                style={[
                  styles.summaryLabel,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Horas mes
              </Text>

              <Text
                variant="headlineSmall"
                style={[
                  styles.summaryNumber,
                  {
                    color: theme.colors.primary,
                  },
                ]}
              >
                {formatearHoras(totalesMes.horas)} h
              </Text>
            </Card.Content>
          </Card>

          <Card
            mode="contained"
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + "55",
              },
            ]}
          >
            <Card.Content style={styles.summaryContent}>
              <View
                style={[
                  styles.summaryIcon,
                  {
                    backgroundColor: theme.colors.secondary + "14",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="basket-outline"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>

              <Text
                variant="bodyMedium"
                style={[
                  styles.summaryLabel,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Mercadería mes
              </Text>

              <Text
                variant="headlineSmall"
                style={[
                  styles.summaryNumber,
                  {
                    color: theme.colors.secondary,
                  },
                ]}
              >
                ${formatearMonto(totalesMes.mercaderia)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card
          mode="contained"
          style={[
            styles.weekCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.weekContent}>
            <View
              style={[
                styles.weekIcon,
                {
                  backgroundColor: theme.colors.primary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-week"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.weekText}>
              <Text
                variant="titleMedium"
                style={[
                  styles.weekTitle,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                Esta semana
              </Text>

              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                {formatearHoras(totalesSemana.horas)} h · $
                {formatearMonto(totalesSemana.mercaderia)} en mercadería
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="plus"
          onPress={abrirModal}
          style={styles.addButton}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.addButtonContent}
        >
          Cargar día
        </Button>

        <Card
          mode="contained"
          style={[
            styles.listCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.listContent}>
            <View style={styles.listHeader}>
              <View
                style={[
                  styles.listHeaderIcon,
                  {
                    backgroundColor: theme.colors.primary + "14",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="history"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.listHeaderText}>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.listTitle,
                    {
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Historial
                </Text>

                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  Horas y mercadería cargadas.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.viewSwitch,
                {
                  backgroundColor: theme.dark
                    ? theme.colors.background + "90"
                    : theme.colors.primary + "07",
                  borderColor: theme.colors.outline + "45",
                },
              ]}
            >
              {MODOS_VISTA.map((item) => {
                const selected = modoVista === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.85}
                    onPress={() => setModoVista(item.value)}
                    style={[
                      styles.viewSwitchOption,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary + "20"
                          : "transparent",
                        borderColor: selected
                          ? theme.colors.primary + "55"
                          : "transparent",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={
                        selected
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                    />

                    <Text
                      style={[
                        styles.viewSwitchText,
                        {
                          color: selected
                            ? theme.colors.primary
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {registros.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: theme.dark
                      ? theme.colors.background + "90"
                      : theme.colors.primary + "08",
                    borderColor: theme.colors.outline + "45",
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: theme.colors.primary + "14",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <Text
                  variant="bodyMedium"
                  style={[
                    styles.emptyText,
                    {
                      color: theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Todavía no cargaste registros.
                </Text>
              </View>
            ) : (
              grupos.map((grupo) => (
                <View
                  key={grupo.key}
                  style={[
                    styles.groupBox,
                    {
                      backgroundColor: theme.dark
                        ? theme.colors.background + "70"
                        : theme.colors.primary + "05",
                      borderColor: theme.colors.outline + "35",
                    },
                  ]}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupTitleBox}>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.groupTitle,
                          {
                            color: theme.colors.onSurface,
                          },
                        ]}
                      >
                        {grupo.titulo}
                      </Text>

                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                        }}
                      >
                        ${formatearMonto(grupo.totalMercaderia)} en mercadería
                      </Text>
                    </View>

                    <Chip
                      compact
                      style={[
                        styles.groupHoursChip,
                        {
                          backgroundColor: theme.colors.primary + "18",
                          borderColor: theme.colors.primary + "35",
                        },
                      ]}
                      textStyle={{
                        color: theme.colors.primary,
                        fontWeight: "900",
                      }}
                    >
                      {formatearHoras(grupo.totalHoras)} h
                    </Chip>
                  </View>

                  <Divider
                    style={[
                      styles.groupDivider,
                      {
                        backgroundColor: theme.colors.outline + "30",
                      },
                    ]}
                  />

                  {grupo.registros.map(renderRegistro)}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={cerrarModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + "45",
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <View
                  style={[
                    styles.modalIcon,
                    {
                      backgroundColor: theme.colors.primary + "14",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clock-plus-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.modalTitleText}>
                  <Text
                    variant="titleLarge"
                    style={[
                      styles.modalTitle,
                      {
                        color: theme.colors.onSurface,
                      },
                    ]}
                  >
                    Cargar día
                  </Text>

                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Guardá horas y mercadería consumida.
                  </Text>
                </View>
              </View>

              <IconButton
                icon="close"
                iconColor={theme.colors.onSurfaceVariant}
                onPress={cerrarModal}
              />
            </View>

            <TextInput
              label="Fecha"
              value={fecha}
              onChangeText={setFecha}
              mode="outlined"
              placeholder="YYYY-MM-DD"
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <TextInput
              label="Horas trabajadas"
              value={horas}
              onChangeText={setHoras}
              keyboardType="decimal-pad"
              mode="outlined"
              placeholder="Ej: 7.5"
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <TextInput
              label="Mercadería consumida"
              value={mercaderia}
              onChangeText={setMercaderia}
              keyboardType="numeric"
              mode="outlined"
              placeholder="Ej: 12000"
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.colors.secondary + "12",
                  borderColor: theme.colors.secondary + "35",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="basket-outline"
                size={22}
                color={theme.colors.secondary}
              />

              <Text
                variant="bodySmall"
                style={[
                  styles.infoText,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Este valor después lo usamos en la calculadora mensual para
                descontar tu mercadería con el 1.2.
              </Text>
            </View>

            <TextInput
              label="Observación opcional"
              value={observacion}
              onChangeText={setObservacion}
              mode="outlined"
              placeholder="Ej: turno tarde, feriado, etc."
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={cerrarModal}
                style={[
                  styles.modalButton,
                  {
                    borderColor: theme.colors.outline + "80",
                  },
                ]}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.modalButtonContent}
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                onPress={guardarHoras}
                loading={loading}
                disabled={loading}
                style={styles.modalButton}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.modalButtonContent}
              >
                Guardar
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 120,
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
    maxWidth: 340,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryContent: {
    paddingTop: 16,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontWeight: "700",
  },
  summaryNumber: {
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 5,
  },

  weekCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  weekContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
  },
  weekIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  weekText: {
    flex: 1,
  },
  weekTitle: {
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 3,
  },

  addButton: {
    borderRadius: 18,
    marginBottom: 18,
  },
  addButtonContent: {
    height: 52,
  },
  buttonLabel: {
    fontWeight: "900",
  },

  listCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  listContent: {
    paddingTop: 20,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  listHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeaderText: {
    flex: 1,
  },
  listTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 3,
  },

  viewSwitch: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    gap: 4,
    marginBottom: 18,
  },
  viewSwitchOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
  },
  viewSwitchText: {
    fontSize: 14,
    fontWeight: "900",
  },

  emptyBox: {
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
  },

  groupBox: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 13,
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  groupTitleBox: {
    flex: 1,
  },
  groupTitle: {
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  groupHoursChip: {
    borderWidth: 1,
    borderRadius: 999,
  },
  groupDivider: {
    marginVertical: 11,
  },

  registroItem: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  registroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  registroLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  registroIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  registroText: {
    flex: 1,
  },
  registroFecha: {
    fontWeight: "900",
    marginBottom: 2,
  },
  registroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 52,
  },
  registroChip: {
    borderWidth: 1,
    borderRadius: 999,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalHeaderText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingRight: 6,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleText: {
    flex: 1,
  },
  modalTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 3,
  },

  input: {
    marginBottom: 14,
  },
  inputOutline: {
    borderRadius: 16,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    borderRadius: 17,
  },
  modalButtonContent: {
    height: 50,
  },
});