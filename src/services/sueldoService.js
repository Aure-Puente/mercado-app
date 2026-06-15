//Importaciones:
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase.js";

//JS:
const sueldoRef = "calculosSueldo";

export async function obtenerCalculoSueldo(mesKey) {
    const docRef = doc(db, sueldoRef, mesKey);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    };
    }

    export async function guardarCalculoSueldo({
    mesKey,
    mes,
    anio,
    valorHora,
    adelanto,
    mercaderia,
    mercaderiaConDescuento,
    horasMes,
    bruto,
    totalFinal,
    saldado,
    }) {
    const docRef = doc(db, sueldoRef, mesKey);

    await setDoc(
        docRef,
        {
        mesKey,
        mes,
        anio,
        valorHora,
        adelanto,
        mercaderia,
        mercaderiaConDescuento,
        horasMes,
        bruto,
        totalFinal,
        saldado,
        updatedAt: serverTimestamp(),
        },
        {
        merge: true,
        }
    );
}