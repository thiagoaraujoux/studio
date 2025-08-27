
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "vitalize-companion",
  "appId": "1:1055635334907:web:e891cf3c8cd98cedc9725e",
  "storageBucket": "vitalize-companion.firebasestorage.app",
  "apiKey": "AIzaSyBKMQyszHdwTrCC0v4YXCFisSY9CcaU5Xg",
  "authDomain": "vitalize-companion.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1055635334907"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
