<script>
  import { getAuth } from "firebase/auth";
  import { uploadFile } from "../lib/uploader";
  import { savePhotoMeta } from "../lib/photos";   // ⬅️ नया import

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

  // ... बाकी जैसा था ...

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

        // ⬇️ Firestore में फोटो मेटाडेटा सेव
        await savePhotoMeta({
          collectionId: selectedCollectionId,
          eventId: selectedEventId,
          name: file.name,
          path: out.path,
          downloadURL: out.downloadURL,
          size: file.size,
          type: file.type
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
