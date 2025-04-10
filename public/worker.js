self.addEventListener("push", event => {
    let data;
    try {
        data = JSON.parse(event.data.text());
    } catch (error) {
        console.error("Error parsing push notification data:", error);
        data = {
            title: "New Notification",
            message: "Unable to display notification content",
        };
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.message,
            icon: "/icons/icon-192x192.png",
        })
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow("/");
        })
    );
});
