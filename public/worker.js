// 이 파일은 next-pwa에 의해 자동으로 생성된 서비스 워커를 보완합니다.
// next-pwa가 이미 대부분의 서비스 워커 기능을 처리하므로 이 파일은 선택적입니다.
// 필요한 경우 여기에 추가적인 서비스 워커 로직을 작성할 수 있습니다.

self.addEventListener('push', (event) => {
  const data = JSON.parse(event.data.text());
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/icons/icon-192x192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
}); 