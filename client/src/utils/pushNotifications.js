import api from '../services/api';

// Utility helper to convert the URL-safe Base64 VAPID public key into Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Service Worker if supported.
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  } else {
    console.warn('Push messaging is not supported in this browser.');
  }
  return null;
};

/**
 * Prompts user for permission and registers push subscription.
 */
export const subscribeUserToPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push messaging is not supported in this browser.');
  }

  // 1. Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted.');
  }

  // 2. Get active service worker registration or create one
  let registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    registration = await registerServiceWorker();
  }

  if (!registration) {
    throw new Error('Service Worker registration could not be established.');
  }

  // 3. Fetch VAPID public key from backend
  const res = await api.get('/notifications/vapid-public-key');
  const vapidPublicKey = res.data.publicKey;
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // 4. Create the push subscription
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  // 5. Send subscription parameters to our backend database
  await api.post('/notifications/subscribe', { subscription });
  console.log('Successfully registered Push Subscription with backend.');
  return subscription;
};

/**
 * Unsubscribes the current device.
 */
export const unsubscribeUserFromPush = async () => {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  // Unsubscribe from browser push service
  await subscription.unsubscribe();

  // Tell backend to remove it from DB
  await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
  console.log('Successfully unregistered Push Subscription.');
};

/**
 * Utility to query current browser support, permission status, and subscription state
 */
export const getPushSubscriptionState = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { supported: false, subscribed: false, permission: 'default' };
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    return { supported: true, subscribed: false, permission };
  }

  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    return { supported: true, subscribed: false, permission };
  }

  const subscription = await registration.pushManager.getSubscription();
  return {
    supported: true,
    subscribed: !!subscription,
    permission,
    subscription,
  };
};
