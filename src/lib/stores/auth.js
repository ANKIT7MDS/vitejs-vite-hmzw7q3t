// src/lib/stores/auth.js
import { writable } from 'svelte/store';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const currentUser = writable(null);
export const loadingAuth = writable(true);

onAuthStateChanged(auth, (user) => {
  currentUser.set(user);
  loadingAuth.set(false);
});

export async function logout() {
  await signOut(auth);
}
