function injectFileSelector() {
  const existingSidebar = document.getElementById("backdrop-selector");
  if (existingSidebar) {
    const isVisible = existingSidebar.style.transform === "translateX(0%)";
    existingSidebar.style.transform = isVisible ? "translateX(100%)" : "translateX(0%)";
    if (!isVisible) updateColorPickers(existingSidebar);
    return;
  }

  const container = document.createElement("div");
  container.id = "backdrop-selector";
  container.className = "customizer-sidebar-container";
  container.style.transform = "translateX(100%)";
  container.style.transition = "transform 0.5s ease";

  const url = chrome.runtime.getURL("sidebar.html");
  fetch(url)
    .then(response => response.text())
    .then(html => {
      container.innerHTML = html;
      document.body.appendChild(container);

      // Inject CSS
      if (!document.getElementById("customizer-styles")) {
        const link = document.createElement("link");
        link.id = "customizer-styles";
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("styles.css");
        document.head.appendChild(link);
      }

      // Collapsible Logic
      const collapsibles = container.querySelectorAll(".collapsible");
      collapsibles.forEach(coll => {
        coll.addEventListener("click", function() {
          this.classList.toggle("active");
          const content = this.nextElementSibling;
          content.classList.toggle("active");
        });
      });

      // Event Listeners Binding
      setupEventListeners(container);

      // Initialize values
      setTimeout(() => updateColorPickers(container), 50);

      // Slide in
      setTimeout(() => {
        container.style.transform = "translateX(0%)";
      }, 50);
    });
}

