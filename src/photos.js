// src/lib/photos.js
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function savePhotoMeta({ collectionId, eventId, name, path, downloadURL, size, type }) {
  const db = getFirestore();
  const uid = getAuth().currentUser?.uid || "demo";

  const photosRef = collection(
    db,
    "photographers", uid,
    "collections", collectionId,
    "events", eventId,
    "photos"
  );

  await addDoc(photosRef, {
    name,
    path,
    url: downloadURL,
    size,
    type,
    createdAt: serverTimestamp()
  });
}
