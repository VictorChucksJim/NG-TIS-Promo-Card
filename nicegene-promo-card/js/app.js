// app.js — orchestrates the screens. No framework: a small state machine
// plus direct DOM references, deliberately simple so it's cheap to host
// and easy for a non-specialist to maintain.

(() => {
  const state = {
    config: null,
    participant: null,
    rawImage: null,     // original uploaded HTMLImageElement
    crop: { scale: 1, offsetX: 0, offsetY: 0 },
    croppedCanvas: null,
    finalCanvas: null
  };

  // ---------- Screen management ----------
  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("is-active"));
    document.getElementById(`screen-${name}`).classList.add("is-active");
  }

  function setStep(n) {
    document.querySelectorAll(".step").forEach(el => {
      const step = Number(el.dataset.step);
      el.classList.toggle("is-active", step === n);
      el.classList.toggle("is-done", step < n);
    });
  }

  // ---------- Boot / verification ----------
  async function boot() {
    state.config = await loadEventConfig();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    const result = await NicegeneAPI.verifyToken(token);
    if (result.ok) {
      state.participant = result.participant;
      NicegeneAPI.reportActivity("PROMO_PAGE_OPENED", state.participant, state.config.eventId);
      showWelcome();
    } else {
      showScreen("invalid");
    }
  }

  function showWelcome() {
    document.getElementById("welcome-name").textContent = state.participant.name?.split(" ")[0] || "there";
    document.getElementById("welcome-copy").textContent =
      `You're registered for ${state.config.eventName}. Let's create your personalised event card.`;
    showScreen("welcome");
  }

  document.getElementById("btn-start").addEventListener("click", () => {
    setStep(1);
    showScreen("photo");
  });

  document.getElementById("btn-manual-verify").addEventListener("click", () => showScreen("verify"));

  document.getElementById("verify-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const participantId = form.get("participantId").trim();
    const email = form.get("email").trim();
    const errorEl = document.getElementById("verify-error");
    errorEl.hidden = true;

    const result = await NicegeneAPI.verifyManual(participantId, email);
    if (result.ok) {
      state.participant = result.participant;
      NicegeneAPI.reportActivity("PROMO_PAGE_OPENED", state.participant, state.config.eventId);
      showWelcome();
    } else {
      errorEl.textContent = "We couldn't match that Participant ID and email. Please check and try again.";
      errorEl.hidden = false;
    }
  });

  // ---------- Photo upload ----------
  const fileInput = document.getElementById("file-input");
  const uploadZone = document.getElementById("upload-zone");
  const uploadError = document.getElementById("upload-error");
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

  document.getElementById("btn-choose-file").addEventListener("click", () => fileInput.click());
  uploadZone.addEventListener("click", () => fileInput.click());
  uploadZone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });

  // Native "capture" attribute is added only where the browser supports it,
  // to satisfy "Take a Photo" on mobile without a separate code path.
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    const takePhotoBtn = document.getElementById("btn-take-photo");
    takePhotoBtn.hidden = false;
    takePhotoBtn.addEventListener("click", () => {
      fileInput.setAttribute("capture", "user");
      fileInput.click();
    });
  }

  fileInput.addEventListener("change", async (e) => {
    uploadError.hidden = true;
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      uploadError.textContent = "Please upload a JPG, PNG or supported image.";
      uploadError.hidden = false;
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      uploadError.textContent = "That photo is a little too large. Please choose another photo.";
      uploadError.hidden = false;
      return;
    }

    try {
      const img = await loadImageWithOrientationFix(file);
      state.rawImage = img;
      NicegeneAPI.reportActivity("PHOTO_UPLOADED", state.participant, state.config.eventId);
      initCropStage(img);
      showScreen("crop");
    } catch (err) {
      uploadError.textContent = "We couldn't read that photo. Please try a different file.";
      uploadError.hidden = false;
    }
  });

  function loadImageWithOrientationFix(file) {
    // Browsers already honour EXIF orientation for <img>/canvas drawImage
    // in all current evergreen browsers, so no manual EXIF parsing is
    // needed for the MVP — this keeps the bundle free of extra libraries.
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // ---------- Crop stage (drag + zoom on a canvas) ----------
  const cropCanvas = document.getElementById("crop-canvas");
  const cropCtx = cropCanvas.getContext("2d");
  const zoomRange = document.getElementById("zoom-range");
  let dragging = false, lastX = 0, lastY = 0;

  function initCropStage(img) {
    state.crop = { scale: 1, offsetX: 0, offsetY: 0 };
    zoomRange.value = 1;
    fitImageToStage(img);
    drawCropPreview();
  }

  let baseScale = 1;
  function fitImageToStage(img) {
    const stageSize = cropCanvas.width; // square canvas
    baseScale = Math.max(stageSize / img.width, stageSize / img.height);
  }

  function drawCropPreview() {
    const img = state.rawImage;
    if (!img) return;
    const stageSize = cropCanvas.width;
    const scale = baseScale * state.crop.scale;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = (stageSize - drawW) / 2 + state.crop.offsetX;
    const dy = (stageSize - drawH) / 2 + state.crop.offsetY;

    cropCtx.clearRect(0, 0, stageSize, stageSize);
    cropCtx.drawImage(img, dx, dy, drawW, drawH);
  }

  function clampOffsets() {
    // Keep the image covering the circular mask at all times.
    const img = state.rawImage;
    const stageSize = cropCanvas.width;
    const scale = baseScale * state.crop.scale;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const maxOffsetX = Math.max(0, (drawW - stageSize) / 2);
    const maxOffsetY = Math.max(0, (drawH - stageSize) / 2);
    state.crop.offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, state.crop.offsetX));
    state.crop.offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, state.crop.offsetY));
  }

  function pointerDown(x, y) { dragging = true; lastX = x; lastY = y; }
  function pointerMove(x, y) {
    if (!dragging) return;
    state.crop.offsetX += x - lastX;
    state.crop.offsetY += y - lastY;
    lastX = x; lastY = y;
    clampOffsets();
    drawCropPreview();
  }
  function pointerUp() { dragging = false; }

  cropCanvas.addEventListener("mousedown", (e) => pointerDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", pointerUp);

  cropCanvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0]; pointerDown(t.clientX, t.clientY);
  }, { passive: true });
  cropCanvas.addEventListener("touchmove", (e) => {
    const t = e.touches[0]; pointerMove(t.clientX, t.clientY);
  }, { passive: true });
  cropCanvas.addEventListener("touchend", pointerUp);

  zoomRange.addEventListener("input", (e) => {
    state.crop.scale = Number(e.target.value);
    clampOffsets();
    drawCropPreview();
  });

  document.getElementById("btn-retake").addEventListener("click", () => {
    fileInput.value = "";
    showScreen("photo");
  });

  document.getElementById("btn-continue-crop").addEventListener("click", () => {
    state.croppedCanvas = bakeCroppedCanvas();
    NicegeneAPI.reportActivity("CARD_PREVIEWED", state.participant, state.config.eventId);
    setStep(2);
    renderPreview();
    showScreen("preview");
  });

  function bakeCroppedCanvas() {
    // Bakes the current crop/zoom/position into a fixed-size square canvas
    // that the card renderer can composite directly, independent of the
    // on-screen stage size.
    const OUTPUT_SIZE = 600;
    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const octx = out.getContext("2d");

    const img = state.rawImage;
    const stageSize = cropCanvas.width;
    const ratio = OUTPUT_SIZE / stageSize;
    const scale = baseScale * state.crop.scale * ratio;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = (OUTPUT_SIZE - drawW) / 2 + state.crop.offsetX * ratio;
    const dy = (OUTPUT_SIZE - drawH) / 2 + state.crop.offsetY * ratio;

    octx.drawImage(img, dx, dy, drawW, drawH);
    return out;
  }

  // ---------- Preview ----------
  async function renderPreview() {
    const canvas = document.getElementById("preview-canvas");
    await CardRenderer.render(canvas, state.config, state.participant, state.croppedCanvas);
  }

  document.getElementById("btn-back-crop").addEventListener("click", () => showScreen("crop"));

  document.getElementById("btn-generate").addEventListener("click", async () => {
    showScreen("generating");
    try {
      const canvas = document.getElementById("final-canvas");
      await CardRenderer.render(canvas, state.config, state.participant, state.croppedCanvas);
      state.finalCanvas = canvas;
      NicegeneAPI.reportActivity("CARD_GENERATED", state.participant, state.config.eventId);
      setStep(3);
      showScreen("success");
    } catch (err) {
      console.error(err);
      showScreen("gen-error");
    }
  });

  document.getElementById("btn-retry-generate").addEventListener("click", () => showScreen("preview"));

  // ---------- Download / Share ----------
  document.getElementById("btn-download").addEventListener("click", () => {
    state.finalCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nicegene-${state.config.eventId}-${(state.participant.name || "card").replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      NicegeneAPI.reportActivity("CARD_DOWNLOADED", state.participant, state.config.eventId);
    }, "image/png", 0.95);
  });

  if (navigator.canShare) {
    document.getElementById("btn-share").hidden = false;
  }
  document.getElementById("btn-share").addEventListener("click", () => {
    state.finalCanvas.toBlob(async (blob) => {
      const file = new File([blob], "nicegene-promo-card.png", { type: "image/png" });
      try {
        await navigator.share({
          files: [file],
          title: state.config.eventName,
          text: `I'm attending ${state.config.eventName}! Join me:`
        });
        NicegeneAPI.reportActivity("SHARE_INITIATED", state.participant, state.config.eventId);
      } catch (err) {
        // User cancelled share sheet — not an error worth surfacing.
      }
    }, "image/png", 0.95);
  });

  document.getElementById("btn-again").addEventListener("click", () => {
    state.rawImage = null;
    state.croppedCanvas = null;
    fileInput.value = "";
    setStep(1);
    showScreen("photo");
  });

  boot();
})();
