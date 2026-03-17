import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAn6DQPxzAeWyqb_cTmOKIardt1wopXU0M",
  authDomain: "localguide-3d005.firebaseapp.com",
  projectId: "localguide-3d005",
  storageBucket: "localguide-3d005.firebasestorage.app",
  messagingSenderId: "402924882085",
  appId: "1:402924882085:web:6fcd2f8f0da0d7d713254c",
  measurementId: "G-D0WD9ZJZ10"
};

// 🔑 Prevent duplicate initialization
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(app);