import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
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
  crearResumenPagos,
  obtenerUltimosResumenesPagos,
} from "../services/pagosService";

const WHATSAPP_NUMBER = "5492234977176";

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const ORIGENES_DINERO = [
  {
    value: "Caja",
    label: "Caja",
    icon: "cash-register",
  },
  {
    value: "Atrás",
    label: "Atrás",
    icon: "archive-outline",
  },
  {
    value: "Transferencia",
    label: "Transfer.",
    icon: "bank-transfer",
  },
];

function formatearMonto(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin fecha";

  const fecha = new Date(fechaISO);
  const diaNombre = DIAS_SEMANA[fecha.getDay()];

  const fechaFormateada = fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const horaFormateada = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${diaNombre} ${fechaFormateada} - ${horaFormateada}`;
}

function obtenerFechaMensaje() {
  const fecha = new Date();
  const diaNombre = DIAS_SEMANA[fecha.getDay()];

  const fechaFormateada = fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${diaNombre} ${fechaFormateada}`;
}

function calcularTotales(pagos) {
  const totalCaja = pagos
    .filter((pago) => pago.origen === "Caja")
    .reduce((acc, pago) => acc + Number(pago.monto), 0);

  const totalAtras = pagos
    .filter((pago) => pago.origen === "Atrás")
    .reduce((acc, pago) => acc + Number(pago.monto), 0);

  const totalTransferencia = pagos
    .filter((pago) => pago.origen === "Transferencia")
    .reduce((acc, pago) => acc + Number(pago.monto), 0);

  const totalGeneral = totalCaja + totalAtras + totalTransferencia;

  return {
    totalCaja,
    totalAtras,
    totalTransferencia,
    totalGeneral,
  };
}

function armarMensajePagos(pagos) {
  const fechaTexto = obtenerFechaMensaje();
  const { totalCaja, totalAtras, totalTransferencia, totalGeneral } =
    calcularTotales(pagos);

  const pagosTexto = pagos
    .map((pago, index) => {
      return `${index + 1}. ${pago.proveedor} - $${formatearMonto(
        pago.monto
      )} (${pago.origen})`;
    })
    .join("\n");

  return `Pagos del día ${fechaTexto}:\n\n${pagosTexto}\n\nTotal Caja: $${formatearMonto(
    totalCaja
  )}\nTotal Atrás: $${formatearMonto(
    totalAtras
  )}\nTotal Transferencia: $${formatearMonto(
    totalTransferencia
  )}\nTotal general: $${formatearMonto(totalGeneral)}`;
}

