function injectFileSelector() {
    console.log("Injecting sidebar...");
  
    // Check if the sidebar already exists
    const existingSidebar = document.getElementById("backdrop-selector");
    if (existingSidebar) {
      // console.log("⚠️ Sidebar already exists. Toggling visibility...");
      // Use consistent transform values (percentages in this case)
      const isVisible = existingSidebar.style.transform === "translateX(0%)";
      existingSidebar.style.transform = isVisible ? "translateX(100%)" : "translateX(0%)";
      return;
    }
  
    // Otherwise, create the sidebar container
    // console.log("⚙️ Creating sidebar...");
    const container = document.createElement("div");
    container.id = "backdrop-selector";
    container.style.pointerEvents = "none";
    container.style.top = "3.5vh";
    container.className = "ct-primary-box";
    container.style.zIndex = "99999";
    container.style.position = "absolute";
    container.style.right = "0";
    container.style.width = "300px";
    container.style.padding = "20px";
    container.style.height = "calc(130vh - 3.5vh)";
   container.style.maxHeight = "calc(100vh - 3.5vh)";
   container.style.boxSizing = "border-box";
   container.style.overflowY = "auto";
    container.style.borderRadius = "0";
    container.style.transform = "translateX(100%)"; // Start off-screen
    container.style.transition = "transform 0.5s ease"; // Add transition for sliding effect
  
    // Create a container for the sidebar HTML
    const innerCon = document.createElement("div");
    innerCon.id = "backdrop-selector-iframe";
    innerCon.style.width = "100%";
    innerCon.style.height = "100%";
    innerCon.style.top = "20px";
    innerCon.style.border = "none";
    innerCon.style.overflow = "hidden";
  
    // Fetch and inject the external HTML content
    const url = chrome.runtime.getURL("sidebar.html");
    fetch(url)
      .then(response => response.text())
      .then(html => {
        innerCon.innerHTML = html;
  
        // Inject the CSS file into the sidebar
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("styles.css");
        document.head.appendChild(link);
  
        // Collapsible Section Logic
        const svgDown = document.querySelector(".ddbc-svg.down");
        const svgCenter = document.querySelector(".ddbc-svg.center");
        const collapsibles = container.querySelectorAll(".collapsible");
        collapsibles.forEach(coll => {
          coll.style.cursor = "pointer";
          coll.style.padding = "10px";
          coll.style.width = "100%";
          coll.style.border = "none";
          coll.style.textAlign = "left";
          coll.style.outline = "none";
          coll.style.fontSize = "16px";
          coll.style.borderBottom = "1px solid rgba(255, 255, 255, 0.2)";
          coll.style.marginBottom = "10px";
          coll.addEventListener("click", function () {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            content.classList.toggle("active");
  
            // Toggle height animation
            const currentBottom = window.getComputedStyle(svgDown)['bottom'];
            if (content.style.maxHeight && content.style.maxHeight !== "0px") {
              content.style.maxHeight = "0";
              if (svgDown) {
                let bottom = parseInt(currentBottom) + (content.scrollHeight - 14);
                if (bottom > 264) {
                  bottom = 264;
                }
                svgDown.style.bottom = bottom + "px";
                if ((bottom >=203)&&svgCenter){
                  svgCenter.style.display = "none"
                }
              }
            } 
            else {
              content.style.maxHeight = content.scrollHeight + "px";
              if (svgDown) {
                let bottom = parseInt(currentBottom) - (content.scrollHeight - 14);
                if (bottom < -110) {
                  bottom = -110;
                }
                svgDown.style.bottom = bottom + "px";
                if ((bottom <203)&&svgCenter){
                  svgCenter.style.display = "block"
                }
              }
            }
          });
        });
  
        // Rainbow mode button event listener
        const rainbowModeBtn = document.getElementById('rainbowModeBtn');
        if (rainbowModeBtn) {
          rainbowModeBtn.addEventListener('click', function () {
            let currentValue = this.value;
            if (currentValue === '1') {
              startRainbowMode();
            } else {
              stopRainbowMode();
              this.style.backgroundColor = '#3b353688';
            }
            this.value = currentValue === '1' ? '0' : '1';
            this.textContent = this.value === '1' ? 'Party Time?' : 'Party Time!';
          });
        }
  
        // Re-bind event listeners for controls after HTML injection
        const fileInputBd = innerCon.querySelector("#backdropFileInput");
         const frameFileInputBd = innerCon.querySelector("#frameFileInput");
        const colorInputBg = innerCon.querySelector("#colorInputBg");
        const alphaInputBg = innerCon.querySelector("#alphaInputBg");
        const colorInputHd = innerCon.querySelector("#colorInputHd");
        const alphaInputHd = innerCon.querySelector("#alphaInputHd");
        const colorInputBo = innerCon.querySelector("#colorInputBo");
        const alphaInputBo = innerCon.querySelector("#alphaInputBo");
        const colorInputAc = innerCon.querySelector("#colorInputAc");
        const colorText1 = innerCon.querySelector("#colorText1");
        const colorText0 = innerCon.querySelector("#colorText0");
  
        const saveBtnBd = innerCon.querySelector("#saveBackdropBtn");
        const frameSaveBtnBd = innerCon.querySelector("#saveFrameBtn");

        const removeBtnBd = innerCon.querySelector("#removeBackdropBtn");
      const frameRemoveBtnBd = innerCon.querySelector("#removeFrameBtn");
        const removeBtnBg = innerCon.querySelector("#removeColorBg");
         const removeBtnHd = innerCon.querySelector("#removeColorHd");
        const removeBtnBo = innerCon.querySelector("#removeColorBo");
        const removeBtnAc = innerCon.querySelector("#removeColorAc");
        const removeText1 = innerCon.querySelector("#removeText1");
        const removeText0 = innerCon.querySelector("#removeText2");
        
        const resetBtn = innerCon.querySelector("#resetBtn");

        const closeArrowBtn = innerCon.querySelector("#closeArrowSide");
        if (closeArrowBtn) {
          closeArrowBtn.addEventListener("click", () => {
            container.style.transform = "translateX(100%)"; // Slide out
          });
        }
  
        // Set current colors from existing DOM elements
        const rgbToHex = rgb => "#" + rgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        const ddbcBox = document.querySelector('.ddbc-box-background:first-child');
        if (ddbcBox) {
          const allChildren = Array.from(ddbcBox.querySelectorAll("path, polygon"));
          if (allChildren.length > 0) {
            window.currentColorBg = allChildren[0].getAttribute("fill");
            window.currentColorBo = allChildren[allChildren.length - 1].getAttribute("fill");
          }
        }
        window.currentColorAc = window.getComputedStyle(document.documentElement).getPropertyValue('--theme-color');
        window.currentColorText1 = rgbToHex(window.getComputedStyle(document.querySelector("#character-tools-target > div > div.ct-character-sheet__inner > div > div.ct-quick-info > div.ct-quick-info__box.ct-quick-info__box--speed > section > div.ct-speed-box__box-value.ct-speed-box__box-value > span > span:nth-child(1)")).color);
        window.currentColorText0 = rgbToHex(window.getComputedStyle(document.querySelector("#character-tools-target > div > div.ct-character-sheet__inner > div > div.ct-subsections > div.ct-subsection.ct-subsection--skills > section > div.ct-skills.ct-skills > div.ct-skills__header > div.ct-skills__col--modifier > span")).color);
  
        // Function to update color pickers with stored values
        function updateColorPickers() {
          try{const colorInputBg = document.getElementById("colorInputBg");
            const colorInputHd = document.getElementById("colorInputHd");
          const colorInputBo = document.getElementById("colorInputBo");
          const colorInputAc = document.getElementById("colorInputAc");
          const colorText1 = document.getElementById("colorText1");
          const colorText0 = document.getElementById("colorText0");
          if (colorInputBg && window.currentColorBg) {
            const bgColorWithoutAlpha = window.currentColorBg.length > 7 ? window.currentColorBg.slice(0, 7) : window.currentColorBg;
            colorInputBg.value = bgColorWithoutAlpha;
          }
          if (colorInputHd && window.currentColorHd) {
            const hdColorWithoutAlpha = window.currentColorHd.length > 7 ? window.currentColorHd.slice(0, 7) : window.currentColorHd;
            colorInputHd.value = hdColorWithoutAlpha;
          }
          if (colorInputBo && window.currentColorBo) {
            const boColorWithoutAlpha = window.currentColorBo.length > 7 ? window.currentColorBo.slice(0, 7) : window.currentColorBo;
            colorInputBo.value = boColorWithoutAlpha;
          }
          if (colorInputAc && window.currentColorAc) {
            const acColorWithoutAlpha = window.currentColorAc.length > 7 ? window.currentColorAc.slice(0, 7) : window.currentColorAc;
            colorInputAc.value = acColorWithoutAlpha;
          }
          if (colorText1 && window.currentColorText1) {
            const text1ColorWithoutAlpha = window.currentColorText1.length > 7 ? window.currentColorText1.slice(0, 7) : window.currentColorText1;
            colorText1.value = text1ColorWithoutAlpha;
          }
          if (colorText0 && window.currentColorText0) {
            const text0ColorWithoutAlpha = window.currentColorText0.length > 7 ? window.currentColorText0.slice(0, 7) : window.currentColorText0;
            colorText0.value = text0ColorWithoutAlpha;
          }
          }catch(erro){console.error("figa non sto capendo: "+error)};
        }
        window.updateColorPickers = updateColorPickers;
        setTimeout(updateColorPickers, 100);
  
        // Attach event listeners for controls
        if (saveBtnBd && fileInputBd) {
          saveBtnBd.addEventListener("click", () => {
            if (typeof saveBackdrop === "function") {
              saveBackdrop(fileInputBd);
            } else {
              console.error("saveBackdrop function not found");
            }
          });
        }
        if (frameSaveBtnBd && frameFileInputBd) {
          frameSaveBtnBd.addEventListener("click", () => {
            if (typeof saveFrame === "function") {
              saveFrame(frameFileInputBd);
            } else {
              console.error("save Frame function not found");
            }
          });
        }
        if (colorInputBg && alphaInputBg) {
          // console.log("🎨 Color inputs detected. Attaching event listeners...");
          colorInputBg.addEventListener("input", updateBackgroundColor);
          alphaInputBg.addEventListener("input", updateBackgroundColor);
        } else {
          console.error("❌ Color inputs not found in the DOM.");
        }
        if (colorInputHd && alphaInputHd) {
          // console.log("🎨 Color inputs detected. Attaching event listeners...");
          colorInputHd.addEventListener("input", updateHeaderColor);
          alphaInputHd.addEventListener("input", updateHeaderColor);
        } else {
          console.error("❌ Color inputs not found in the DOM.");
        }
        if (colorInputBo && alphaInputBo) {
          // console.log("🎨 Color inputs detected. Attaching event listeners...");
          colorInputBo.addEventListener("input", updateBorderColor);
          alphaInputBo.addEventListener("input", updateBorderColor);
        } else {
          console.error("❌ Color inputs not found in the DOM.");
        }
        if (colorInputAc) {
          // console.log("🎨 Color inputs detected. Attaching event listeners...");
          colorInputAc.addEventListener("input", updateAccentColor);
        } else {
          console.error("❌ Color inputs not found in the DOM.");
        }
        if (colorText1) {
          colorText1.addEventListener("input", ()=>{updateTextColor(1)});
        } else {
          console.error("❌ Color inputs not found in the DOM.");
        }
        if (colorText0) {
          // console.log("🎨 Color inputs detected. Attaching event listeners...");
          colorText0.addEventListener("input", ()=>{updateTextColor(0)});
        } else {
          console.error("❌ Color inputs not found in the DOM.");
        }
        if (removeBtnBd) {
          removeBtnBd.addEventListener("click", () => {
            if (typeof removeBackdrop === "function") {
              removeBackdrop();
            }
            location.reload();
          });
        }
        if (frameRemoveBtnBd) {
          frameRemoveBtnBd.addEventListener("click", () => {
            if (typeof removeFrame === "function") {
              removeFrame();
            }
            location.reload();
          });
        }
        if (removeBtnBg) {
          removeBtnBg.addEventListener("click", () => {
            if (typeof removeColor === "function") {
              removeColor("background");
              location.reload();
            }
          });
        }
        if (removeBtnHd) {
          removeBtnHd.addEventListener("click", () => {
            if (typeof removeColor === "function") {
              removeColor("header");
              location.reload();
            }
          });
        }
        if (removeBtnBo) {
          removeBtnBo.addEventListener("click", () => {
            if (typeof removeColor === "function") {
              removeColor("border");
              location.reload();
            }
          });
        }
        if (removeBtnAc) {
          removeBtnAc.addEventListener("click", () => {
            if (typeof removeColor === "function") {
              removeColor("accent");
              location.reload();
            }
          });
        }
        if (removeText1) {
          removeText1.addEventListener("click", () => {
            if (typeof removeColor === "function") {
              removeColor("text1");
              location.reload();
            }
          });
        }
        if (removeText0) {
          removeText0.addEventListener("click", () => {
            if (typeof removeColor === "function") {
              removeColor("text0");
              location.reload();
            }
          });
        }
        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to remove all the customizations?")) {
              if (typeof removeColor === "function") {
                removeColor("background");
               removeColor("header");
                removeColor("border");
                removeColor("accent");
                removeColor("text1");
                removeColor("text0");
              }
              if (typeof removeBackdrop === "function") {
                removeBackdrop();
              }
              if (typeof removeFrame === "function") {
                removeFrame();
              }
              location.reload();
            }
          });
        }
  
        // Functions to update colors (assume saveColor, applyBackgroundColor, applyBorderColor, applyAccentColor are defined)
        function updateBackgroundColor() {
          const hex = colorInputBg.value;
          const alpha = Math.round((alphaInputBg.value / 100) * 255);
          const alphaHex = alpha.toString(16).padStart(2, '0');
          const hexWithAlpha = `#${hex.slice(1)}${alphaHex}`;
          // console.log(`🎨 Chosen Color: ${hexWithAlpha}`);
          saveColor(hexWithAlpha, 'background');
          applyBackgroundColor(hexWithAlpha);
        }
         function updateHeaderColor() {
          const hex = colorInputHd.value;
          const alpha = Math.round((alphaInputHd.value / 100) * 255);
          const alphaHex = alpha.toString(16).padStart(2, '0');
          const hexWithAlpha = `#${hex.slice(1)}${alphaHex}`;
          // console.log(`🎨 Chosen Color: ${hexWithAlpha}`);
          saveColor(hexWithAlpha, 'header');
          applyHeaderBackgroundColor(hexWithAlpha);
        }
        function updateBorderColor() {
          const hex = colorInputBo.value;
          const alpha = Math.round((alphaInputBo.value / 100) * 255);
          const alphaHex = alpha.toString(16).padStart(2, '0');
          const hexWithAlpha = `#${hex.slice(1)}${alphaHex}`;
          // console.log(`🎨 Chosen Color: ${hexWithAlpha}`);
          saveColor(hexWithAlpha, 'border');
          applyBorderColor(hexWithAlpha);
        }
        function updateAccentColor() {
          const hex = colorInputAc.value;
          const hexWithAlpha = `#${hex.slice(1)}ff`;
          // console.log(`🎨 Chosen Color: ${hexWithAlpha}`);
          saveColor(hexWithAlpha, 'accent');
          applyAccentColor(hexWithAlpha);
        }
        function updateTextColor(num) {
          const hex = (num) ? colorText1.value : colorText0.value;
          // console.log(`text${(num)}`)
          saveColor(hex, `text${(num)}`);
          applyTextColor(hex, num);
        }
      })
      .catch(err => console.error("Error fetching sidebar:", err));
  
    container.appendChild(innerCon);
    document.body.appendChild(container);
  
    // Trigger sliding animation on injection
    setTimeout(() => {
      container.style.transform = "translateX(0%)"; // Slide in
    }, 50);
  }
  
window.injectFileSelector = injectFileSelector