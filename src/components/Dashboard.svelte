<script>
  import { currentUser, logout } from '../lib/stores/auth';
  import { get } from 'svelte/store';
  import { db } from '../lib/firebase';
  import {
    doc, setDoc, addDoc, collection, serverTimestamp,
    onSnapshot, query, orderBy
  } from 'firebase/firestore';
  import Uploader from './Uploader.svelte';

  let displayName = '';
  let collectionName = '';
  let eventName = '';

  // चयन
  let selectedCollectionId = '';
  let selectedEventId = '';

  // लिस्ट
  let collections = [];
  let events = [];
  let photos = [];

  // प्रोफाइल
  async function ensureUserProfile() {
    const user = get(currentUser);
    if (!user) return;
    const userDocRef = doc(db, 'photographers', user.uid);
    await setDoc(userDocRef, {
      phoneNumber: user.phoneNumber || null,
      displayName: displayName || null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    }, { merge: true });
    alert('Profile saved/updated!');
  }

  async function createCollection() {
    const user = get(currentUser);
    if (!user) return alert('Not logged in');
    if (!collectionName.trim()) return alert('Enter collection name');

    const colRef = collection(db, 'photographers', user.uid, 'collections');
    const docRef = await addDoc(colRef, {
      name: collectionName.trim(),
      createdAt: serverTimestamp()
    });
    selectedCollectionId = docRef.id;
    collectionName = '';
    alert(`Collection created: ${docRef.id}`);
  }

  async function createEvent() {
    const user = get(currentUser);
    if (!user) return alert('Not logged in');
    if (!selectedCollectionId) return alert('Select/Create a collection first');
    if (!eventName.trim()) return alert('Enter event name');

    const eventsRef = collection(db, 'photographers', user.uid, 'collections', selectedCollectionId, 'events');
    const docRef = await addDoc(eventsRef, {
      name: eventName.trim(),
      createdAt: serverTimestamp()
    });
    selectedEventId = docRef.id;
    eventName = '';
    alert(`Event created: ${docRef.id}`);
  }

  // live collections
  $: (() => {
    const user = get(currentUser);
    if (!user) return;
    const colRef = collection(db, 'photographers', user.uid, 'collections');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      collections = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
  })();

  // live events for selected collection
  $: (() => {
    const user = get(currentUser);
    if (!user || !selectedCollectionId) { events = []; return; }
    const evRef = collection(db, 'photographers', user.uid, 'collections', selectedCollectionId, 'events');
    const q = query(evRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
  })();

  // live photos for selected event
  $: (() => {
    const user = get(currentUser);
    if (!user || !selectedCollectionId || !selectedEventId) { photos = []; return; }
    const pRef = collection(db, 'photographers', user.uid, 'collections', selectedCollectionId, 'events', selectedEventId, 'photos');
    const q = query(pRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
  })();
</script>

<div class="p-6 max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold">Dashboard</h1>
    <button class="px-3 py-2 bg-gray-200 rounded" on:click={logout}>Logout</button>
  </div>

  <p class="mb-4 text-sm text-gray-700">
    Logged in as: <strong>{$currentUser?.phoneNumber || $currentUser?.uid}</strong>
  </p>

  <!-- Profile -->
  <div class="border rounded p-4 mb-6">
    <h2 class="text-xl font-semibold mb-2">Profile</h2>
    <div class="flex gap-2">
      <input class="border p-2 rounded flex-1" placeholder="Display Name (optional)" bind:value={displayName} />
      <button class="px-3 py-2 bg-blue-600 text-white rounded" on:click={ensureUserProfile}>Save/Update Profile</button>
    </div>
  </div>

  <!-- Create Collection -->
  <div class="border rounded p-4 mb-6">
    <h2 class="text-xl font-semibold mb-2">Create Collection</h2>
    <div class="flex gap-2 mb-3">
      <input class="border p-2 rounded flex-1" placeholder="Collection name (e.g., Sharma Wedding)" bind:value={collectionName} />
      <button class="px-3 py-2 bg-green-600 text-white rounded" on:click={createCollection}>Create Collection</button>
    </div>

    <!-- Collections list -->
    {#if collections.length}
      <div class="mb-2">
        <label class="block text-sm mb-1">Select Collection</label>
        <select class="border p-2 rounded w-full" bind:value={selectedCollectionId}>
          <option value="" disabled selected>Select…</option>
          {#each collections as c}
            <option value={c.id}>{c.name} ({c.id})</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <!-- Create Event -->
  <div class="border rounded p-4 mb-6">
    <h2 class="text-xl font-semibold mb-2">Create Event</h2>
    <div class="flex gap-2 mb-3">
      <input class="border p-2 rounded flex-1" placeholder="Event name (e.g., Sangeet)" bind:value={eventName} />
      <button class="px-3 py-2 bg-purple-600 text-white rounded" on:click={createEvent}>Create Event</button>
    </div>

    <!-- Events list -->
    {#if events.length}
      <div class="mb-2">
        <label class="block text-sm mb-1">Select Event</label>
        <select class="border p-2 rounded w-full" bind:value={selectedEventId}>
          <option value="" disabled selected>Select…</option>
          {#each events as e}
            <option value={e.id}>{e.name} ({e.id})</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <!-- Uploader -->
  {#if selectedCollectionId && selectedEventId}
    <div class="border rounded p-4 mb-6">
      <h2 class="text-xl font-semibold mb-3">Upload Photos</h2>
      <Uploader uid={$currentUser.uid} collectionId={selectedCollectionId} eventId={selectedEventId} />
    </div>

    <!-- Thumbnails (downloadURL) -->
    {#if photos.length}
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {#each photos as p}
          <a href={p.downloadURL} target="_blank" class="block border rounded overflow-hidden">
            <img src={p.downloadURL} alt={p.name} class="w-full h-40 object-cover" />
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</div>
