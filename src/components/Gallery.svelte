<script>
  import { getFirestore, collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
  import { getAuth } from "firebase/auth";

  export let selectedCollectionId = "";
  export let selectedEventId = "";

  let photos = [];
  let unsub;

  $: {
    if (unsub) { unsub(); unsub = null; }
    const db = getFirestore();
    const uid = getAuth().currentUser?.uid || "demo";

    if (selectedCollectionId && selectedEventId) {
      const ref = collection(
        db,
        "photographers", uid,
        "collections", selectedCollectionId,
        "events", selectedEventId,
        "photos"
      );
      const q = query(ref, orderBy("createdAt","desc"), limit(200));
      unsub = onSnapshot(q, (snap) => {
        photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      });
    } else {
      photos = [];
    }
  }
</script>

<style>
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap:12px; }
  .card { border:1px solid #eee; border-radius:10px; padding:8px; }
  img { width:100%; height:140px; object-fit:cover; border-radius:8px; }
  .muted { color:#666; font-size: 12px; }
</style>

{#if !selectedCollectionId || !selectedEventId}
  <div class="muted">कृपया ऊपर Collection और Event चुनें…</div>
{:else}
  {#if photos.length === 0}
    <div class="muted">अभी कोई फोटो नहीं। अपलोड करें और यहाँ दिखेगा।</div>
  {:else}
    <div class="grid">
      {#each photos as p}
        <div class="card">
          <a href={p.url} target="_blank" rel="noopener">
            <img loading="lazy" src={p.url} alt={p.name} />
          </a>
          <div class="muted">{p.name}</div>
        </div>
      {/each}
    </div>
  {/if}
{/if}
