<script>
  import { onMount } from 'svelte';
  import { auth } from '../lib/firebase.js';
  import { db } from '../lib/firebase.js';
  import {
    addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp
  } from 'firebase/firestore';
  import Uploader from './Uploader.svelte';

  let user = null;

  // UI state
  let displayName = '';
  let newCollectionName = '';
  let newEventName = '';

  // IDs जो Uploader को भेजेंगे
  let selectedCollectionId = '';
  let selectedEventId = '';

  // lists
  let collections = []; // [{id, name, ...}]
  let events = [];      // [{id, name, ...}]

  let unsubCollections = null;
  let unsubEvents = null;

  onMount(() => {
    const off = auth.onAuthStateChanged(u => {
      user = u;
      if (user) {
        startCollectionsWatcher(user.uid);
      } else {
        stopCollectionsWatcher();
        stopEventsWatcher();
      }
    });
    return () => {
      off && off();
      stopCollectionsWatcher();
      stopEventsWatcher();
    };
  });

  function startCollectionsWatcher(uid) {
    stopCollectionsWatcher();
    const ref = collection(db, `photographers/${uid}/collections`);
    const q = query(ref, orderBy('createdAt', 'desc'));
    unsubCollections = onSnapshot(q, snap => {
      collections = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // अगर selected collection गायब हो गया हो
      if (!collections.find(c => c.id === selectedCollectionId)) {
        selectedCollectionId = '';
        selectedEventId = '';
        events = [];
      }
    });
  }
  function stopCollectionsWatcher() {
    unsubCollections && unsubCollections();
    unsubCollections = null;
    collections = [];
  }

  function startEventsWatcher(uid, colId) {
    stopEventsWatcher();
    const ref = collection(db, `photographers/${uid}/collections/${colId}/events`);
    const q = query(ref, orderBy('createdAt', 'desc'));
    unsubEvents = onSnapshot(q, snap => {
      events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!events.find(e => e.id === selectedEventId)) {
        selectedEventId = '';
      }
    });
  }
  function stopEventsWatcher() {
    unsubEvents && unsubEvents();
    unsubEvents = null;
    events = [];
  }

  // selectedCollectionId बदले तो events watcher चलाएँ
  $: if (user && selectedCollectionId) {
    startEventsWatcher(user.uid, selectedCollectionId);
  }
  $: if (selectedCollectionId === '') {
    stopEventsWatcher();
    selectedEventId = '';
  }

  async function createCollection() {
    if (!user) return;
    if (!newCollectionName.trim()) return;
    await addDoc(collection(db, `photographers/${user.uid}/collections`), {
      name: newCollectionName.trim(),
      createdAt: serverTimestamp()
    });
    newCollectionName = '';
  }

  async function createEvent() {
    if (!user || !selectedCollectionId) return;
    if (!newEventName.trim()) return;
    await addDoc(
      collection(db, `photographers/${user.uid}/collections/${selectedCollectionId}/events`),
      {
        name: newEventName.trim(),
        createdAt: serverTimestamp()
      }
    );
    newEventName = '';
  }

  function logout() { auth.signOut(); }
</script>

<style>
  .section { margin: 16px 0; }
  .row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  select, input { padding:6px 8px; }
  button { padding:6px 10px; cursor:pointer; }
</style>

{#if !user}
  <h2>Please login</h2>
{:else}
  <h1>Dashboard</h1>

  <div class="section">
    <button on:click={logout}>Logout</button>
    <p>Logged in as: <strong>{user.phoneNumber || user.uid}</strong></p>
  </div>

  <!-- Create Collection -->
  <div class="section">
    <h3>Create Collection</h3>
    <div class="row">
      <input
        placeholder="Collection name (e.g., Sharma Wedding)"
        bind:value={newCollectionName} />
      <button on:click={createCollection}>Create Collection</button>
    </div>
  </div>

  <!-- Select Collection -->
  <div class="section">
    <div class="row">
      <label>Select Collection</label>
      <select bind:value={selectedCollectionId}>
        <option value="">-- choose collection --</option>
        {#each collections as c}
          <!-- value = सिर्फ ID -->
          <option value={c.id}>{c.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Create Event -->
  <div class="section">
    <h3>Create Event</h3>
    <div class="row">
      <input
        placeholder="Event name (e.g., Sangeet)"
        bind:value={newEventName}
        disabled={!selectedCollectionId} />
      <button on:click={createEvent} disabled={!selectedCollectionId}>Create Event</button>
    </div>
  </div>

  <!-- Select Event -->
  <div class="section">
    <div class="row">
      <label>Select Event</label>
      <select bind:value={selectedEventId} disabled={!selectedCollectionId}>
        <option value="">-- choose event --</option>
        {#each events as e}
          <!-- value = सिर्फ ID -->
          <option value={e.id}>{e.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Uploader needs IDs -->
  <div class="section">
    <h3>Upload Photos</h3>
    <Uploader
      {selectedCollectionId}
      {selectedEventId}
    />
  </div>
{/if}
