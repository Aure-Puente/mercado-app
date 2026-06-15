//Importaciones:
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  crearPedidoMercado,
  obtenerUltimosPedidosMercado,
} from "../services/mercadoService";

const WHATSAPP_NUMBER = "5492234977176";

const CATEGORIAS_MERCADO = [
  {
    id: "citricos",
    titulo: "Cítricos",
    icono: "fruit-citrus",
    productos: [
      "Naranja",
      "Naranja ombligo",
      "Pomelo",
      "Limón",
      "Mandarina",
      "Mandarina dancy",
      "Mandarina criolla",
      "Mandarina elendale",
      "Mandarina nova",
    ],
  },
  {
    id: "bananas",
    titulo: "Bananas",
    icono: "fruit-cherries",
    productos: ["Banana Ecuador", "Banana Brasil"],
  },
  {
    id: "frutas",
    titulo: "Frutas",
    icono: "food-apple",
    productos: [
      "Kiwi",
      "Manzana verde",
      "Manzana roja buena",
      "Manzana roja económica",
      "Pera",
      "Uva rosada",
      "Uva blanca",
      "Uva verde",
      "Palta",
    ],
  },
  {
    id: "verduras",
    titulo: "Verduras",
    icono: "carrot",
    productos: [
      "Choclo",
      "Pepino",
      "Zapallito",
      "Zucchini",
      "Berenjena",
      "Tomate",
      "Tomate perita",
      "Cherry",
      "Morrón rojo",
      "Morrón verde",
      "Batata",
      "Zanahoria",
      "Papa blanca",
      "Papa negra",
      "Cebolla",
      "Cebolla morada",
      "Anco",
      "Remolacha",
      "Brócoli",
      "Ajo",
      "Jengibre",
      "Repollo",
    ],
  },
  {
    id: "hojas",
    titulo: "Hojas y aromáticas",
    icono: "leaf",
    productos: [
      "Lechuga repollada",
      "Lechuga manteca",
      "Lechuga crespa",
      "Perejil",
      "Verdeo",
      "Puerro",
      "Albahaca",
      "Apio",
      "Rúcula",
      "Espinaca",
      "Acelga",
    ],
  },
  {
    id: "bandejas",
    titulo: "Bandejas",
    icono: "package-variant-closed",
    productos: ["Bandeja de sopa", "Bandeja de ensalada", "Bandeja de wok"],
  },
];

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function obtenerTodosLosProductos() {
  return CATEGORIAS_MERCADO.flatMap((categoria) => categoria.productos);
}

