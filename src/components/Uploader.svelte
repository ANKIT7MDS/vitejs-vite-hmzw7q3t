<script>
  // ---- Firebase + Firestore ----
  import { auth } from '../lib/firebase.js';
  import { db } from '../lib/firebase.js';
  import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

  // ---- Cloud Run endpoint ----
  import { FUNCTION_URL } from '../lib/config.js';

  // Dashboard.svelte से props
  export let selectedCollectionId = '';
  export let selectedEventId = '';

  let isDragging = false;
  let files = [];
  let uploads = []; // {name, progress, status}

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function startUpload(fileList) {
    if (!selectedCollectionId || !selectedEventId) {
      alert('पहले Collection और Event चुनें');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) { alert('Login required'); return; }

    uploads = [];
    for (const f of fileList) {
      uploads = [...uploads, { name: f.name, progress: 0, status: 'pending' }];
    }

    let idx = 0;
    for (const f of fileList) {
      if (f.size > 10 * 1024 * 1024) { // 10MB limit
        uploads[idx].status = 'too-big';
        uploads = [...uploads];
        idx++;
        continue;
      }

      try {
        uploads[idx].status = 'uploading';
        uploads[idx].progress = 25; // cosmetic
        uploads = [...uploads];

        const dataUrl = await fileToDataURL(f);

        const resp = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            collectionId: selectedCollectionId,
            eventId: selectedEventId,
            filename: f.name,
            contentType: f.type || 'image/jpeg',
            dataUrl
          })
        });

        const json = await resp.json();

        if (!resp.ok || !json.ok) {
          console.error('Upload failed:', json);
          uploads[idx].status = 'failed';
          uploads[idx].progress = 0;
          uploads = [...uploads];
          idx++;
          continue;
        }

        // Firestore में फोटो का डॉक सेव करें
        await addDoc(
          collection(db, `photographers/${uid}/collections/${selectedCollectionId}/events/${selectedEventId}/photos`),
          {
            name: f.name,
            downloadURL: json.downloadURL, // 24h signed URL
            path: json.path,               // storage path
            contentType: f.type,
            size: f.size,
            createdAt: serverTimestamp()
          }
        );

        uploads[idx].status = 'done';
        uploads[idx].progress = 100;
        uploads = [...uploads];
      } catch (e) {
        console.error(e);
        uploads[idx].status = 'failed';
        uploads[idx].progress = 0;
        uploads = [...uploads];
      }
      idx++;
    }

    alert('Uploads done!');
  }

  // drag & drop helpers
  function onDrop(e) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files?.length) {
      files = Array.from(e.dataTransfer.files);
      startUpload(files);
    }
  }
  function onDragOver(e) { e.preventDefault(); isDragging = true; }
  function onDragLeave(e) { e.preventDefault(); isDragging = false; }
  function onPick(e) {
    const picked = e.target.files;
    if (picked?.length) {
      files = Array.from(picked);
      startUpload(files);
      e.target.value = ''; // re-pick allowed
    }
  }
</script>

<style>
  .drop { border:2px dashed #94a3b8; border-radius:10px; padding:20px; text-align:center; transition:all .15s; }
  .drop.drag { background:#f1f5f9; border-color:#3b82f6; }
  .list { margin-top:12px; }
  .row { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; }
  .bar { height:6px; background:#e5e7eb; border-radius:4px; overflow:hidden; margin-top:4px; }
  .bar > div { height:100%; background:#3b82f6; width:0%; transition:width .2s; }
  small.muted { color:#6b7280; }
</style>

<div class="drop {isDragging ? 'drag' : ''}"
     on:dragover={onDragOver}
     on:dragleave={onDragLeave}
     on:drop={onDrop}>
  <div><strong>Drag & Drop</strong> photos here</div>
  <div class="mt-1"><small class="muted">or</small></div>
  <div class="mt-2">
    <input type="file" multiple accept="image/*" on:change={onPick} />
  </div>
</div>

{#if uploads.length}
  <div class="list">
    {#each uploads as u}
      <div class="row">
        <div>
          <div><strong>{u.name}</strong></div>
          <div class="bar"><div style="width:{u.progress}%"></div></div>
          <small class="muted">
            {u.status === 'uploading' ? 'Uploading…' :
             u.status === 'done' ? 'Uploaded ✓' :
             u.status === 'too-big' ? 'Skipped (too large)' :
             u.status === 'failed' ? 'Failed' : 'Pending'}
          </small>
        </div>
        <div>{u.progress}%</div>
      </div>
    {/each}
  </div>
{/if}
