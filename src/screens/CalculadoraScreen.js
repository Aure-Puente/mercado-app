//Importaciones:
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Menu,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { obtenerUltimosRegistrosHoras } from "../services/horasService";
import {
  guardarCalculoSueldo,
  obtenerCalculoSueldo,
} from "../services/sueldoService";

//JS:
const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

function normalizarNumero(value) {
  const normalizado = String(value || "").replace(",", ".");
  const number = Number(normalizado);

  if (Number.isNaN(number)) {
    return 0;
  }

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

function getMesKey(anio, mes) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatearFechaPdf(fechaTexto) {
  if (!fechaTexto) return "-";

  const fecha = new Date(fechaTexto + "T12:00:00");

  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CalculadoraScreen() {
  const theme = useTheme();

  const hoy = new Date();

  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());

  const [menuMesVisible, setMenuMesVisible] = useState(false);

  const [registrosHoras, setRegistrosHoras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const [valorHora, setValorHora] = useState("");
  const [adelanto, setAdelanto] = useState("");
  const [saldado, setSaldado] = useState(false);

  const mesActual = MESES.find((item) => item.value === mesSeleccionado);
  const mesKey = getMesKey(anioSeleccionado, mesSeleccionado);

  const cargarHoras = async () => {
    try {
      setCargando(true);

      const data = await obtenerUltimosRegistrosHoras();
      setRegistrosHoras(data);
    } catch (error) {
      console.log("Error al cargar horas para calculadora:", error);
      Alert.alert("Error", "No se pudieron cargar las horas del mes.");
    } finally {
      setCargando(false);
    }
  };

  const cargarCalculoGuardado = async () => {
    try {
      const calculo = await obtenerCalculoSueldo(mesKey);

      if (calculo) {
        setValorHora(String(calculo.valorHora || ""));
        setAdelanto(String(calculo.adelanto || ""));
        setSaldado(!!calculo.saldado);
      } else {
        setValorHora("");
        setAdelanto("");
        setSaldado(false);
      }
    } catch (error) {
      console.log("Error al cargar cálculo guardado:", error);
    }
  };

  useEffect(() => {
    cargarHoras();
  }, []);

  useEffect(() => {
    cargarCalculoGuardado();
  }, [mesKey]);

  useFocusEffect(
    useCallback(() => {
      cargarHoras();
      cargarCalculoGuardado();
    }, [mesKey])
  );

  const registrosDelMes = useMemo(() => {
    return registrosHoras
      .filter((registro) => {
        return (
          registro.mes === mesSeleccionado &&
          registro.anio === anioSeleccionado
        );
      })
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [registrosHoras, mesSeleccionado, anioSeleccionado]);

  const horasDelMes = useMemo(() => {
    return registrosDelMes.reduce(
      (acc, registro) => acc + (Number(registro.horas) || 0),
      0
    );
  }, [registrosDelMes]);

  const mercaderiaDelMes = useMemo(() => {
    return registrosDelMes.reduce(
      (acc, registro) => acc + (Number(registro.mercaderia) || 0),
      0
    );
  }, [registrosDelMes]);

  const valorHoraNumber = normalizarNumero(valorHora);
  const adelantoNumber = normalizarNumero(adelanto);

  const bruto = horasDelMes * valorHoraNumber;
  const mercaderiaConDescuento = mercaderiaDelMes / 1.2;
  const totalFinal = bruto - adelantoNumber - mercaderiaConDescuento;

    const resultColor =
    totalFinal >= 0 ? theme.colors.primary : theme.colors.error;

  const resultBackground =
    totalFinal >= 0
      ? theme.dark
        ? theme.colors.primary + "18"
        : theme.colors.primary + "10"
      : theme.dark
      ? "#3A1F24"
      : "#FEE2E2";

  const resultBorder =
    totalFinal >= 0
      ? theme.colors.primary + "35"
      : theme.dark
      ? "#7F1D1D"
      : "#FCA5A5";

  const resultIconBackground =
    totalFinal >= 0
      ? theme.colors.primary + "18"
      : theme.dark
      ? "#7F1D1D55"
      : "#FECACA";

  const cambiarAnio = (type) => {
    if (type === "prev") {
      setAnioSeleccionado((prev) => prev - 1);
      return;
    }

    setAnioSeleccionado((prev) => prev + 1);
  };

  const guardarCalculo = async () => {
    try {
      setGuardando(true);

      await guardarCalculoSueldo({
        mesKey,
        mes: mesSeleccionado,
        anio: anioSeleccionado,
        valorHora: valorHoraNumber,
        adelanto: adelantoNumber,
        mercaderia: mercaderiaDelMes,
        mercaderiaConDescuento,
        horasMes: horasDelMes,
        bruto,
        totalFinal,
        saldado,
      });

      Alert.alert("Guardado", "El cálculo del mes quedó guardado.");
    } catch (error) {
      console.log("Error al guardar cálculo:", error);
      Alert.alert("Error", "No se pudo guardar el cálculo.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarSaldado = async () => {
    const nuevoEstado = !saldado;
    setSaldado(nuevoEstado);

    try {
      await guardarCalculoSueldo({
        mesKey,
        mes: mesSeleccionado,
        anio: anioSeleccionado,
        valorHora: valorHoraNumber,
        adelanto: adelantoNumber,
        mercaderia: mercaderiaDelMes,
        mercaderiaConDescuento,
        horasMes: horasDelMes,
        bruto,
        totalFinal,
        saldado: nuevoEstado,
      });
    } catch (error) {
      console.log("Error al cambiar estado saldado:", error);
      Alert.alert("Error", "No se pudo actualizar el estado del mes.");
      setSaldado(!nuevoEstado);
    }
  };

  const crearHtmlPdf = () => {
    const filas = registrosDelMes
      .map((registro) => {
        const mercaderia = Number(registro.mercaderia) || 0;

        return `
          <tr>
            <td>${escaparHtml(registro.diaNombre || "-")}</td>
            <td>${formatearFechaPdf(registro.fecha)}</td>
            <td class="right">${formatearHoras(registro.horas)} h</td>
            <td class="right">$${formatearMonto(mercaderia)}</td>
            <td>${escaparHtml(registro.observacion || "Sin observación")}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #0f172a;
              background: #ffffff;
            }

            .header {
              border-bottom: 3px solid #16a34a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }

            .badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 999px;
              background: ${saldado ? "#dcfce7" : "#fef3c7"};
              color: ${saldado ? "#15803d" : "#b45309"};
              font-size: 12px;
              font-weight: 700;
              margin-bottom: 10px;
            }

            h1 {
              margin: 0;
              font-size: 26px;
              color: #0f172a;
            }

            .subtitle {
              margin-top: 6px;
              color: #64748b;
              font-size: 14px;
            }

            .cards {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 18px;
            }

            .card {
              border: 1px solid #d8dee9;
              border-radius: 16px;
              padding: 14px;
              background: #f8fafc;
            }

            .label {
              color: #64748b;
              font-size: 12px;
              margin-bottom: 5px;
            }

            .value {
              font-size: 22px;
              font-weight: 800;
              color: #16a34a;
            }

            .value.orange {
              color: #f59e0b;
            }

            .value.red {
              color: #dc2626;
            }

            .formula {
              border: 1px solid #bbf7d0;
              background: #f0fdf4;
              border-radius: 16px;
              padding: 14px;
              margin-bottom: 18px;
            }

            .formula-title {
              font-weight: 800;
              color: #16a34a;
              margin-bottom: 8px;
            }

            .formula-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 14px;
            }

            .formula-row.total {
              border-top: 1px solid #bbf7d0;
              margin-top: 8px;
              padding-top: 10px;
              font-size: 18px;
              font-weight: 800;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              font-size: 12px;
            }

            th {
              text-align: left;
              background: #16a34a;
              color: white;
              padding: 9px;
            }

            td {
              border-bottom: 1px solid #e2e8f0;
              padding: 8px;
              vertical-align: top;
            }

            tr:nth-child(even) td {
              background: #f8fafc;
            }

            .right {
              text-align: right;
              white-space: nowrap;
            }

            .section-title {
              margin-top: 22px;
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
            }

            .footer {
              margin-top: 24px;
              color: #64748b;
              font-size: 11px;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="badge">${saldado ? "Mes saldado" : "Mes pendiente"}</div>
            <h1>Resumen de sueldo - ${mesActual?.label} ${anioSeleccionado}</h1>
            <div class="subtitle">Mercado App · Detalle de horas, mercadería y cálculo final</div>
          </div>

          <div class="cards">
            <div class="card">
              <div class="label">Horas trabajadas</div>
              <div class="value">${formatearHoras(horasDelMes)} h</div>
            </div>

            <div class="card">
              <div class="label">Valor hora</div>
              <div class="value">$${formatearMonto(valorHoraNumber)}</div>
            </div>

            <div class="card">
              <div class="label">Bruto</div>
              <div class="value orange">$${formatearMonto(bruto)}</div>
            </div>

            <div class="card">
              <div class="label">Total final a cobrar</div>
              <div class="value ${totalFinal < 0 ? "red" : ""}">$${formatearMonto(totalFinal)}</div>
            </div>
          </div>

          <div class="formula">
            <div class="formula-title">Cuenta del mes</div>

            <div class="formula-row">
              <span>Horas x valor hora</span>
              <strong>$${formatearMonto(bruto)}</strong>
            </div>

            <div class="formula-row">
              <span>Adelanto / efectivo a descontar</span>
              <strong>-$${formatearMonto(adelantoNumber)}</strong>
            </div>

            <div class="formula-row">
              <span>Mercadería cargada del mes</span>
              <strong>$${formatearMonto(mercaderiaDelMes)}</strong>
            </div>

            <div class="formula-row">
              <span>Mercadería con descuento / 1.2</span>
              <strong>-$${formatearMonto(mercaderiaConDescuento)}</strong>
            </div>

            <div class="formula-row total">
              <span>Total final</span>
              <strong>$${formatearMonto(totalFinal)}</strong>
            </div>
          </div>

          <div class="section-title">Detalle diario</div>

          <table>
            <thead>
              <tr>
                <th>Día</th>
                <th>Fecha</th>
                <th class="right">Horas</th>
                <th class="right">Mercadería</th>
                <th>Observación</th>
              </tr>
            </thead>

            <tbody>
              ${
                registrosDelMes.length > 0
                  ? filas
                  : `
                    <tr>
                      <td colspan="5">No hay registros cargados para este mes.</td>
                    </tr>
                  `
              }
            </tbody>
          </table>

          <div class="footer">
            PDF generado desde Mercado App.
          </div>
        </body>
      </html>
    `;
  };

  const generarPdf = async () => {
    try {
      setGenerandoPdf(true);

      const html = crearHtmlPdf();

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const puedeCompartir = await Sharing.isAvailableAsync();

      if (!puedeCompartir) {
        Alert.alert("PDF generado", `El PDF se generó en: ${uri}`);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Resumen ${mesActual?.label} ${anioSeleccionado}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.log("Error al generar PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF.");
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
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
          refreshing={cargando}
          onRefresh={cargarHoras}
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
              name="calculator"
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
            Calculadora
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
          Calculá cuánto cobrás por mes usando las horas, mercadería diaria y
          adelantos.
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
          <View style={styles.monthHeader}>
            <View style={styles.monthHeaderText}>
              <Text
                variant="titleLarge"
                style={[
                  styles.cardTitle,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                Mes a calcular
              </Text>

              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Seleccioná el mes para traer sus horas y mercadería.
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: saldado
                    ? theme.colors.primary + "16"
                    : theme.colors.secondary + "16",
                  borderColor: saldado
                    ? theme.colors.primary + "35"
                    : theme.colors.secondary + "35",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={saldado ? "check-circle-outline" : "clock-outline"}
                size={17}
                color={saldado ? theme.colors.primary : theme.colors.secondary}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: saldado
                      ? theme.colors.primary
                      : theme.colors.secondary,
                  },
                ]}
              >
                {saldado ? "Saldado" : "Pendiente"}
              </Text>
            </View>
          </View>

          <View style={styles.selectorRow}>
            <Menu
              visible={menuMesVisible}
              onDismiss={() => setMenuMesVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  icon="calendar-month"
                  onPress={() => setMenuMesVisible(true)}
                  style={[
                    styles.monthButton,
                    {
                      borderColor: theme.colors.outline + "80",
                    },
                  ]}
                  labelStyle={styles.buttonLabel}
                  contentStyle={styles.selectorButtonContent}
                >
                  {mesActual?.label || "Mes"}
                </Button>
              }
            >
              {MESES.map((mes) => (
                <Menu.Item
                  key={mes.value}
                  onPress={() => {
                    setMesSeleccionado(mes.value);
                    setMenuMesVisible(false);
                  }}
                  title={mes.label}
                />
              ))}
            </Menu>

            <View
              style={[
                styles.yearBox,
                {
                  borderColor: theme.colors.outline + "55",
                  backgroundColor: theme.dark
                    ? theme.colors.background + "90"
                    : theme.colors.primary + "07",
                },
              ]}
            >
              <IconButton
                icon="chevron-left"
                size={22}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => cambiarAnio("prev")}
              />

              <Text
                variant="titleMedium"
                style={[
                  styles.yearText,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                {anioSeleccionado}
              </Text>

              <IconButton
                icon="chevron-right"
                size={22}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => cambiarAnio("next")}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

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
              Horas del mes
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
              {formatearHoras(horasDelMes)} h
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
              Mercadería
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
              ${formatearMonto(mercaderiaDelMes)}
            </Text>
          </Card.Content>
        </Card>
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
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: theme.colors.primary + "14",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>

            <Text
              variant="titleLarge"
              style={[
                styles.cardTitle,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Datos del cálculo
            </Text>
          </View>

          <TextInput
            label="Valor de mi hora"
            value={valorHora}
            onChangeText={setValorHora}
            keyboardType="numeric"
            mode="outlined"
            placeholder="Ej: 2500"
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            label="Efectivo a descontar / adelanto"
            value={adelanto}
            onChangeText={setAdelanto}
            keyboardType="numeric"
            mode="outlined"
            placeholder="Ej: 20000"
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          <View
            style={[
              styles.mercaderiaBox,
              {
                backgroundColor: theme.colors.secondary + "10",
                borderColor: theme.colors.secondary + "30",
              },
            ]}
          >
            <View
              style={[
                styles.mercaderiaIcon,
                {
                  backgroundColor: theme.colors.secondary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="basket-outline"
                size={24}
                color={theme.colors.secondary}
              />
            </View>

            <View style={styles.mercaderiaText}>
              <Text
                variant="titleSmall"
                style={[
                  styles.discountTitle,
                  {
                    color: theme.colors.secondary,
                  },
                ]}
              >
                Mercadería tomada desde Horas
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.mercaderiaLine,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Total cargado en el mes: ${formatearMonto(mercaderiaDelMes)}
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.mercaderiaLine,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Con descuento / 1.2: $
                {formatearMonto(mercaderiaConDescuento)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.resultBox,
              {
                backgroundColor: resultBackground,
                borderColor: resultBorder,
              },
            ]}
          >
            <View style={styles.resultTextBox}>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "800",
                }}
              >
                Total final a cobrar
              </Text>

              <Text
                variant="headlineMedium"
                style={[
                  styles.totalFinal,
                  {
                    color: resultColor,
                  },
                ]}
              >
                ${formatearMonto(totalFinal)}
              </Text>
            </View>

            <View
              style={[
                styles.resultIcon,
                {
                  backgroundColor: resultIconBackground,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={totalFinal >= 0 ? "cash-check" : "alert-circle-outline"}
                size={24}
                color={resultColor}
              />
            </View>
          </View>

          <View
            style={[
              styles.breakdownBox,
              {
                backgroundColor: theme.dark
                  ? theme.colors.background + "90"
                  : theme.colors.primary + "07",
                borderColor: theme.colors.outline + "45",
              },
            ]}
          >
            <View style={styles.breakdownRow}>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Horas x valor hora
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.breakdownValue,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                ${formatearMonto(bruto)}
              </Text>
            </View>

            <Divider
              style={[
                styles.breakdownDivider,
                {
                  backgroundColor: theme.colors.outline + "30",
                },
              ]}
            />

            <View style={styles.breakdownRow}>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Adelanto
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.breakdownValue,
                  {
                    color: theme.colors.error,
                  },
                ]}
              >
                - ${formatearMonto(adelantoNumber)}
              </Text>
            </View>

            <Divider
              style={[
                styles.breakdownDivider,
                {
                  backgroundColor: theme.colors.outline + "30",
                },
              ]}
            />

            <View style={styles.breakdownRow}>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Mercadería con descuento
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.breakdownValue,
                  {
                    color: theme.colors.error,
                  },
                ]}
              >
                - ${formatearMonto(mercaderiaConDescuento)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.saldadoRow,
              {
                backgroundColor: saldado
                  ? theme.colors.primary + "10"
                  : theme.colors.secondary + "10",
                borderColor: saldado
                  ? theme.colors.primary + "25"
                  : theme.colors.secondary + "25",
              },
            ]}
          >
            <View
              style={[
                styles.saldadoIcon,
                {
                  backgroundColor: saldado
                    ? theme.colors.primary + "18"
                    : theme.colors.secondary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={saldado ? "check-circle-outline" : "clock-outline"}
                size={22}
                color={saldado ? theme.colors.primary : theme.colors.secondary}
              />
            </View>

            <View style={styles.saldadoText}>
              <Text
                variant="titleMedium"
                style={[
                  styles.saldadoTitle,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                Mes saldado
              </Text>

              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Marcá esto cuando ya te hayan pagado este mes.
              </Text>
            </View>

            <Switch value={saldado} onValueChange={cambiarSaldado} />
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={generarPdf}
              loading={generandoPdf}
              disabled={generandoPdf}
              style={[
                styles.pdfButton,
                {
                  borderColor: theme.colors.outline + "80",
                },
              ]}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.actionButtonContent}
            >
              PDF
            </Button>

            <Button
              mode="contained"
              icon="content-save-outline"
              onPress={guardarCalculo}
              loading={guardando}
              disabled={guardando}
              style={styles.saveButton}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Guardar
            </Button>
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
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: theme.colors.primary + "14",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={20}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.sectionTextBox}>
              <Text
                variant="titleLarge"
                style={[
                  styles.cardTitle,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                Detalle usado
              </Text>

              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Registros cargados en {mesActual?.label} {anioSeleccionado}.
              </Text>
            </View>
          </View>

          {registrosDelMes.length === 0 ? (
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
                No hay registros cargados para este mes.
              </Text>
            </View>
          ) : (
            registrosDelMes.map((registro) => {
              const mercaderiaRegistro = Number(registro.mercaderia) || 0;

              return (
                <View
                  key={registro.id}
                  style={[
                    styles.hourItem,
                    {
                      backgroundColor: theme.dark
                        ? theme.colors.background + "90"
                        : theme.colors.primary + "07",
                      borderColor: theme.colors.outline + "45",
                    },
                  ]}
                >
                  <View style={styles.hourItemTop}>
                    <View
                      style={[
                        styles.hourIcon,
                        {
                          backgroundColor: theme.colors.primary + "14",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="clock-check"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.hourItemText}>
                      <Text
                        variant="titleSmall"
                        style={[
                          styles.hourDate,
                          {
                            color: theme.colors.onSurface,
                          },
                        ]}
                      >
                        {registro.diaNombre} · {registro.fecha}
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

                  <View style={styles.hourChips}>
                    <Chip
                      compact
                      style={[
                        styles.hourChip,
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
                        styles.hourChip,
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
            })
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

//Estilos:
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
    maxWidth: 350,
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },
  cardContent: {
    paddingTop: 20,
  },
  cardTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  monthHeaderText: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "900",
  },
  selectorRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  monthButton: {
    flex: 1,
    borderRadius: 17,
  },
  selectorButtonContent: {
    height: 50,
  },
  buttonLabel: {
    fontWeight: "900",
  },
  yearBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 17,
  },
  yearText: {
    fontWeight: "900",
    minWidth: 54,
    textAlign: "center",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
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

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTextBox: {
    flex: 1,
    gap: 3,
  },

  input: {
    marginBottom: 14,
  },
  inputOutline: {
    borderRadius: 16,
  },

  mercaderiaBox: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  mercaderiaIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mercaderiaText: {
    flex: 1,
  },
  discountTitle: {
    fontWeight: "900",
    marginBottom: 6,
  },
  mercaderiaLine: {
    lineHeight: 20,
    fontWeight: "600",
  },

  resultBox: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultTextBox: {
    flex: 1,
  },
  totalFinal: {
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 4,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  breakdownBox: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  breakdownValue: {
    fontWeight: "900",
    textAlign: "right",
  },
  breakdownDivider: {
    marginVertical: 10,
  },

  saldadoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderRadius: 22,
    padding: 12,
  },
  saldadoIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saldadoText: {
    flex: 1,
  },
  saldadoTitle: {
    fontWeight: "900",
    marginBottom: 3,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  pdfButton: {
    flex: 1,
    borderRadius: 17,
  },
  saveButton: {
    flex: 1,
    borderRadius: 17,
  },
  actionButtonContent: {
    height: 50,
  },

  emptyBox: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
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

  hourItem: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    marginBottom: 10,
    gap: 10,
  },
  hourItemTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hourIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  hourItemText: {
    flex: 1,
  },
  hourDate: {
    fontWeight: "900",
    marginBottom: 2,
  },
  hourChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 52,
  },
  hourChip: {
    borderWidth: 1,
    borderRadius: 999,
  },
});