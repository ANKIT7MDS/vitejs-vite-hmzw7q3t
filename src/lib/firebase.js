// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAYnKT4tMn-px0qIVgkQIreGwDjYAqqbrc",
  authDomain: "myphotoapp-7e93d.firebaseapp.com",
  projectId: "myphotoapp-7e93d",
  storageBucket: "myphotoapp-7e93d.appspot.com",
  messagingSenderId: "280025102931",
  appId: "1:280025102931:web:7469aaa9798b7112c6e4a6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
