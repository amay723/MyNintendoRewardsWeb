// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-messaging.js');

// Set Firebase configuration, once available
self.addEventListener('fetch', () => {
    const urlParams = new URLSearchParams(location.search);
    self.firebaseConfig = Object.fromEntries(urlParams);
});

const defaultConfig = {
    apiKey: true,
    projectId: true,
    messagingSenderId: true,
    appId: true,
    measurementId: true
}

firebase.initializeApp(self.firebaseConfig || defaultConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {

    const { title, body } = payload.notification

    const notificationOptions = {
      body,
      icon: '/logo512.png'
    };
  
    return self.registration.showNotification(title,
      notificationOptions);
});