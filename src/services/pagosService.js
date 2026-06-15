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
import { db } from "../firebase/firebase";

//JS:
const pagosRef = collection(db, "pagosProveedores");

export async function crearResumenPagos({
    pagos,
    mensaje,
    totalGeneral,
    totalCaja,
    totalAtras,
    totalTransferencia,
    }) {
    const docRef = await addDoc(pagosRef, {
        pagos,
        mensaje,
        totalGeneral,
        totalCaja,
        totalAtras,
        totalTransferencia,
        cantidadPagos: pagos.length,
        createdAt: serverTimestamp(),
        fechaLocal: new Date().toISOString(),
    });

    return docRef.id;
    }

    export async function obtenerUltimosResumenesPagos() {
    const q = query(pagosRef, orderBy("createdAt", "desc"), limit(20));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}