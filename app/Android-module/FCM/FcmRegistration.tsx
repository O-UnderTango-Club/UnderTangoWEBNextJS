import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useEffect } from "react";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY!;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function storeFCMToken(token: string) {
    try {
        await setDoc(doc(db, "fcmTokens", token), {
            token,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
        });
        console.log("Token guardado en Firestore");
    } catch (e) {
        console.error("Error guardando token:", e);
    }
}

async function handleFCMRegistration() {
    if (!(await isSupported())) {
        console.warn("FCM no soportado.");
        return;
    }

    try {
        const messaging = getMessaging(app);

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Permiso denegado");
            return;
        }

        console.log("Permiso concedido");

        // 👉 Registrar SOLO firebase-messaging-sw.js
        const fcmRegistration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js", { type: "module" }
        );

        console.log("SW de Firebase registrado");

        // 👉 Obtener token usando ese service worker
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: fcmRegistration,
        });

        if (!token) {
            console.warn("Token no generado");
            return;
        }

        console.log("Token generado:", token);

        await storeFCMToken(token);
    } catch (error) {
        console.error("Error al registrar FCM:", error);
    }
}

export default function FcmRegistration() {
    useEffect(() => {
        handleFCMRegistration();
    }, []);

    return null;
}
