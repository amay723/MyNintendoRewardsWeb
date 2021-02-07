import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/functions'
import 'firebase/messaging'
import 'firebase/analytics'

firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  projectId: process.env.REACT_APP_PROJECT_ID,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
});

if (process.env.NODE_ENV === "development")
    firebase.functions().useEmulator('localhost', 5001)

export const analytics = firebase.analytics();
export const firestore = firebase.firestore();
export const functions = firebase.functions();
export const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

export default firebase