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
const pedidosRef = collection(db, "pedidosMercado");

export async function crearPedidoMercado({ productos, mensaje }) {
    const docRef = await addDoc(pedidosRef, {
        productos,
        mensaje,
        cantidadProductos: productos.length,
        createdAt: serverTimestamp(),
        fechaLocal: new Date().toISOString(),
    });

    return docRef.id;
    }

    export async function obtenerUltimosPedidosMercado() {
    const q = query(pedidosRef, orderBy("createdAt", "desc"), limit(10));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}