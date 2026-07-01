//Importaciones:
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
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
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import {
    crearCierreCaja,
    obtenerUltimosCierresCaja,
} from "../services/cajaService";

//JS:
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

    function padNumber(value) {
    return String(value).padStart(2, "0");
    }

    function getFechaInput(date) {
    const anio = date.getFullYear();
    const mes = padNumber(date.getMonth() + 1);
    const dia = padNumber(date.getDate());

    return `${anio}-${mes}-${dia}`;
    }

    function normalizarNumero(value) {
    const limpio = String(value || "").replace(/\./g, "").replace(",", ".");
    const number = Number(limpio);

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

    function getFechaDate(fecha) {
    return new Date(fecha + "T12:00:00");
    }

    function getDiaNombre(fecha) {
    const fechaDate = getFechaDate(fecha);
    return DIAS_SEMANA[fechaDate.getDay()];
    }

    function esFechaDomingo(fecha) {
    const fechaDate = getFechaDate(fecha);
    return fechaDate.getDay() === 0;
    }

    function formatearFechaVisible(fecha) {
    if (!fecha) return "Sin fecha";

    const fechaDate = getFechaDate(fecha);

    return fechaDate.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    }

    function limpiarLineasTexto(texto) {
    return String(texto || "")
        .split("\n")
        .map((linea) => linea.trim())
        .filter(Boolean);
    }

    function formatearPagos(texto) {
    const lineas = limpiarLineasTexto(texto);

    if (lineas.length === 0) {
        return "";
    }

    return lineas.join(", ");
    }

    function formatearAnotados(texto) {
    const lineas = limpiarLineasTexto(texto);

    if (lineas.length === 0) {
        return "";
    }

    return lineas.map((linea) => `   - ${linea}`).join("\n");
    }

    export default function CajaScreen() {
    const theme = useTheme();

    const [fecha, setFecha] = useState(getFechaInput(new Date()));
    const [idCaja, setIdCaja] = useState("");
    const [efectivo, setEfectivo] = useState("");
    const [cajaTarde, setCajaTarde] = useState("");
    const [cajaFinal, setCajaFinal] = useState("");
    const [anotados, setAnotados] = useState("");
    const [pagos, setPagos] = useState("");
    const [posnet, setPosnet] = useState("");
    const [mercadoPago, setMercadoPago] = useState("");

    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const esDomingo = useMemo(() => {
        return esFechaDomingo(fecha);
    }, [fecha]);

    const diaNombre = useMemo(() => {
        return getDiaNombre(fecha);
    }, [fecha]);

    const efectivoNumber = normalizarNumero(efectivo);
    const cajaTardeNumber = normalizarNumero(cajaTarde);
    const cajaFinalNumber = normalizarNumero(cajaFinal);
    const posnetNumber = normalizarNumero(posnet);
    const mercadoPagoNumber = normalizarNumero(mercadoPago);

    const mensajeCaja = useMemo(() => {
        const anotadosTexto = formatearAnotados(anotados);
        const pagosTexto = formatearPagos(pagos);

        let mensaje = `ID CAJA: ${idCaja || ""}\n`;
        mensaje += `EFECTIVO: ${formatearMonto(efectivoNumber)}\n`;
        mensaje += `CAJA TARDE: ${formatearMonto(cajaTardeNumber)}\n`;

        if (!esDomingo) {
        mensaje += `CAJA FINAL: ${formatearMonto(cajaFinalNumber)}\n`;
        }

        if (anotadosTexto) {
        mensaje += `ANOTADOS:\n${anotadosTexto}\n`;
        }

        if (pagosTexto) {
        mensaje += `PAGOS: ${pagosTexto}\n`;
        }

        mensaje += `POSNET: ${formatearMonto(posnetNumber)}\n`;
        mensaje += `MERCADO PAGO: ${formatearMonto(mercadoPagoNumber)}`;

        return mensaje;
    }, [
        idCaja,
        efectivoNumber,
        cajaTardeNumber,
        cajaFinalNumber,
        anotados,
        pagos,
        posnetNumber,
        mercadoPagoNumber,
        esDomingo,
    ]);

    const cargarHistorial = async () => {
        try {
        setCargando(true);
        const data = await obtenerUltimosCierresCaja();
        setHistorial(data);
        } catch (error) {
        console.log("Error al cargar cierres de caja:", error);
        Alert.alert("Error", "No se pudo cargar el historial de caja.");
        } finally {
        setCargando(false);
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

    const limpiarFormulario = () => {
        setIdCaja("");
        setEfectivo("");
        setCajaTarde("");
        setCajaFinal("");
        setAnotados("");
        setPagos("");
        setPosnet("");
        setMercadoPago("");
    };

    const validarFormulario = () => {
        if (!fecha) {
        Alert.alert("Fecha requerida", "Ingresá la fecha del cierre.");
        return false;
        }

        if (!idCaja.trim()) {
        Alert.alert("ID requerido", "Ingresá el ID de caja.");
        return false;
        }

        return true;
    };

    const enviarCaja = async () => {
        if (!validarFormulario()) return;

        try {
        setEnviando(true);

        const fechaDate = getFechaDate(fecha);

        await crearCierreCaja({
            fecha,
            fechaLocal: fechaDate.toISOString(),
            diaNombre,
            esDomingo,
            idCaja: idCaja.trim(),
            efectivo: efectivoNumber,
            cajaTarde: cajaTardeNumber,
            cajaFinal: esDomingo ? 0 : cajaFinalNumber,
            anotados: formatearAnotados(anotados),
            pagos: formatearPagos(pagos),
            posnet: posnetNumber,
            mercadoPago: mercadoPagoNumber,
            mensaje: mensajeCaja,
        });

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            mensajeCaja
        )}`;

        const puedeAbrir = await Linking.canOpenURL(url);

        if (!puedeAbrir) {
            Alert.alert(
            "Registro guardado",
            "El cierre se guardó, pero no se pudo abrir WhatsApp en este dispositivo."
            );
            limpiarFormulario();
            cargarHistorial();
            return;
        }

        await Linking.openURL(url);

        limpiarFormulario();
        cargarHistorial();
        } catch (error) {
        console.log("Error al enviar cierre de caja:", error);
        Alert.alert("Error", "No se pudo guardar o enviar el cierre de caja.");
        } finally {
        setEnviando(false);
        }
    };

    const totalInformado =
        efectivoNumber +
        cajaTardeNumber +
        (esDomingo ? 0 : cajaFinalNumber) +
        posnetNumber +
        mercadoPagoNumber;

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
            refreshControl={
            <RefreshControl
                refreshing={cargando}
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
                    name="cash-register"
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
                Caja
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
                Cargá el cierre de caja y envialo por WhatsApp.
            </Text>
            </View>

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
                <View style={styles.summaryHeader}>
                <View style={styles.summaryTextBox}>
                    <Text
                    variant="bodyMedium"
                    style={[
                        styles.summaryLabel,
                        {
                        color: theme.colors.onSurfaceVariant,
                        },
                    ]}
                    >
                    Total informado
                    </Text>

                    <Text
                    variant="headlineMedium"
                    style={[
                        styles.amount,
                        {
                        color: theme.colors.primary,
                        },
                    ]}
                    >
                    ${formatearMonto(totalInformado)}
                    </Text>
                </View>

                <View
                    style={[
                    styles.dayPill,
                    {
                        backgroundColor: esDomingo
                        ? theme.colors.secondary + "16"
                        : theme.colors.primary + "16",
                        borderColor: esDomingo
                        ? theme.colors.secondary + "32"
                        : theme.colors.primary + "32",
                    },
                    ]}
                >
                    <View
                    style={[
                        styles.dayIconBox,
                        {
                        backgroundColor: esDomingo
                            ? theme.colors.secondary + "18"
                            : theme.colors.primary + "18",
                        },
                    ]}
                    >
                    <MaterialCommunityIcons
                        name={esDomingo ? "weather-sunset" : "calendar-check"}
                        size={18}
                        color={
                        esDomingo ? theme.colors.secondary : theme.colors.primary
                        }
                    />
                    </View>

                    <View style={styles.dayTextBox}>
                    <Text
                        style={[
                        styles.dayName,
                        {
                            color: esDomingo
                            ? theme.colors.secondary
                            : theme.colors.primary,
                        },
                        ]}
                        numberOfLines={1}
                    >
                        {esDomingo ? "Domingo" : diaNombre}
                    </Text>

                    <Text
                        style={[
                        styles.dayDate,
                        {
                            color: theme.colors.onSurfaceVariant,
                        },
                        ]}
                        numberOfLines={1}
                    >
                        {formatearFechaVisible(fecha)}
                    </Text>
                    </View>
                </View>
                </View>

                <View
                style={[
                    styles.formatBox,
                    {
                    backgroundColor: theme.dark
                        ? theme.colors.background + "90"
                        : theme.colors.primary + "0C",
                    borderColor: theme.colors.primary + "18",
                    },
                ]}
                >
                <MaterialCommunityIcons
                    name="information-outline"
                    size={18}
                    color={theme.colors.primary}
                />

                <Text
                    variant="bodyMedium"
                    style={[
                    styles.formatText,
                    {
                        color: theme.colors.onSurfaceVariant,
                    },
                    ]}
                >
                    {esDomingo
                    ? "Formato domingo: sin caja final, pero podés cargar anotados y pagos si hace falta."
                    : "Formato día normal: incluye caja final, anotados y pagos si hay."}
                </Text>
                </View>
            </Card.Content>
            </Card>

            <Card
            mode="contained"
            style={[
                styles.formCard,
                {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + "55",
                },
            ]}
            >
            <Card.Content style={styles.formContent}>
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
                    Datos del cierre
                </Text>
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
                label="ID caja"
                value={idCaja}
                onChangeText={setIdCaja}
                keyboardType="numeric"
                mode="outlined"
                placeholder="Ej: 1024"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                />

                <View style={styles.grid}>
                <TextInput
                    label="Efectivo"
                    value={efectivo}
                    onChangeText={setEfectivo}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ej: 420000"
                    style={styles.gridInput}
                    outlineStyle={styles.inputOutline}
                />

                <TextInput
                    label="Caja tarde"
                    value={cajaTarde}
                    onChangeText={setCajaTarde}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ej: 30400"
                    style={styles.gridInput}
                    outlineStyle={styles.inputOutline}
                />
                </View>

                {!esDomingo && (
                <TextInput
                    label="Caja final"
                    value={cajaFinal}
                    onChangeText={setCajaFinal}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ej: 26700"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                />
                )}

                <View style={styles.grid}>
                <TextInput
                    label="Posnet"
                    value={posnet}
                    onChangeText={setPosnet}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ej: 221170"
                    style={styles.gridInput}
                    outlineStyle={styles.inputOutline}
                />

                <TextInput
                    label="Mercado Pago"
                    value={mercadoPago}
                    onChangeText={setMercadoPago}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ej: 655530"
                    style={styles.gridInput}
                    outlineStyle={styles.inputOutline}
                />
                </View>

                <TextInput
                label="Anotados"
                value={anotados}
                onChangeText={setAnotados}
                mode="outlined"
                multiline
                placeholder={"Ej:\naure: 26300\njose: 9900"}
                style={styles.textArea}
                outlineStyle={styles.inputOutline}
                />

                <TextInput
                label="Pagos"
                value={pagos}
                onChangeText={setPagos}
                mode="outlined"
                multiline
                placeholder={"Ej:\n40000 tortitas (caja)\n141000 tony (caja)"}
                style={styles.textArea}
                outlineStyle={styles.inputOutline}
                />

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
                    Vista previa
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
                    {mensajeCaja}
                </Text>
                </View>

                <View style={styles.actions}>
                <Button
                    mode="outlined"
                    onPress={limpiarFormulario}
                    disabled={enviando}
                    style={[
                    styles.actionButton,
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
                    onPress={enviarCaja}
                    loading={enviando}
                    disabled={enviando}
                    style={styles.actionButton}
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                >
                    Enviar
                </Button>
                </View>
            </Card.Content>
            </Card>

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
            <Card.Content style={styles.historyContent}>
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
                    name="history"
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
                    Historial
                    </Text>

                    <Text
                    variant="bodyMedium"
                    style={{
                        color: theme.colors.onSurfaceVariant,
                    }}
                    >
                    Últimos cierres guardados.
                    </Text>
                </View>
                </View>

                {historial.length === 0 ? (
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
                        name="cash-clock"
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
                    Todavía no hay cierres guardados.
                    </Text>
                </View>
                ) : (
                historial.map((item) => (
                    <View
                    key={item.id}
                    style={[
                        styles.historyItem,
                        {
                        backgroundColor: theme.dark
                            ? theme.colors.background + "90"
                            : theme.colors.primary + "07",
                        borderColor: theme.colors.outline + "45",
                        },
                    ]}
                    >
                    <View style={styles.historyTop}>
                        <View style={styles.historyText}>
                        <Text
                            variant="titleSmall"
                            style={[
                            styles.historyTitle,
                            {
                                color: theme.colors.onSurface,
                            },
                            ]}
                        >
                            Caja #{item.idCaja} · {item.diaNombre}
                        </Text>

                        <Text
                            variant="bodySmall"
                            style={{
                            color: theme.colors.onSurfaceVariant,
                            }}
                        >
                            {formatearFechaVisible(item.fecha)}
                        </Text>
                        </View>

                        <Chip
                        compact
                        style={[
                            styles.historyStatusChip,
                            {
                            backgroundColor: item.esDomingo
                                ? theme.colors.secondary + "18"
                                : theme.colors.primary + "18",
                            },
                        ]}
                        textStyle={{
                            color: item.esDomingo
                            ? theme.colors.secondary
                            : theme.colors.primary,
                            fontWeight: "900",
                        }}
                        >
                        {item.esDomingo ? "Domingo" : "Normal"}
                        </Chip>
                    </View>

                    <Divider
                        style={[
                        styles.historyDivider,
                        {
                            backgroundColor: theme.colors.outline + "30",
                        },
                        ]}
                    />

                    <View
                        style={[
                        styles.sentMessageBox,
                        {
                            backgroundColor: theme.dark
                            ? theme.colors.surface + "65"
                            : "#ffffff99",
                            borderColor: theme.colors.outline + "45",
                        },
                        ]}
                    >
                        <View style={styles.sentMessageHeader}>
                        <MaterialCommunityIcons
                            name="message-text-outline"
                            size={18}
                            color={theme.colors.primary}
                        />

                        <Text
                            variant="titleSmall"
                            style={[
                            styles.sentMessageTitle,
                            {
                                color: theme.colors.primary,
                            },
                            ]}
                        >
                            Información enviada
                        </Text>
                        </View>

                        <Text
                        variant="bodyMedium"
                        style={[
                            styles.sentMessageText,
                            {
                            color: theme.colors.onSurfaceVariant,
                            },
                        ]}
                        >
                        {item.mensaje || "Sin mensaje guardado"}
                        </Text>
                    </View>
                    </View>
                ))
                )}
            </Card.Content>
            </Card>
        </ScrollView>
        </KeyboardAvoidingView>
    );
    }

    //Estilos:
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
        maxWidth: 340,
    },

    summaryCard: {
        borderRadius: 28,
        borderWidth: 1,
        marginBottom: 18,
        overflow: "hidden",
    },
    summaryContent: {
        paddingTop: 20,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        marginBottom: 14,
    },
    summaryTextBox: {
        flex: 1,
    },
    summaryLabel: {
        fontWeight: "700",
        marginBottom: 6,
    },
    amount: {
        fontWeight: "900",
        letterSpacing: -0.8,
    },
    dayPill: {
        width: 126,
        minHeight: 64,
        borderRadius: 20,
        borderWidth: 1,
        padding: 9,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dayIconBox: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    dayTextBox: {
        flex: 1,
    },
    dayName: {
        fontSize: 14,
        fontWeight: "900",
        letterSpacing: -0.2,
    },
    dayDate: {
        fontSize: 11,
        fontWeight: "700",
        marginTop: 2,
    },
    formatBox: {
        borderWidth: 1,
        borderRadius: 18,
        paddingVertical: 11,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
    },
    formatText: {
        flex: 1,
        lineHeight: 20,
        fontWeight: "600",
    },

    formCard: {
        borderRadius: 28,
        borderWidth: 1,
        marginBottom: 18,
        overflow: "hidden",
    },
    formContent: {
        paddingTop: 20,
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
    },
    cardTitle: {
        fontWeight: "900",
        letterSpacing: -0.3,
    },

    input: {
        marginBottom: 14,
    },
    inputOutline: {
        borderRadius: 16,
    },
    grid: {
        flexDirection: "row",
        gap: 12,
    },
    gridInput: {
        flex: 1,
        marginBottom: 14,
    },
    textArea: {
        marginBottom: 14,
        minHeight: 94,
    },

    previewBox: {
        borderRadius: 22,
        borderWidth: 1,
        padding: 16,
        marginTop: 2,
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
        lineHeight: 22,
    },

    actions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 18,
    },
    actionButton: {
        flex: 1,
        borderRadius: 17,
    },
    buttonContent: {
        height: 50,
    },
    buttonLabel: {
        fontWeight: "900",
    },

    historyCard: {
        borderRadius: 28,
        borderWidth: 1,
        overflow: "hidden",
    },
    historyContent: {
        paddingTop: 20,
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
    historyItem: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 13,
        marginBottom: 12,
    },
    historyTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
    },
    historyText: {
        flex: 1,
    },
    historyTitle: {
        fontWeight: "900",
        marginBottom: 3,
    },
    historyStatusChip: {
        borderRadius: 999,
    },
    historyDivider: {
        marginVertical: 11,
    },
    sentMessageBox: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
    },
    sentMessageHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    sentMessageTitle: {
        fontWeight: "900",
    },
    sentMessageText: {
        lineHeight: 22,
    },
});