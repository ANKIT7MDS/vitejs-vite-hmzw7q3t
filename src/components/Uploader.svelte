<script>
  import { storage, db } from '../lib/firebase';
  import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
  import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

  export let uid;              // photographer UID
  export let collectionId;     // चुना हुआ कलेक्शन
  export let eventId;          // चुना हुआ इवेंट

  let files = [];
  let uploads = []; // [{name, progress, state}]

  function pickFiles(e) {
    files = Array.from(e.target.files || []);
    startUpload(files);
  }

  function onDrop(e) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    files = dropped;
    startUpload(files);
  }

  function onDragOver(e){ e.preventDefault(); }

  async function startUpload(list) {
    if (!uid || !collectionId || !eventId) {
      alert('Please select a collection and event first.');
      return;
    }
    if (!list.length) return;

    uploads = list.map(f => ({ name: f.name, progress: 0, state: 'queued' }));

    for (const file of list) {
      const idx = uploads.findIndex(u => u.name === file.name);
      try {
        const path = `photographers/${uid}/collections/${collectionId}/events/${eventId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file);

        task.on('state_changed', (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          uploads[idx].progress = pct;
          uploads[idx].state = snap.state; // running, paused, success (custom)
          uploads = [...uploads];
        });

        await task;
        const url = await getDownloadURL(storageRef);

        // Firestore में मेटाडेटा सेव
        await addDoc(
          collection(db, 'photographers', uid, 'collections', collectionId, 'events', eventId, 'photos'),
          {
            name: file.name,
            storagePath: path,
            downloadURL: url,
            size: file.size,
            contentType: file.type,
            createdAt: serverTimestamp()
          }
        );

        uploads[idx].state = 'success';
        uploads = [...uploads];
      } catch (err) {
        console.error('Upload error:', err);
        uploads[idx].state = 'error';
        uploads = [...uploads];
      }
    }
  }
</script>

<div
  class="border-2 border-dashed rounded p-6 text-center cursor-pointer"
  on:drop={onDrop}
  on:dragover={onDragOver}
>
  <p class="mb-2">Drag & Drop photos here</p>
  <p class="text-sm mb-4">or</p>
  <label class="inline-block bg-blue-600 text-white px-3 py-2 rounded cursor-pointer">
    Choose Files
    <input type="file" accept="image/*" multiple class="hidden" on:change={pickFiles} />
  </label>
</div>

{#if uploads.length}
  <div class="mt-4 space-y-2">
    {#each uploads as u}
      <div class="text-sm">
        <div class="flex justify-between">
          <span>{u.name}</span>
          <span>{u.progress}%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded">
          <div class="h-2 rounded bg-green-600" style="width: {u.progress}%;"></div>
        </div>
        {#if u.state === 'success'}
          <span class="text-green-700">Uploaded</span>
        {:else if u.state === 'error'}
          <span class="text-red-700">Error</span>
        {/if}
      </div>
    {/each}
  </div>
{/if}