export default function PagosScreen() {
  const theme = useTheme();

  const [pagos, setPagos] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [proveedor, setProveedor] = useState("");
  const [monto, setMonto] = useState("");
  const [origen, setOrigen] = useState("Caja");

  const [loading, setLoading] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const { totalCaja, totalAtras, totalTransferencia, totalGeneral } =
    useMemo(() => {
      return calcularTotales(pagos);
    }, [pagos]);

  const mensajePreview = useMemo(() => {
    if (pagos.length === 0) {
      return "Todavía no cargaste pagos.";
    }

    return armarMensajePagos(pagos);
  }, [pagos]);

  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      const data = await obtenerUltimosResumenesPagos();
      setHistorial(data);
    } catch (error) {
      console.log("Error al cargar historial de pagos:", error);
      Alert.alert("Error", "No se pudo cargar el historial de pagos.");
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, [])
  );

  const abrirModal = () => {
    setProveedor("");
    setMonto("");
    setOrigen("Caja");
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
  };

  const agregarPago = () => {
    const proveedorLimpio = proveedor.trim();
    const montoNormalizado = monto.replace(",", ".");
    const montoNumber = Number(montoNormalizado);

    if (!proveedorLimpio) {
      Alert.alert("Proveedor requerido", "Ingresá el nombre del proveedor.");
      return;
    }

    if (!montoNormalizado || Number.isNaN(montoNumber) || montoNumber <= 0) {
      Alert.alert(
        "Monto inválido",
        "Ingresá un monto válido. Por ejemplo: 20000"
      );
      return;
    }

    const nuevoPago = {
      id: Date.now().toString(),
      proveedor: proveedorLimpio,
      monto: montoNumber,
      origen,
    };

    setPagos((prevPagos) => [...prevPagos, nuevoPago]);
    cerrarModal();
  };

  const eliminarPago = (id) => {
    setPagos((prevPagos) => prevPagos.filter((pago) => pago.id !== id));
  };

  const limpiarPagos = () => {
    if (pagos.length === 0) return;

    Alert.alert("Limpiar pagos", "¿Querés borrar todos los pagos cargados?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => setPagos([]),
      },
    ]);
  };

  const enviarPagos = async () => {
    if (pagos.length === 0) {
      Alert.alert(
        "Sin pagos",
        "Cargá al menos un pago antes de enviar el resumen."
      );
      return;
    }

    try {
      setLoading(true);

      const mensaje = armarMensajePagos(pagos);
      const totales = calcularTotales(pagos);

      await crearResumenPagos({
        pagos,
        mensaje,
        totalGeneral: totales.totalGeneral,
        totalCaja: totales.totalCaja,
        totalAtras: totales.totalAtras,
        totalTransferencia: totales.totalTransferencia,
      });

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        mensaje
      )}`;

      const puedeAbrir = await Linking.canOpenURL(url);

      if (!puedeAbrir) {
        Alert.alert(
          "No se pudo abrir WhatsApp",
          "El resumen se guardó, pero no se pudo abrir WhatsApp en este dispositivo."
        );
        return;
      }

      await Linking.openURL(url);

      setPagos([]);
      cargarHistorial();
    } catch (error) {
      console.log("Error al enviar pagos:", error);
      Alert.alert("Error", "No se pudo guardar o enviar el resumen de pagos.");
    } finally {
      setLoading(false);
    }
  };

  const getOrigenColor = (itemOrigen) => {
    if (itemOrigen === "Caja") return theme.colors.primary;
    if (itemOrigen === "Atrás") return theme.colors.secondary;
    return "#3B82F6";
  };

  const getOrigenIcon = (itemOrigen) => {
    if (itemOrigen === "Caja") return "cash-register";
    if (itemOrigen === "Atrás") return "archive-outline";
    return "bank-transfer";
  };

  const getOrigenChipStyle = (itemOrigen) => {
    const baseColor = getOrigenColor(itemOrigen);

    return {
      backgroundColor: baseColor + "18",
      borderColor: baseColor + "35",
    };
  };

  const getOrigenChipTextStyle = (itemOrigen) => {
    const baseColor = getOrigenColor(itemOrigen);

    return {
      color: baseColor,
      fontWeight: "900",
    };
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
            refreshing={cargandoHistorial}
            onRefresh={cargarHistorial}
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
                name="truck-delivery"
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
              Pedidos
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
            Cargá pagos a proveedores y enviá el resumen por WhatsApp cuando
            termines.
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
                  name="cash-register"
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
                Caja
              </Text>

              <Text
                variant="titleLarge"
                style={[
                  styles.summaryNumber,
                  {
                    color: theme.colors.primary,
                  },
                ]}
              >
                ${formatearMonto(totalCaja)}
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
                  name="archive-outline"
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
                Atrás
              </Text>

              <Text
                variant="titleLarge"
                style={[
                  styles.summaryNumber,
                  {
                    color: theme.colors.secondary,
                  },
                ]}
              >
                ${formatearMonto(totalAtras)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card
          mode="contained"
          style={[
            styles.transferCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.transferContent}>
            <View
              style={[
                styles.transferIcon,
                {
                  backgroundColor: "#3B82F618",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="bank-transfer"
                size={24}
                color="#3B82F6"
              />
            </View>

            <View style={styles.transferText}>
              <Text
                variant="bodyMedium"
                style={[
                  styles.summaryLabel,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Transferencia
              </Text>

              <Text
                variant="titleLarge"
                style={[
                  styles.summaryNumber,
                  {
                    color: "#3B82F6",
                  },
                ]}
              >
                ${formatearMonto(totalTransferencia)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card
          mode="contained"
          style={[
            styles.mainCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.mainContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Pagos del día
                </Text>

                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {pagos.length} pagos cargados · Total: $
                  {formatearMonto(totalGeneral)}
                </Text>
              </View>

              <View
                style={[
                  styles.totalBadge,
                  {
                    backgroundColor: theme.colors.primary + "18",
                    borderColor: theme.colors.primary + "26",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.totalBadgeText,
                    {
                      color: theme.colors.primary,
                    },
                  ]}
                >
                  {pagos.length}
                </Text>
              </View>
            </View>

            <Button
              mode="contained"
              icon="plus"
              onPress={abrirModal}
              style={styles.addButton}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
            >
              Agregar pago
            </Button>

            {pagos.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    borderColor: theme.colors.outline + "45",
                    backgroundColor: theme.dark
                      ? theme.colors.background + "90"
                      : theme.colors.primary + "08",
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
                    name="cash-plus"
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
                  Todavía no cargaste pagos.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.paymentList,
                  {
                    backgroundColor: theme.dark
                      ? theme.colors.background + "90"
                      : theme.colors.primary + "07",
                    borderColor: theme.colors.outline + "45",
                  },
                ]}
              >
                {pagos.map((pago, index) => (
                  <View key={pago.id}>
                    <View style={styles.paymentItem}>
                      <View style={styles.paymentLeft}>
                        <View
                          style={[
                            styles.paymentIcon,
                            {
                              backgroundColor:
                                getOrigenColor(pago.origen) + "18",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={getOrigenIcon(pago.origen)}
                            size={22}
                            color={getOrigenColor(pago.origen)}
                          />
                        </View>

                        <View style={styles.paymentText}>
                          <Text
                            variant="titleMedium"
                            style={[
                              styles.paymentProvider,
                              {
                                color: theme.colors.onSurface,
                              },
                            ]}
                          >
                            {pago.proveedor}
                          </Text>

                          <View style={styles.paymentMeta}>
                            <Chip
                              compact
                              style={[
                                styles.origenChip,
                                getOrigenChipStyle(pago.origen),
                              ]}
                              textStyle={getOrigenChipTextStyle(pago.origen)}
                            >
                              {pago.origen}
                            </Chip>

                            <Text
                              variant="bodyMedium"
                              style={{
                                color: theme.colors.onSurfaceVariant,
                                fontWeight: "700",
                              }}
                            >
                              ${formatearMonto(pago.monto)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <IconButton
                        icon="delete-outline"
                        iconColor={theme.colors.error}
                        onPress={() => eliminarPago(pago.id)}
                      />
                    </View>

                    {index < pagos.length - 1 && (
                      <Divider
                        style={{
                          backgroundColor: theme.colors.outline + "30",
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}

            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: theme.colors.primary + "0F",
                  borderColor: theme.colors.primary + "22",
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={18}
                  color={theme.colors.primary}
                />

                <Text
                  variant="titleSmall"
                  style={[
                    styles.previewTitle,
                    {
                      color: theme.colors.primary,
                    },
                  ]}
                >
                  Vista previa del mensaje
                </Text>
              </View>

              <Text
                variant="bodyMedium"
                style={[
                  styles.previewText,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {mensajePreview}
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={limpiarPagos}
                disabled={pagos.length === 0 || loading}
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: theme.colors.outline + "80",
                  },
                ]}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
              >
                Limpiar
              </Button>

              <Button
                mode="contained"
                icon="whatsapp"
                onPress={enviarPagos}
                loading={loading}
                disabled={loading}
                style={styles.primaryButton}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
              >
                Enviar
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.historyHeader}>
          <Text
            variant="titleLarge"
            style={[
              styles.historyTitle,
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
            Últimos resúmenes enviados
          </Text>
        </View>

        {historial.length === 0 ? (
          <Card
            mode="contained"
            style={[
              styles.historyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + "55",
              },
            ]}
          >
            <Card.Content style={styles.historyEmptyContent}>
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor: theme.colors.primary + "14",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="receipt-text-clock-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>

              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                }}
              >
                Todavía no hay pagos guardados.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          historial.map((resumen) => (
            <Card
              key={resumen.id}
              mode="contained"
              style={[
                styles.historyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline + "55",
                },
              ]}
            >
              <Card.Content>
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyDateBox}>
                    <View
                      style={[
                        styles.historyIconBox,
                        {
                          backgroundColor: theme.colors.primary + "14",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="calendar-check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>

                    <Text
                      variant="titleSmall"
                      style={[
                        styles.historyDate,
                        {
                          color: theme.colors.onSurface,
                        },
                      ]}
                    >
                      {formatearFecha(resumen.fechaLocal)}
                    </Text>
                  </View>

                  <Chip
                    compact
                    style={{
                      backgroundColor: theme.colors.secondary + "18",
                    }}
                    textStyle={{
                      color: theme.colors.secondary,
                      fontWeight: "900",
                    }}
                  >
                    ${formatearMonto(resumen.totalGeneral)}
                  </Chip>
                </View>

                <View style={styles.historyTotals}>
                  <Chip
                    compact
                    style={[
                      styles.origenChip,
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
                    Caja ${formatearMonto(resumen.totalCaja)}
                  </Chip>

                  <Chip
                    compact
                    style={[
                      styles.origenChip,
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
                    Atrás ${formatearMonto(resumen.totalAtras)}
                  </Chip>

                  <Chip
                    compact
                    style={[
                      styles.origenChip,
                      {
                        backgroundColor: "#3B82F618",
                        borderColor: "#3B82F635",
                      },
                    ]}
                    textStyle={{
                      color: "#3B82F6",
                      fontWeight: "900",
                    }}
                  >
                    Transfer. ${formatearMonto(resumen.totalTransferencia || 0)}
                  </Chip>
                </View>

                <View style={styles.historyPayments}>
                  {(resumen.pagos || []).map((pago) => (
                    <View
                      key={`${resumen.id}-${pago.proveedor}-${pago.monto}-${pago.origen}`}
                      style={[
                        styles.historyPaymentRow,
                        {
                          backgroundColor: theme.dark
                            ? theme.colors.background + "90"
                            : theme.colors.primary + "07",
                          borderColor: theme.colors.outline + "45",
                        },
                      ]}
                    >
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.historyPaymentProvider,
                          {
                            color: theme.colors.onSurface,
                          },
                        ]}
                      >
                        {pago.proveedor}
                      </Text>

                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.historyPaymentAmount,
                          {
                            color: getOrigenColor(pago.origen),
                          },
                        ]}
                      >
                        ${formatearMonto(pago.monto)} · {pago.origen}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
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
              <View style={styles.modalTitleBox}>
                <View
                  style={[
                    styles.modalIcon,
                    {
                      backgroundColor: theme.colors.primary + "14",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cash-plus"
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
                    Nuevo pago
                  </Text>

                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Cargá proveedor, monto y origen del dinero.
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
              label="Proveedor"
              value={proveedor}
              onChangeText={setProveedor}
              mode="outlined"
              placeholder="Ej: Coca Cola"
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <TextInput
              label="Monto"
              value={monto}
              onChangeText={setMonto}
              keyboardType="numeric"
              mode="outlined"
              placeholder="Ej: 20000"
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <Text
              variant="titleSmall"
              style={[
                styles.origenTitle,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Origen del dinero
            </Text>

            <View style={styles.origenOptions}>
              {ORIGENES_DINERO.map((item) => {
                const selected = origen === item.value;
                const itemColor = getOrigenColor(item.value);

                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.85}
                    onPress={() => setOrigen(item.value)}
                    style={[
                      styles.origenOption,
                      {
                        backgroundColor: selected
                          ? itemColor + "20"
                          : theme.dark
                          ? theme.colors.background + "90"
                          : theme.colors.primary + "07",
                        borderColor: selected
                          ? itemColor + "70"
                          : theme.colors.outline + "45",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={
                        selected ? itemColor : theme.colors.onSurfaceVariant
                      }
                    />

                    <Text
                      style={[
                        styles.origenOptionText,
                        {
                          color: selected
                            ? itemColor
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                onPress={agregarPago}
                style={styles.modalButton}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.modalButtonContent}
              >
                Agregar
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
    letterSpacing: -0.4,
    marginTop: 5,
  },

  transferCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },
  transferContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
  },
  transferIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transferText: {
    flex: 1,
  },

  mainCard: {
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 28,
    overflow: "hidden",
  },
  mainContent: {
    paddingTop: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  totalBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  totalBadgeText: {
    fontSize: 16,
    fontWeight: "900",
  },
  addButton: {
    borderRadius: 17,
    marginBottom: 16,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontWeight: "900",
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

  paymentList: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 2,
  },
  paymentLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentText: {
    flex: 1,
  },
  paymentProvider: {
    fontWeight: "900",
    marginBottom: 6,
  },
  paymentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  origenChip: {
    borderWidth: 1,
    borderRadius: 999,
  },

  previewBox: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginTop: 18,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontWeight: "900",
  },
  previewText: {
    lineHeight: 21,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 17,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 17,
  },

  historyHeader: {
    marginBottom: 14,
  },
  historyTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  historyCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  historyEmptyContent: {
    alignItems: "center",
    paddingVertical: 22,
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  historyDateBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  historyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  historyDate: {
    flex: 1,
    fontWeight: "800",
    lineHeight: 19,
  },
  historyTotals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  historyPayments: {
    gap: 8,
  },
  historyPaymentRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  historyPaymentProvider: {
    fontWeight: "800",
    marginBottom: 3,
  },
  historyPaymentAmount: {
    fontWeight: "900",
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
  modalTitleBox: {
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
  origenTitle: {
    fontWeight: "900",
    marginBottom: 10,
  },
  origenOptions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  origenOption: {
    flex: 1,
    minHeight: 50,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    gap: 4,
  },
  origenOptionText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: -0.1,
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