//Importaciones:
import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase.js";

//JS:
const horasRef = collection(db, "horasTrabajo");

export async function crearRegistroHoras({
    fecha,
    fechaLocal,
    diaNombre,
    mes,
    anio,
    horas,
    mercaderia,
    observacion,
    }) {
    const docRef = await addDoc(horasRef, {
        fecha,
        fechaLocal,
        diaNombre,
        mes,
        anio,
        horas,
        mercaderia,
        observacion: observacion || "",
        createdAt: serverTimestamp(),
    });

    return docRef.id;
    }

    export async function obtenerUltimosRegistrosHoras() {
    const q = query(horasRef, orderBy("fecha", "desc"), limit(180));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}