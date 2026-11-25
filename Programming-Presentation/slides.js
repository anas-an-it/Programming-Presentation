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
  const readBtn = document.getElementById("readBtn");
  const readLabel = readBtn.querySelector("span");
  const voiceBtn = document.getElementById("voiceBtn");
  const voicePicker = document.getElementById("voicePicker");
  const voiceList = document.getElementById("voiceList");
  const restartBtn = document.getElementById("restartBtn");
  const counterBtn = document.getElementById("counterBtn");
  const numberPicker = document.getElementById("numberPicker");
  const pickerGrid = document.getElementById("pickerGrid");

  const pad = (n) => String(n).padStart(2, "0");
  const clamp = (n) => Math.min(Math.max(n, 0), total - 1);

  function indexFromHash() {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (!match) return 0;
    return clamp(parseInt(match[1], 10) - 1);
  }

  let current = -1;

  function show(next, updateHash = true) {
    if (typeof stopReading === "function") stopReading();
    const index = clamp(next);
    if (index === current) return;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      slide.inert = !active;
    });

    current = index;
    document.body.classList.toggle("no-reader", index === total - 1);
    if (index === total - 1 && typeof closeVoicePicker === "function") closeVoicePicker();
    currentEl.textContent = pad(index + 1);
    pickerGrid.querySelectorAll(".picker-btn").forEach((btn, i) => {
      btn.classList.toggle("is-current", i === index);
      if (i === index) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    progressFill.style.width = ((index + 1) / total) * 100 + "%";
    progress.setAttribute("aria-valuenow", String(index + 1));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    const title = slides[index].dataset.title || pad(index + 1);
    document.title = "البرمجة | " + title;
    document.getElementById("currentTitle").textContent = title;

    if (updateHash) {
      history.replaceState(null, "", "#slide-" + (index + 1));
    }
  }

  function go(step) {
    show(current + step);
  }

  slides.forEach((slide, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-btn";
    btn.textContent = pad(i + 1);
    btn.title = slide.dataset.title || pad(i + 1);
    btn.addEventListener("click", () => {
      show(i);
      closePicker();
    });
    pickerGrid.appendChild(btn);
  });

  function closePicker(restoreFocus = false) {
    if (numberPicker.hidden) return;
    numberPicker.hidden = true;
    counterBtn.setAttribute("aria-expanded", "false");
    if (restoreFocus) counterBtn.focus();
  }

  counterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = numberPicker.hidden;
    numberPicker.hidden = !willOpen;
    counterBtn.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", (event) => {
    if (!numberPicker.hidden && !numberPicker.contains(event.target) && event.target !== counterBtn) {
      closePicker();
    }
  });

  nextBtn.addEventListener("click", () => go(1));
  prevBtn.addEventListener("click", () => go(-1));
  document.querySelectorAll(".js-next").forEach((btn) => {
    btn.addEventListener("click", () => go(1));
  });
  if (restartBtn) restartBtn.addEventListener("click", () => show(0));

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const onButton = event.target && event.target.tagName === "BUTTON";

    if (/^[0-9]$/.test(event.key)) {
      const target = event.key === "0" ? 10 : Number(event.key);
      if (target <= total) {
        event.preventDefault();
        show(target - 1);
        closePicker();
        return;
      }
    }

    switch (event.key) {
      case "Escape":
        closePicker(true);
        closeVoicePicker(true);
        break;
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

  // Pointer-driven 3D tilt for the elements marked with data-tilt
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canHover && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 8;
      let frame = 0;

      el.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          el.style.setProperty("--ry", (px * 2 * max).toFixed(2) + "deg");
          el.style.setProperty("--rx", (-py * 2 * max).toFixed(2) + "deg");
        });
      });

      const reset = () => {
        cancelAnimationFrame(frame);
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      };
      el.addEventListener("pointerleave", reset);
      el.addEventListener("pointercancel", reset);
    });
  }

  // Read the current slide aloud using the browser's speech engine
  const speech = "speechSynthesis" in window ? window.speechSynthesis : null;
  let utterance = null;
  let voicePresets = [];
  const VOICE_STORAGE_KEY = "programming-presentation:voice-preset";
  let selectedPresetIndex = (() => {
    try {
      const saved = window.localStorage && localStorage.getItem(VOICE_STORAGE_KEY);
      if (!saved) return null;
      const value = parseInt(saved, 10);
      return Number.isInteger(value) && value >= 0 ? value : null;
    } catch (error) {
      return null;
    }
  })();

  function setReadingState(active) {
    readBtn.classList.toggle("is-speaking", active);
    readBtn.setAttribute("aria-pressed", String(active));
    readLabel.textContent = active ? "إيقاف" : "اقرأ";
    readBtn.title = active ? "إيقاف القراءة" : "اقرأ الشريحة الحالية بصوت عالٍ";
  }

  function stopReading() {
    if (!speech) return;
    speech.cancel();
    utterance = null;
    setReadingState(false);
  }

  function readSlide() {
    if (!speech) {
      readBtn.disabled = true;
      readBtn.title = "القراءة غير مدعومة في هذا المتصفح";
      return;
    }
    if (utterance || speech.speaking) {
      stopReading();
      return;
    }

    const source = slides[current] && slides[current].querySelector(".slide-inner");
    if (!source) return;
    const clone = source.cloneNode(true);
    clone.querySelectorAll(".code, button, svg, .mini-3d, .end-3d, .step-num, .lang-badge").forEach((node) => node.remove());
    const parts = Array.from(
      clone.querySelectorAll("h1, h2, h3, p, .fact, .chips span, .fn-orbit span, .depth-card strong, .depth-card small, .journey-item strong")
    )
      .map((node) => node.textContent.replace(/\s+/g, " ").trim().replace(/[.!?؟]+$/, "").trim())
      .filter(Boolean);
    const text = parts.length ? parts.join(". ") + "." : "";
    if (!text) return;

    const preset = voicePresets[selectedPresetIndex] || voicePresets[0] || { voice: null, rate: 0.95, pitch: 1 };
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = preset.voice ? preset.voice.lang : "ar-SA";
    utterance.rate = preset.rate;
    utterance.pitch = preset.pitch;
    utterance.volume = 1;
    if (preset.voice) utterance.voice = preset.voice;
    utterance.onend = utterance.onerror = () => {
      utterance = null;
      setReadingState(false);
    };

    speech.cancel();
    speech.speak(utterance);
    setReadingState(true);
  }

  readBtn.addEventListener("click", readSlide);

  const sampleText = "مرحباً، هذه تجربة صوت القراءة. البرمجة تجعل الأفكار حقيقة.";

  function playVoice(preset, button) {
    if (!speech) return;
    speech.cancel();
    setReadingState(false);
    voiceList.querySelectorAll(".voice-play").forEach((b) => b.classList.remove("is-playing"));
    if (button) button.classList.add("is-playing");

    const preview = new SpeechSynthesisUtterance(sampleText);
    preview.lang = preset.voice ? preset.voice.lang : "ar-SA";
    if (preset.voice) preview.voice = preset.voice;
    preview.rate = preset.rate;
    preview.pitch = preset.pitch;
    preview.onend = preview.onerror = () => {
      if (button) button.classList.remove("is-playing");
    };
    speech.speak(preview);
  }

  function renderVoices() {
    if (!speech) return;
    voiceList.innerHTML = "";

    const voices = speech.getVoices();
    if (!voices.length) {
      voicePresets = [];
      const empty = document.createElement("p");
      empty.className = "voice-empty";
      empty.textContent = "لا توجد أصوات متاحة في هذا المتصفح حالياً.";
      voiceList.appendChild(empty);
      return;
    }

    // Two curated options: a calm female voice and a clear, natural-sounding male voice.
    const arabic = voices.filter((voice) => /^ar/i.test(voice.lang));
    const femaleNames = /hoda|zira|zariyah|hazel|susan|jenny|aria|amana|salma|sali|sara|farida|mona|layla|laila|noura|fatima|female|woman|هدى|سلمى|ليلى|نورة|فاطمة/i;
    const maleNames = /naayf|nayef|naif|maged|majid|majeed|mansour|mansoor|fateen|omar|kareem|karim|ahmed|hussein|hamed|hamid|shakir|hamdan|zahariyy|ayaan|david|mark|george|male|man|نايف|ماجد|منصور|حامد|شاكر/i;
    const naturalVoice = (voice) => /neural|natural|online|hamed|hamid|shakir|hamdan|zahariyy|ayaan/i.test(voice.name);
    const byQuality = (a, b) =>
      Number(naturalVoice(b)) - Number(naturalVoice(a)) || a.name.localeCompare(b.name);
    const females = arabic.filter((voice) => femaleNames.test(voice.name)).sort(byQuality);
    const namedMales = arabic.filter((voice) => maleNames.test(voice.name)).sort(byQuality);
    const naturalMale = arabic
      .filter((voice) => !femaleNames.test(voice.name) && naturalVoice(voice))
      .sort(byQuality)[0];
    const maleVoice = naturalMale || namedMales[0] || null;
    const fallback = arabic[0] || voices[0];
    const femaleVoice = females[0] || fallback;
    const hasDistinctMale = !!maleVoice && maleVoice !== femaleVoice;
    const isNatural = (voice) => !!voice && naturalVoice(voice);

    voicePresets = [
      { label: "نسائي · هادئ", voice: femaleVoice, rate: 0.94, pitch: 1.02 },
      {
        label: hasDistinctMale ? "صوت رجل · واضح" : "صوت رجل · عميق",
        voice: hasDistinctMale ? maleVoice : femaleVoice,
        rate: hasDistinctMale ? (isNatural(maleVoice) ? 1 : 0.96) : 0.88,
        pitch: hasDistinctMale ? (isNatural(maleVoice) ? 1 : 0.94) : 0.72
      }
    ];
    if (selectedPresetIndex !== null && selectedPresetIndex >= voicePresets.length) selectedPresetIndex = 0;

    voicePresets.forEach((preset, index) => {
      const row = document.createElement("div");
      row.className = "voice-row";

      const select = document.createElement("button");
      select.type = "button";
      select.className = "voice-select";
      if (selectedPresetIndex === index) select.classList.add("is-selected");
      const main = document.createElement("span");
      main.textContent = preset.label;
      const sub = document.createElement("small");
      const sharedVoiceNote = index === 1 && !hasDistinctMale ? " · نبرة أعمق" : "";
      sub.textContent = preset.voice
        ? preset.voice.name + " · " + preset.voice.lang + (isNatural(preset.voice) ? " · طبيعي" : "") + sharedVoiceNote
        : "افتراضي";
      select.append(main, sub);
      select.addEventListener("click", () => {
        selectedPresetIndex = index;
        try {
          if (window.localStorage) localStorage.setItem(VOICE_STORAGE_KEY, String(index));
        } catch (error) {
          // Storage can be unavailable in private mode; selection still works for this visit.
        }
        renderVoices();
        closeVoicePicker();
      });

      const play = document.createElement("button");
      play.type = "button";
      play.className = "voice-play";
      play.textContent = "▶";
      play.title = "استمع إلى " + preset.label;
      play.addEventListener("click", () => playVoice(preset, play));

      row.append(select, play);
      voiceList.appendChild(row);
    });
  }

  function closeVoicePicker(restoreFocus = false) {
    if (voicePicker.hidden) return;
    voicePicker.hidden = true;
    voiceBtn.setAttribute("aria-expanded", "false");
    if (restoreFocus) voiceBtn.focus();
  }

  voiceBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = voicePicker.hidden;
    voicePicker.hidden = !willOpen;
    voiceBtn.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) renderVoices();
  });

  document.addEventListener("click", (event) => {
    if (!voicePicker.hidden && !voicePicker.contains(event.target) && event.target !== voiceBtn) {
      closeVoicePicker();
    }
  });

  if (speech) {
    renderVoices();
    speech.addEventListener("voiceschanged", renderVoices);
  } else {
    voiceBtn.disabled = true;
    voiceBtn.title = "اختيار الصوت غير مدعوم في هذا المتصفح";
  }

  window.addEventListener("beforeunload", () => speech && speech.cancel());

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
