<script>
  import Uploader from "./Uploader.svelte";
  import Gallery from "./Gallery.svelte";  // ⬅️ नया

  let selectedCollectionId = "";
  let selectedEventId = "";
</script>

<!-- आपके इनपुट/ड्रॉपडाउन वही रहें -->
<div class="card">
  <Uploader {selectedCollectionId} {selectedEventId} />
</div>

<div style="height:12px;"></div>

<div class="card">
  <Gallery {selectedCollectionId} {selectedEventId} />
</div>
