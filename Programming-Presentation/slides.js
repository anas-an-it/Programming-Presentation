(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  if (!total) return;

  const deck = document.getElementById("deck");
  const currentEl = document.getElementById("currentSlide");
  const totalEl = document.getElementById("totalSlides");
  const progress = document.getElementById("progress");
  const progressFill = document.getElementById("progressFill");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pdfBtn = document.getElementById("pdfBtn");
  const pdfBtn2 = document.getElementById("pdfBtn2");
  const restartBtn = document.getElementById("restartBtn");

  const pad = (n) => String(n).padStart(2, "0");
  const clamp = (n) => Math.min(Math.max(n, 0), total - 1);

  function indexFromHash() {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (!match) return 0;
    return clamp(parseInt(match[1], 10) - 1);
  }

  let current = -1;

  function show(next, updateHash = true) {
    const index = clamp(next);
    if (index === current) return;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      slide.inert = !active;
    });

    current = index;
    currentEl.textContent = pad(index + 1);
    progressFill.style.width = ((index + 1) / total) * 100 + "%";
    progress.setAttribute("aria-valuenow", String(index + 1));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    document.title = "البرمجة | " + (slides[index].dataset.title || pad(index + 1));

    if (updateHash) {
      history.replaceState(null, "", "#slide-" + (index + 1));
    }
  }

  function go(step) {
    show(current + step);
  }

  nextBtn.addEventListener("click", () => go(1));
  prevBtn.addEventListener("click", () => go(-1));
  document.querySelectorAll(".js-next").forEach((btn) => {
    btn.addEventListener("click", () => go(1));
  });
  if (restartBtn) restartBtn.addEventListener("click", () => show(0));

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const onButton = event.target && event.target.tagName === "BUTTON";

    switch (event.key) {
      case "ArrowLeft":
      case "PageDown":
        event.preventDefault();
        go(1);
        break;
      case "ArrowRight":
      case "PageUp":
        event.preventDefault();
        go(-1);
        break;
      case " ":
      case "Spacebar":
        if (onButton) return;
        event.preventDefault();
        go(1);
        break;
      case "Home":
        event.preventDefault();
        show(0);
        break;
      case "End":
        event.preventDefault();
        show(total - 1);
        break;
      default:
        break;
    }
  });

  window.addEventListener("hashchange", () => {
    const index = indexFromHash();
    if (index !== current) show(index, false);
  });

  // Swipe support for phones and tablets
  let touchStart = null;
  deck.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  deck.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? 1 : -1);
    }
    touchStart = null;
  }, { passive: true });

  function saveAsPdf() {
    document.body.classList.add("is-printing");
    window.print();
  }
  [pdfBtn, pdfBtn2].forEach((btn) => {
    if (btn) btn.addEventListener("click", saveAsPdf);
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("is-printing"));

  totalEl.textContent = pad(total);
  show(indexFromHash(), false);
})();
