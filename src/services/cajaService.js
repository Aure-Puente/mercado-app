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
const cajaRef = collection(db, "cierresCaja");

export async function crearCierreCaja({
    fecha,
    fechaLocal,
    diaNombre,
    esDomingo,
    idCaja,
    efectivo,
    cajaTarde,
    cajaFinal,
    pagos,
    anotados,
    posnet,
    mercadoPago,
    mensaje,
    }) {
    const docRef = await addDoc(cajaRef, {
        fecha,
        fechaLocal,
        diaNombre,
        esDomingo,
        idCaja,
        efectivo,
        cajaTarde,
        cajaFinal,
        pagos,
        anotados,
        posnet,
        mercadoPago,
        mensaje,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}

export async function obtenerUltimosCierresCaja() {
    const q = query(cajaRef, orderBy("fecha", "desc"), limit(30));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}