function agruparProductosPorCategoria(productos) {
  return CATEGORIAS_MERCADO.map((categoria) => {
    const productosCategoria = productos.filter((producto) =>
      categoria.productos.includes(producto)
    );

    return {
      titulo: categoria.titulo,
      productos: productosCategoria,
    };
  }).filter((categoria) => categoria.productos.length > 0);
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

function armarMensajePedido(productos) {
  const productosAgrupados = agruparProductosPorCategoria(productos);

  const listaProductos = productosAgrupados
    .map((categoria) => {
      const productosTexto = categoria.productos
        .map((producto) => `• ${producto}`)
        .join("\n");

      return `*${categoria.titulo}:*\n${productosTexto}`;
    })
    .join("\n\n");

  return `Hola, el pedido del mercado para mañana es:\n\n${listaProductos}\n\nMuchas gracias.`;
}

export default function MercadoScreen() {
  const theme = useTheme();

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [expandedCategorias, setExpandedCategorias] = useState({
    citricos: false,
  });

  const totalSeleccionados = productosSeleccionados.length;
  const totalProductos = obtenerTodosLosProductos().length;

  const mensajePreview = useMemo(() => {
    if (productosSeleccionados.length === 0) {
      return "Todavía no seleccionaste productos.";
    }

    return armarMensajePedido(productosSeleccionados);
  }, [productosSeleccionados]);

  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      const pedidos = await obtenerUltimosPedidosMercado();
      setHistorial(pedidos);
    } catch (error) {
      console.log("Error al cargar historial:", error);
      Alert.alert("Error", "No se pudo cargar el historial de pedidos.");
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

  const toggleCategoria = (categoriaId) => {
    setExpandedCategorias((prev) => ({
      ...prev,
      [categoriaId]: !prev[categoriaId],
    }));
  };

  const toggleProducto = (producto) => {
    setProductosSeleccionados((prevProductos) => {
      const yaExiste = prevProductos.includes(producto);

      if (yaExiste) {
        return prevProductos.filter((item) => item !== producto);
      }

      return [...prevProductos, producto];
    });
  };

  const limpiarSeleccion = () => {
    setProductosSeleccionados([]);
  };

  const enviarPedido = async () => {
    if (productosSeleccionados.length === 0) {
      Alert.alert(
        "Pedido vacío",
        "Seleccioná al menos un producto para enviar el pedido."
      );
      return;
    }

    try {
      setLoading(true);

      const mensaje = armarMensajePedido(productosSeleccionados);

      await crearPedidoMercado({
        productos: productosSeleccionados,
        mensaje,
      });

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        mensaje
      )}`;

      const puedeAbrir = await Linking.canOpenURL(url);

      if (!puedeAbrir) {
        Alert.alert(
          "No se pudo abrir WhatsApp",
          "El pedido se guardó, pero no se pudo abrir WhatsApp en este dispositivo."
        );
        return;
      }

      await Linking.openURL(url);

      limpiarSeleccion();
      cargarHistorial();
    } catch (error) {
      console.log("Error al enviar pedido:", error);
      Alert.alert("Error", "No se pudo guardar o enviar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const getHistoryChipStyle = () => ({
    backgroundColor: theme.dark
      ? theme.colors.primary + "20"
      : theme.colors.primary + "12",
    borderColor: theme.dark
      ? theme.colors.primary + "38"
      : theme.colors.primary + "22",
  });

  const getHistoryChipTextStyle = () => ({
    color: theme.dark ? "#DCFCE7" : theme.colors.primary,
    fontWeight: "800",
  });

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
          refreshing={cargandoHistorial}
          onRefresh={cargarHistorial}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
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
                name="food-apple"
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
              Mercado
            </Text>
          </View>
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
          Seleccioná frutas y verduras para armar el pedido y enviarlo por
          WhatsApp.
        </Text>
      </View>

      <Card
        mode="contained"
        style={[
          styles.card,
          {
            backgroundColor: theme.dark
              ? theme.colors.surface
              : theme.colors.surface,
            borderColor: theme.dark
              ? theme.colors.outline + "70"
              : theme.colors.outline + "55",
          },
        ]}
      >
        <Card.Content style={styles.cardContent}>
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
                Pedido de mañana
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.cardSubtitle,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {totalSeleccionados} seleccionados de {totalProductos}{" "}
                productos.
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
                {totalSeleccionados}
              </Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            {CATEGORIAS_MERCADO.map((categoria) => {
              const cantidadSeleccionada = categoria.productos.filter(
                (producto) => productosSeleccionados.includes(producto)
              ).length;

              const estaExpandida = !!expandedCategorias[categoria.id];

              return (
                <View
                  key={categoria.id}
                  style={[
                    styles.categoryWrapper,
                    {
                      backgroundColor: theme.dark
                        ? theme.colors.background + "88"
                        : theme.colors.background,
                      borderColor: estaExpandida
                        ? theme.colors.primary + "35"
                        : theme.colors.outline + "45",
                    },
                  ]}
                >
                  <List.Accordion
                    title={categoria.titulo}
                    description={`${cantidadSeleccionada} seleccionados`}
                    expanded={estaExpandida}
                    onPress={() => toggleCategoria(categoria.id)}
                    style={styles.accordion}
                    titleStyle={[
                      styles.accordionTitle,
                      {
                        color: theme.colors.onSurface,
                      },
                    ]}
                    descriptionStyle={[
                      styles.accordionDescription,
                      {
                        color: theme.colors.onSurfaceVariant,
                      },
                    ]}
                    left={() => (
                      <View
                        style={[
                          styles.accordionIcon,
                          {
                            backgroundColor: cantidadSeleccionada
                              ? theme.colors.primary + "22"
                              : theme.colors.onSurfaceVariant + "12",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={categoria.icono}
                          size={21}
                          color={
                            cantidadSeleccionada
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                      </View>
                    )}
                  >
                    <View
                      style={[
                        styles.productsBox,
                        {
                          backgroundColor: theme.dark
                            ? theme.colors.surface
                            : "#FFFFFF10",
                          borderColor: theme.colors.outline + "35",
                        },
                      ]}
                    >
                      {categoria.productos.map((producto, index) => {
                        const checked =
                          productosSeleccionados.includes(producto);

                        return (
                          <View key={producto}>
                            <Checkbox.Item
                              label={producto}
                              status={checked ? "checked" : "unchecked"}
                              onPress={() => toggleProducto(producto)}
                              mode="android"
                              position="leading"
                              labelStyle={[
                                styles.checkboxLabel,
                                {
                                  color: checked
                                    ? theme.colors.onSurface
                                    : theme.colors.onSurfaceVariant,
                                },
                              ]}
                              color={theme.colors.primary}
                              uncheckedColor={theme.colors.onSurfaceVariant}
                              style={[
                                styles.checkboxItem,
                                checked && {
                                  backgroundColor:
                                    theme.colors.primary + "10",
                                },
                              ]}
                            />

                            {index < categoria.productos.length - 1 && (
                              <Divider
                                style={{
                                  backgroundColor:
                                    theme.colors.outline + "30",
                                }}
                              />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </List.Accordion>
                </View>
              );
            })}
          </View>

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
              onPress={limpiarSeleccion}
              disabled={productosSeleccionados.length === 0 || loading}
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
              onPress={enviarPedido}
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
          Últimos pedidos enviados
        </Text>
      </View>

      {historial.length === 0 ? (
        <Card
          mode="contained"
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline + "55",
            },
          ]}
        >
          <Card.Content style={styles.emptyContent}>
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: theme.colors.primary + "14",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="basket-outline"
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
              Todavía no hay pedidos guardados.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        historial.map((pedido) => {
          const productosPedido = pedido.productos || [];
          const productosAgrupados =
            agruparProductosPorCategoria(productosPedido);

          return (
            <Card
              key={pedido.id}
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
                      {formatearFecha(pedido.fechaLocal)}
                    </Text>
                  </View>

                  <Chip
                    compact
                    style={[
                      styles.countChip,
                      {
                        backgroundColor: theme.colors.secondary + "18",
                      },
                    ]}
                    textStyle={{
                      color: theme.colors.secondary,
                      fontWeight: "900",
                    }}
                  >
                    {pedido.cantidadProductos || productosPedido.length || 0}
                  </Chip>
                </View>

                {productosAgrupados.map((categoria) => (
                  <View
                    key={`${pedido.id}-${categoria.titulo}`}
                    style={styles.historyCategory}
                  >
                    <Text
                      variant="titleSmall"
                      style={[
                        styles.historyCategoryTitle,
                        {
                          color: theme.colors.primary,
                        },
                      ]}
                    >
                      {categoria.titulo}
                    </Text>

                    <View style={styles.historyProducts}>
                      {categoria.productos.map((producto) => (
                        <Chip
                          key={`${pedido.id}-${producto}`}
                          compact
                          style={[styles.productChip, getHistoryChipStyle()]}
                          textStyle={getHistoryChipTextStyle()}
                        >
                          {producto}
                        </Chip>
                      ))}
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
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
  headerTop: {
    marginBottom: 10,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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

  card: {
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 28,
    overflow: "hidden",
  },
  cardContent: {
    paddingTop: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 18,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardSubtitle: {
    lineHeight: 20,
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

  categoriesContainer: {
    gap: 12,
  },
  categoryWrapper: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  accordion: {
    paddingVertical: 1,
  },
  accordionTitle: {
    fontWeight: "900",
    fontSize: 16,
  },
  accordionDescription: {
    fontSize: 13,
    fontWeight: "600",
  },
  accordionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginRight: 2,
  },
  productsBox: {
    borderTopWidth: 1,
    overflow: "hidden",
  },
  checkboxItem: {
    paddingVertical: 2,
    paddingRight: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.1,
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
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontWeight: "900",
  },

  historyHeader: {
    marginBottom: 14,
  },
  historyTitle: {
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 10,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  historyCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
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
  countChip: {
    borderRadius: 999,
  },
  historyCategory: {
    marginTop: 10,
  },
  historyCategoryTitle: {
    fontWeight: "900",
    marginBottom: 8,
  },
  historyProducts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  productChip: {
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 999,
  },
});