function setupEventListeners(sidebar) {
  // Close Button
  sidebar.querySelector("#closeArrowSide").addEventListener("click", () => {
    sidebar.style.transform = "translateX(100%)";
  });

  // Rainbow Mode
  const rainbowBtn = sidebar.querySelector('#rainbowModeBtn');
  rainbowBtn.addEventListener('click', function() {
    if (this.value === '1') {
      startRainbowMode();
      this.value = '0';
      this.textContent = 'Party Time!';
    } else {
      stopRainbowMode();
      this.value = '1';
      this.textContent = 'Party Time?';
      this.style.backgroundColor = '';
    }
  });

  // Backdrop
  sidebar.querySelector("#saveBackdropBtn").addEventListener("click", () => {
    saveBackdrop(sidebar.querySelector("#backdropFileInput"));
  });
  sidebar.querySelector("#removeBackdropBtn").addEventListener("click", () => {
    removeBackdrop();
    location.reload();
  });

  // Frame
  sidebar.querySelector("#saveFrameBtn").addEventListener("click", () => {
    saveFrame(sidebar.querySelector("#frameFileInput"));
  });
  sidebar.querySelector("#removeFrameBtn").addEventListener("click", () => {
    removeFrame();
    location.reload();
  });

  // UI Elements
  const particleType = sidebar.querySelector("#particleEffectType");
  const particleIntensity = sidebar.querySelector("#particleIntensity");
  const particleColor = sidebar.querySelector("#particleColor");
  const dynamicHealthToggle = sidebar.querySelector("#dynamicHealthToggle");
  const healthOrbToggle = sidebar.querySelector("#healthOrbToggle");
  const rarityAurasToggle = sidebar.querySelector("#rarityAurasToggle");
  const checkboxColor = sidebar.querySelector("#checkboxColor");
  const checkboxGlow = sidebar.querySelector("#checkboxGlow");
  const checkboxShape = sidebar.querySelector("#checkboxShape");
  const portraitShapeSelect = sidebar.querySelector("#portraitShapeSelect");
  const fontSelect = sidebar.querySelector("#fontSelect");
  const readabilityToggle = sidebar.querySelector("#readabilityToggle");
  const boxStyleSelect = sidebar.querySelector("#boxStyleSelect");
  const inventoryGridToggle = sidebar.querySelector("#inventoryGridToggle");

  portraitShapeSelect.addEventListener("change", (e) => {
    saveColor(e.target.value, 'portraitShape');
    if (window.applyPortraitShape) window.applyPortraitShape(e.target.value);
  });

  inventoryGridToggle.addEventListener("change", (e) => {
    saveColor(e.target.checked ? 'true' : 'false', 'inventoryGrid');
    if (window.applyInventoryGrid) window.applyInventoryGrid(e.target.checked);
  });

  boxStyleSelect.addEventListener("change", (e) => {
    saveColor(e.target.value, 'boxStyle');
    if (window.applyBackgroundColor) {
        const color = sidebar.querySelector("#colorInputBg").value;
        const alpha = Math.round((sidebar.querySelector("#alphaInputBg").value / 100) * 255).toString(16).padStart(2, '0');
        window.applyBackgroundColor(`${color}${alpha}`);
    }
  });

  // Colors
  const bindColor = (id, alphaId, type, applyFunc) => {
    const input = sidebar.querySelector(`#${id}`);
    const alphaInput = alphaId ? sidebar.querySelector(`#${alphaId}`) : null;
    
    const update = () => {
      const hex = input.value;
      const alpha = alphaInput ? Math.round((alphaInput.value / 100) * 255).toString(16).padStart(2, '0') : 'ff';
      const color = `${hex}${alpha}`;
      saveColor(color, type);
      window[applyFunc](color);
    };

    input.addEventListener("input", update);
    if (alphaInput) alphaInput.addEventListener("input", update);
  };

  bindColor("colorInputBg", "alphaInputBg", "background", "applyBackgroundColor");
  bindColor("colorInputHd", "alphaInputHd", "header", "applyHeaderColor");
  bindColor("colorInputBo", "alphaInputBo", "border", "applyBorderColor");
  
  const defaultParticleColors = {
    none: "#ffffff",
    embers: "#ff6600",
    gears: "#b87333",
    rain: "#aec2e0",
    snow: "#ffffff",
    eldritch: "#a349a4",
    magic: "#ffffc8",
    leaves: "#d35400",
    green_leaves: "#2d5a27",
    petals: "#ffc0cb",
    bubbles: "#88ccff",
    sand: "#f4d03f",
    fog: "#ffffff",
    stars: "#ffffff",
    lightning: "#ffffff"
  };

  const updateParts = (isTypeChange = false) => {
    if (isTypeChange) {
      const newDefault = defaultParticleColors[particleType.value];
      if (newDefault) particleColor.value = newDefault;
    }
    saveColor(particleType.value, 'particleType');
    saveColor(particleIntensity.value, 'particleIntensity');
    saveColor(particleColor.value, 'particleColor');
    if (window.applyParticles) window.applyParticles(particleType.value, particleIntensity.value, particleColor.value);
  };

  particleType.addEventListener("change", () => updateParts(true));
  particleIntensity.addEventListener("input", () => updateParts(false));
  particleColor.addEventListener("input", () => updateParts(false));

  dynamicHealthToggle.addEventListener("change", (e) => {
    saveColor(e.target.checked ? 'true' : 'false', 'dynamicHealth');
    if (window.checkHealth) window.checkHealth();
  });

  healthOrbToggle.addEventListener("change", (e) => {
    saveColor(e.target.checked ? 'true' : 'false', 'healthOrb');
    if (window.checkHealth) window.checkHealth();
  });

  rarityAurasToggle.addEventListener("change", (e) => {
    saveColor(e.target.checked ? 'true' : 'false', 'rarityAuras');
    if (window.applyRarityAuras) window.applyRarityAuras();
  });

  const updateChecks = () => {
    saveColor(checkboxColor.value, 'checkboxColor');
    saveColor(checkboxGlow.value, 'checkboxGlow');
    saveColor(checkboxShape.value, 'checkboxShape');
    if (window.applyCheckboxTheming) window.applyCheckboxTheming(checkboxColor.value, checkboxGlow.value, checkboxShape.value);
  };

  checkboxColor.addEventListener("input", updateChecks);
  checkboxGlow.addEventListener("input", updateChecks);
  checkboxShape.addEventListener("change", updateChecks);

  fontSelect.addEventListener("change", (e) => {
    saveColor(e.target.value, 'customFont');
    if (window.applyFont) window.applyFont(e.target.value);
  });

  readabilityToggle.addEventListener("change", (e) => {
    saveColor(e.target.checked ? 'true' : 'false', 'readabilityMode');
    // Re-apply accent to update readability CSS
    const color = sidebar.querySelector("#colorInputAc").value;
    if (window.applyAccentColor) window.applyAccentColor(color);
  });

  sidebar.querySelector("#resetFont").addEventListener("click", () => {
    fontSelect.value = "default";
    saveColor("default", "customFont");
    if (window.applyFont) window.applyFont("default");
  });

  sidebar.querySelector("#resetCheckboxes").addEventListener("click", () => {
    const characterID = getCharacterID();
    if (characterID) {
      chrome.storage.local.remove([`checkboxColor_${characterID}`, `checkboxGlow_${characterID}`, `checkboxShape_${characterID}`], () => {
        location.reload();
      });
    }
  });

  sidebar.querySelector("#resetParticles").addEventListener("click", () => {
    particleType.value = "none";
    saveColor("none", "particleType");
    if (window.applyParticles) window.applyParticles("none");
  });

  sidebar.querySelector("#colorInputAc").addEventListener("input", (e) => {
    const color = e.target.value + 'ff';
    saveColor(color, 'accent');
    applyAccentColor(color);
  });

  sidebar.querySelector("#colorText1").addEventListener("input", (e) => {
    saveColor(e.target.value, 'text1');
    applyTextColor(e.target.value, 1);
  });

  // Reset Buttons
  sidebar.querySelector("#removeColorBg").addEventListener("click", () => { removeColor("background"); location.reload(); });
  sidebar.querySelector("#removeColorHd").addEventListener("click", () => { removeColor("header"); location.reload(); });
  sidebar.querySelector("#removeColorBo").addEventListener("click", () => { removeColor("border"); location.reload(); });
  sidebar.querySelector("#removeColorAc").addEventListener("click", () => { removeColor("accent"); location.reload(); });
  sidebar.querySelector("#removeText1").addEventListener("click", () => { removeColor("text1"); location.reload(); });

  sidebar.querySelector("#resetBtn").addEventListener("click", () => {
    if (confirm("Remove all customizations?")) {
      ['background', 'header', 'border', 'accent', 'text1', 'boxStyle', 'portraitShape', 'customFont', 'dynamicHealth', 'readabilityMode'].forEach(removeColor);
      removeBackdrop();
      removeFrame();
      location.reload();
    }
  });
}

