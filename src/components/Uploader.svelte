<script>
  import { getAuth } from "firebase/auth";

  export let selectedCollectionId = "";
  export let selectedEventId = "";

  // ✅ अपना Cloud Run upload API (जो curl से सफल हुआ था) यहाँ डालें:
  const UPLOAD_API = "https://uploadimage-tmo2okwfxa-el.a.run.app"; // <-- अपना URL

  let files = [];
  let status = "";
  let working = false;

  const auth = getAuth();

  function onChoose(e) {
    files = Array.from(e.target.files || []);
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  async function uploadAll() {
    if (!auth.currentUser) {
      alert("कृपया लॉग-इन करें");
      return;
    }
    if (!selectedCollectionId || !selectedEventId) {
      alert("पहले Collection और Event चुनें");
      return;
    }
    if (!files.length) {
      alert("फोटो चुनें");
      return;
    }

    working = true;
    status = "Uploading...";

    try {
      for (const f of files) {
        const dataUrl = await readAsDataURL(f);
        const body = {
          uid: auth.currentUser.uid,
          collectionId: selectedCollectionId,
          eventId: selectedEventId,
          filename: f.name,
          contentType: f.type || "image/jpeg",
          dataUrl
        };

        const r = await fetch(UPLOAD_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Cloud Run में हमने CORS: '*' रखा है; auth header की जरूरत नहीं
          },
          body: JSON.stringify(body)
        });

        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Upload failed (${r.status}): ${text}`);
        }

        const json = await r.json(); // {ok:true, path, downloadURL}
        // चाहें तो status में path/url दिखा सकते हैं
      }

      status = "All files uploaded ✅";
      files = [];
    } catch (e) {
      console.error(e);
      status = "Upload error: " + e.message;
    } finally {
      working = false;
    }
  }
</script>

<style>
  .box {
    border: 2px dashed #cfcfcf;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }
  .row { display:flex; gap:12px; align-items:center; }
  button { padding:8px 12px; border:1px solid #ddd; background:#111; color:#fff; border-radius:8px; cursor:pointer; }
  button:disabled{opacity:.6; cursor:not-allowed;}
  .muted { color:#666; font-size:13px; }
</style>

<div class="box">
  <div class="row" style="justify-content:center; margin-bottom:10px;">
    <input type="file" multiple accept="image/*" on:change={onChoose} />
    <button on:click={uploadAll} disabled={working || !files.length || !selectedCollectionId || !selectedEventId}>
      {working ? "Uploading..." : "Upload"}
    </button>
  </div>

  <div class="muted">
    चुनी गई फाइलें: {files.length}
  </div>
  {#if status}
    <div class="muted" style="margin-top:8px;">{status}</div>
  {/if}
</div>
