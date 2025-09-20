<script>
  import { onMount } from "svelte";
  import { getAuth } from "firebase/auth";
  import {
    getFirestore, collection, onSnapshot, query, orderBy
  } from "firebase/firestore";

  export let selectedCollectionId = "";
  export let selectedEventId = "";

  const auth = getAuth();
  const db = getFirestore();

  let photos = []; // [{id, name, downloadURL, createdAt}]

  let unsub = null;
  function stop() { if (unsub) unsub(); unsub = null; }

  // watcher
  $: {
    stop();
    photos = [];
    if (auth.currentUser && selectedCollectionId && selectedEventId) {
      const path = `photographers/${auth.currentUser.uid}/collections/${selectedCollectionId}/events/${selectedEventId}/photos`;
      const ref = collection(db, path);
      const q = query(ref, orderBy("createdAt","desc"));
      unsub = onSnapshot(q, snap => {
        photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      });
    }
  }

  onMount(() => () => stop());
</script>

<style>
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:12px; }
  .card { border:1px solid #eee; border-radius:10px; overflow:hidden; background:#fafafa; }
  .thumb { width:100%; height:160px; object-fit:cover; display:block; }
  .name { font-size:12px; padding:6px 8px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
</style>

{#if !selectedCollectionId || !selectedEventId}
  <p>पहले Collection और Event चुनें।</p>
{:else if !photos.length}
  <p>यहाँ फोटो दिखेंगी…</p>
{:else}
  <div class="grid">
    {#each photos as p}
      <a class="card" href={p.downloadURL} target="_blank" rel="noreferrer">
        <img class="thumb" src={p.downloadURL} alt={p.name || "photo"} loading="lazy" />
        <div class="name">{p.name}</div>
      </a>
    {/each}
  </div>
{/if}
