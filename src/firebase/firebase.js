//Firebase:
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC9oRoVHzrhFWA32prA8NQXfL63lvvkrpw",
    authDomain: "mercado-app-dcccd.firebaseapp.com",
    projectId: "mercado-app-dcccd",
    storageBucket: "mercado-app-dcccd.firebasestorage.app",
    messagingSenderId: "1040734705857",
    appId: "1:1040734705857:web:c0b1fe8347262c2b339c40"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);