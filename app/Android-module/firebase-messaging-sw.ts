/// <reference lib="webworker" />

export {}; // Necesario para que TypeScript trate el archivo como módulo

const sw = self as unknown as ServiceWorkerGlobalScope;

// -------------------------
// CLICK DE NOTIFICACIÓN
// -------------------------
sw.addEventListener("notificationclick", (event: NotificationEvent) => {
    event.notification.close();

    const urlToOpen: string =
        (event.notification.data && (event.notification.data as any).url) || "/";

    event.waitUntil(
        sw.clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                if ("url" in client && client.url.includes(urlToOpen) && "focus" in client) {
                    return client.focus();
                }
            }

            if (sw.clients.openWindow) {
                return sw.clients.openWindow(urlToOpen);
            }
        })
    );
});

// -------------------------
// RECEPCIÓN DE PUSH
// -------------------------
sw.addEventListener("push", (event: PushEvent) => {
    console.log("[SW] Push recibido");

    if (!event.data) {
        console.warn("[SW] Push sin payload");
        return;
    }

    let payload: any = {};

    try {
        payload = event.data.json();
    } catch {
        payload = {
            notification: {
                title: "Mensaje",
                body: event.data.text(),
            },
        };
    }

    const notification = payload.notification || payload.data || {};
    const title = notification.title || "Nueva notificación";
    const body = notification.body || "Tienes una alerta nueva";

    const options: NotificationOptions = {
        body,
        icon: "/assets/images/icon-512x512.png",
        data: payload.data || {},
    };

    event.waitUntil(sw.registration.showNotification(title, options));
});