function updateColorPickers(parent = document) {
  const characterID = getCharacterID();
  if (!characterID) return;

  const storage = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;
  const types = ['background', 'header', 'border', 'accent', 'text1', 'particleType', 'particleIntensity', 'particleColor', 'dynamicHealth', 'healthOrb', 'rarityAuras', 'inventoryGrid', 'checkboxColor', 'checkboxGlow', 'checkboxShape', 'portraitShape', 'customFont', 'boxStyle', 'readabilityMode'];
  
  types.forEach(type => {
    storage.get(`${type}_${characterID}`).then(data => {
      const val = data[`${type}_${characterID}`];
      if (!val) return;

      if (type === 'readabilityMode') {
        const toggle = parent.querySelector("#readabilityToggle");
        if (toggle) toggle.checked = val === 'true';
        return;
      }
      if (type === 'inventoryGrid') {
        const toggle = parent.querySelector("#inventoryGridToggle");
        if (toggle) toggle.checked = val === 'true';
        return;
      }
      if (type === 'healthOrb') {
        const toggle = parent.querySelector("#healthOrbToggle");
        if (toggle) toggle.checked = val === 'true';
        return;
      }
      if (type === 'rarityAuras') {
        const toggle = parent.querySelector("#rarityAurasToggle");
        if (toggle) toggle.checked = val === 'true';
        return;
      }
      if (type === 'boxStyle') {
        const select = parent.querySelector("#boxStyleSelect");
        if (select) select.value = val;
        return;
      }
      if (type === 'customFont') {
        const select = parent.querySelector("#fontSelect");
        if (select) select.value = val;
        return;
      }
      if (type === 'portraitShape') {
        const select = parent.querySelector("#portraitShapeSelect");
        if (select) select.value = val;
        return;
      }
      if (type === 'checkboxShape') {
        const select = parent.querySelector("#checkboxShape");
        if (select) select.value = val;
        return;
      }
      if (type === 'checkboxColor') {
        const input = parent.querySelector("#checkboxColor");
        if (input) input.value = val;
        return;
      }
      if (type === 'checkboxGlow') {
        const slider = parent.querySelector("#checkboxGlow");
        if (slider) slider.value = val;
        return;
      }
      if (type === 'dynamicHealth') {
        const toggle = parent.querySelector("#dynamicHealthToggle");
        if (toggle) toggle.checked = val === 'true';
        return;
      }

      if (type === 'particleType') {
        const select = parent.querySelector("#particleEffectType");
        if (select) select.value = val;
        return;
      }
      if (type === 'particleIntensity') {
        const slider = parent.querySelector("#particleIntensity");
        if (slider) slider.value = val;
        return;
      }
      if (type === 'particleColor') {
        const pColor = parent.querySelector("#particleColor");
        if (pColor) pColor.value = val;
        return;
      }

      const hex = val.slice(0, 7);
      const alpha = val.length > 7 ? parseInt(val.slice(7, 9), 16) : 255;
      
      let inputId;
      switch(type) {
        case 'background': inputId = 'colorInputBg'; break;
        case 'header': inputId = 'colorInputHd'; break;
        case 'border': inputId = 'colorInputBo'; break;
        case 'accent': inputId = 'colorInputAc'; break;
        case 'text1': inputId = 'colorText1'; break;
        case 'text0': inputId = 'colorText0'; break;
      }

      const input = parent.querySelector(`#${inputId}`);
      if (input) input.value = hex;

      if (type === 'background' || type === 'header' || type === 'border') {
        const alphaInput = parent.querySelector(`#${inputId.replace('color', 'alpha')}`);
        if (alphaInput) alphaInput.value = Math.round((alpha / 255) * 100);
      }
    });
  });
}

function removeBackdrop() {
  const id = window.getCharacterID ? window.getCharacterID() : null;
  if (id) chrome.storage.local.remove(`backdrop_${id}`);
}

function removeFrame() {
  const id = window.getCharacterID ? window.getCharacterID() : null;
  if (id) chrome.storage.local.remove(`frame_${id}`);
}

function removeColor(type) {
  const id = window.getCharacterID ? window.getCharacterID() : null;
  if (id) chrome.storage.local.remove(`${type}_${id}`);
}

window.injectFileSelector = injectFileSelector;
window.updateColorPickers = updateColorPickers;
