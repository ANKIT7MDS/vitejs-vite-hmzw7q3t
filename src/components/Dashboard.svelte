<script>
  import { onMount } from "svelte";
  // app init सुनिश्चित रहे
  import "../lib/firebase.js";

  // Firebase Auth / Firestore
  import { getAuth } from "firebase/auth";
  import {
    getFirestore, collection, addDoc, onSnapshot,
    orderBy, query, serverTimestamp
  } from "firebase/firestore";

  // Components
  import Uploader from "./Uploader.svelte";
  import Gallery from "./Gallery.svelte";

  // State
  let user = null;

  // IDs जो Uploader/Gallery को चाहिए
  let selectedCollectionId = "";
  let selectedEventId = "";

  // lists
  let collections = []; // [{id, name, createdAt}]
  let events = [];      // [{id, name, createdAt}]

  // create inputs
  let newCollectionName = "";
  let newEventName = "";

  // Firestore helpers
  const auth = getAuth();
  const db = getFirestore();

  let unsubCollections = null;
  let unsubEvents = null;

  onMount(() => {
    // auth watcher
    const off = auth.onAuthStateChanged((u) => {
      user = u;
      if (user) {
        // start collections watcher
        startCollectionsWatcher(user.uid);
      } else {
        // reset all
        stopCollectionsWatcher();
        stopEventsWatcher();
        selectedCollectionId = "";
        selectedEventId = "";
        collections = [];
        events = [];
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
    const q = query(ref, orderBy("createdAt", "desc"));
    unsubCollections = onSnapshot(q, (snap) => {
      collections = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // अगर चुना हुआ collection हट चुका हो
      if (selectedCollectionId && !collections.find((c) => c.id === selectedCollectionId)) {
        selectedCollectionId = "";
        selectedEventId = "";
        events = [];
      }
    });
  }
  function stopCollectionsWatcher() {
    if (unsubCollections) unsubCollections();
    unsubCollections = null;
  }

  function startEventsWatcher(uid, colId) {
    stopEventsWatcher();
    const ref = collection(db, `photographers/${uid}/collections/${colId}/events`);
    const q = query(ref, orderBy("createdAt", "desc"));
    unsubEvents = onSnapshot(q, (snap) => {
      events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (selectedEventId && !events.find((e) => e.id === selectedEventId)) {
        selectedEventId = "";
      }
    });
  }
  function stopEventsWatcher() {
    if (unsubEvents) unsubEvents();
    unsubEvents = null;
    events = [];
  }

  // reactive: collection बदलते ही events watcher चलाएँ/रोकें
  $: if (user && selectedCollectionId) {
    startEventsWatcher(user.uid, selectedCollectionId);
  }
  $: if (!selectedCollectionId) {
    stopEventsWatcher();
    selectedEventId = "";
  }

  async function createCollection() {
    if (!user) { alert("Login required"); return; }
    const name = newCollectionName.trim();
    if (!name) return;
    await addDoc(collection(db, `photographers/${user.uid}/collections`), {
      name,
      createdAt: serverTimestamp(),
    });
    newCollectionName = "";
  }

  async function createEvent() {
    if (!user) { alert("Login required"); return; }
    if (!selectedCollectionId) { alert("पहले Collection चुनें"); return; }
    const name = newEventName.trim();
    if (!name) return;
    await addDoc(
      collection(db, `photographers/${user.uid}/collections/${selectedCollectionId}/events`),
      { name, createdAt: serverTimestamp() }
    );
    newEventName = "";
  }

  function logout() { auth.signOut(); }
</script>

<style>
  .wrap { max-width: 980px; margin: 24px auto; padding: 12px; }
  .topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
  .muted { color:#666; font-size:13px; }
  .row { display:grid; grid-template-columns: 180px 1fr auto; gap:12px; align-items:center; margin-bottom:12px; }
  .row-2 { display:grid; grid-template-columns: 180px 1fr; gap:12px; align-items:center; margin-bottom:12px; }
  input, select { padding:8px 10px; border:1px solid #dcdcdc; border-radius:8px; }
  button { padding:8px 12px; border:1px solid #ddd; background:#111; color:#fff; border-radius:8px; cursor:pointer; }
  button:disabled { opacity:0.6; cursor:not-allowed; }
  .card { border:1px solid #eee; border-radius:12px; padding:14px; margin:12px 0; }
  h2 { margin:0 0 10px 0; }
</style>

<div class="wrap">
  <div class="topbar">
    <div>
      <h2>Photographer Dashboard</h2>
      {#if user}
        <div class="muted">Logged in as: <strong>{user.phoneNumber || user.uid}</strong></div>
      {/if}
    </div>
    {#if user}
      <button on:click={logout}>Logout</button>
    {/if}
  </div>

  <!-- Collections -->
  <div class="card">
    <h3>Collections</h3>
    <div class="row">
      <label>New Collection</label>
      <input placeholder="e.g., Sharma Wedding"
             bind:value={newCollectionName} />
      <button on:click={createCollection} disabled={!user || !newCollectionName.trim()}>Create</button>
    </div>

    <div class="row-2">
      <label>Select Collection</label>
      <select bind:value={selectedCollectionId}>
        <option value="">-- choose collection --</option>
        {#each collections as c}
          <option value={c.id}>{c.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Events -->
  <div class="card">
    <h3>Events</h3>
    <div class="row">
      <label>New Event</label>
      <input placeholder="e.g., Sangeet"
             bind:value={newEventName}
             disabled={!selectedCollectionId} />
      <button on:click={createEvent} disabled={!user || !selectedCollectionId || !newEventName.trim()}>Create</button>
    </div>

    <div class="row-2">
      <label>Select Event</label>
      <select bind:value={selectedEventId} disabled={!selectedCollectionId}>
        <option value="">-- choose event --</option>
        {#each events as e}
          <option value={e.id}>{e.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Upload -->
  <div class="card">
    <h3>Upload Photos</h3>
    <p class="muted">पहले Collection और Event चुनें, फिर फ़ाइलें अपलोड करें.</p>
    <Uploader {selectedCollectionId} {selectedEventId} />
  </div>

  <!-- Gallery -->
  <div class="card">
    <h3>Gallery</h3>
    <Gallery {selectedCollectionId} {selectedEventId} />
  </div>
</div>
