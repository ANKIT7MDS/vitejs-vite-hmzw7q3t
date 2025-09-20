<script>
  import { getAuth } from "firebase/auth";
  import { uploadFile } from "../lib/uploader";

  export let selectedCollectionId = "";
  export let selectedEventId = "";

  let queue = [];
  let results = [];
  let busy = false;
  let doneCount = 0;

  function getUid() {
    const u = getAuth().currentUser;
    return u?.uid || u?.phoneNumber || "demo";
  }

  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    queue = [...queue, ...files];
  }

  function onDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    queue = [...queue, ...files];
  }
  function onDragOver(e) {
    e.preventDefault();
  }

  async function startUpload() {
    if (!selectedCollectionId || !selectedEventId) {
      alert("पहले Collection और Event चुनें");
      return;
    }
    if (queue.length === 0) {
      alert("फाइल चुनें या ड्रैग-ड्रॉप करें");
      return;
    }

    busy = true;
    doneCount = 0;
    results = [];

    const uid = getUid();

    for (const file of queue) {
      try {
        const out = await uploadFile({
          file,
          uid,
          collectionId: selectedCollectionId,
          eventId: selectedEventId
        });
        results = [{ name: file.name, ok: true, ...out }, ...results];
      } catch (err) {
        results = [{ name: file.name, ok: false, error: String(err) }, ...results];
      }
      doneCount++;
    }

    queue = [];
    busy = false;
  }
</script>

<style>
  .drop { border: 2px dashed #888; padding: 22px; text-align: center; border-radius: 10px; }
  .muted { color:#666; font-size: 13px; }
  .ok { color: #0a7a2f; }
  .err { color: #b00020; }
  .grid { display:grid; gap:6px; }
</style>

<div class="grid">
  <div class="muted">Drag & Drop photos here</div>
  <div class="drop" on:drop={onDrop} on:dragover={onDragOver}>
    <input type="file" multiple on:change={onPickFiles} />
    <div class="muted">या ऊपर से फाइलें चुनें</div>
  </div>

  {#if queue.length}
    <div class="muted">{queue.length} files selected</div>
  {/if}

  <button disabled={busy} on:click={startUpload}>
    {busy ? `Uploading ${doneCount}/${queue.length}` : "Start Upload"}
  </button>

  {#if results.length}
    <h4>Results</h4>
    {#each results as r}
      <div class={r.ok ? "ok" : "err"}>
        <strong>{r.name}</strong>
        {#if r.ok}
          <div>Path: {r.path}</div>
          <div><a href={r.downloadURL} target="_blank" rel="noopener">Open</a></div>
        {:else}
          <div>{r.error}</div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
