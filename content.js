// Detect whether to use `browser` or `chrome` API
const storage = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;

function debounce(func, timeout) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    }
}
window.debounce = debounce

function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 1000);
    }
}
window.waitForElement = waitForElement

const parentSelector = "#character-tools-target > div > div.ct-character-sheet__inner > div > div.ct-character-header-desktop";
const normalBtnSelector = "#character-tools-target > div > div.ct-character-sheet__inner > div > div.ct-character-header-desktop > div.ct-character-header-desktop__group.ct-character-header-desktop__group--short-rest > div";
const injectedBtnId = "customizerBtn";

let injectionPending  = false
function injectButton(){
    if (document.getElementById(injectedBtnId) || injectionPending) return;
    
    const container = document.querySelector(parentSelector);
    if (!container) return;

    injectionPending = true;
    
    // Double check before fetching
    if(document.getElementById(injectedBtnId)) {
        injectionPending = false;
        return;
    }

    const url = chrome.runtime.getURL("button.html");
    fetch(url)
        .then(response => response.text())
        .then(htmlContent => {           
            if(!document.getElementById(injectedBtnId)){
                const temp = document.createElement('div');
                temp.innerHTML = htmlContent.trim();
                const newElement = temp.firstElementChild;
                
                // Re-verify container and ID one last time
                const latestContainer = document.querySelector(parentSelector);
                if (latestContainer && !document.getElementById(injectedBtnId)) {
                    latestContainer.insertBefore(newElement, latestContainer.childNodes[2]);
                    
                    // Add Click Listener to open the customizer
                    newElement.addEventListener("click", () => {
                        injectFileSelector();
                    });

                    const normalBtn = document.querySelector(normalBtnSelector);
                    if (normalBtn) {
                        const normalBtnColor = window.getComputedStyle(normalBtn).borderColor;
                        const injectedBtn = document.getElementById("customizerBtn");
                        const injectedBtnSvg = document.getElementById("customizerBtnSvg");
                        if (injectedBtn && injectedBtnSvg) {
                            injectedBtn.style.borderColor = normalBtnColor;
                            injectedBtnSvg.style.fill = normalBtnColor;
                        }
                    }
                }
            }
            injectionPending = false;
        })
        .catch(error => {
            console.error('Error loading button:', error);
            injectionPending = false;
        });
};

// Extract character ID from URL
const getCharacterID = () => {
    const match = window.location.href.match(/\/characters\/(\d+)/);
    return match ? match[1] : null;
};
window.getCharacterID = getCharacterID;

function getFromStorage(key){
  if (typeof browser !== "undefined") return browser.storage.local.get(key);
  return new Promise((resolve, reject) => {
    try { chrome.storage.local.get(key, resolve); }
    catch (e) { reject(e); }
  });
}

// ----- Apply Functions -----

function applyBackdrop() {
    const characterID = getCharacterID();
    if (!characterID) return;

    getFromStorage(`backdrop_${characterID}`).then((data) => {
        const backdropData = data[`backdrop_${characterID}`];
        if (!backdropData) return;

        let bodyElement = document.querySelector("body.body-rpgcharacter-sheet");
        if (bodyElement) {
            bodyElement.style.setProperty("background-image", `url(${backdropData})`, "important");
            bodyElement.style.setProperty("background-size", "cover", "important");
            bodyElement.style.setProperty("background-position", "center center", "important");
            bodyElement.style.setProperty("background-repeat", "no-repeat", "important");
            bodyElement.style.setProperty("background-attachment", "fixed", "important");
        }
    });
};

function applyFrame(){
   const characterID = getCharacterID();
   if (!characterID) return;

   getFromStorage(`frame_${characterID}`).then((data) => {
      const frameData = data[`frame_${characterID}`];
      if (!frameData) return;

      const avatarContainer = document.querySelector(".ddbc-character-avatar");
      if (avatarContainer) {
         let overlay = avatarContainer.querySelector(".custom-frame-overlay");
         if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "custom-frame-overlay";
            avatarContainer.appendChild(overlay);
         }
         overlay.style.backgroundImage = `url(${frameData})`;
         
         const originalFrame = avatarContainer.querySelector(".ddbc-character-avatar__frame");
         if (originalFrame) originalFrame.style.opacity = "0";
         
         // Re-apply shape to overlay
         storage.get(`portraitShape_${characterID}`).then(sData => {
            if (sData[`portraitShape_${characterID}`]) applyPortraitShape(sData[`portraitShape_${characterID}`]);
         });
      }
   });
}

function applyPortraitShape(shape = 'circle') {
    const avatar = document.querySelector(".ddbc-character-avatar__portrait");
    const container = document.querySelector(".ddbc-character-avatar");
    const overlay = document.querySelector(".custom-frame-overlay");
    
    if (!avatar) return;

    let clip = 'none';
    let radius = '0';

    switch(shape) {
        case 'square':
            clip = 'inset(0% 0% 0% 0%)';
            radius = '0';
            break;
        case 'rounded':
            clip = 'inset(0% 0% 0% 0% round 15%)';
            radius = '15%';
            break;
        case 'diamond':
            clip = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
            radius = '0';
            break;
        case 'hexagon':
            clip = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            radius = '0';
            break;
        case 'circle':
        default:
            clip = 'circle(50% at 50% 50%)';
            radius = '50%';
            break;
    }

    avatar.style.clipPath = clip;
    avatar.style.borderRadius = radius;
    avatar.style.webkitClipPath = clip;

    if (overlay) {
        overlay.style.clipPath = clip;
        overlay.style.webkitClipPath = clip;
    }
}
window.applyPortraitShape = applyPortraitShape;

// ----- Custom Fonts -----
function applyFont(fontName) {
    let linkEl = document.getElementById('customizer-font-link');
    if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = 'customizer-font-link';
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
    }

    let styleEl = document.getElementById('customizer-font-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'customizer-font-style';
        document.head.appendChild(styleEl);
    }

    if (fontName === 'default' || !fontName) {
        linkEl.href = '';
        styleEl.innerHTML = '';
        return;
    }

    // Load from Google Fonts
    const fontUrl = fontName.replace(' ', '+');
    linkEl.href = `https://fonts.googleapis.com/css2?family=${fontUrl}:wght@400;700&display=swap`;

    // Apply aggressively to sheet
    styleEl.innerHTML = `
        .ct-character-sheet, 
        .ct-character-sheet *,
        .ddbc-tooltip,
        .ct-sidebar__portal {
            font-family: "${fontName}", serif !important;
        }
    `;
}
window.applyFont = applyFont;

function injectPatterns() {
    if (document.getElementById('customizer-patterns')) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = 'customizer-patterns';
    svg.setAttribute("style", "position: absolute; width: 0; height: 0; overflow: hidden;");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `
        <defs>
            <pattern id="pattern-parchment" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
                <image href="${chrome.runtime.getURL('parchment.jpg')}" width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                <rect width="1" height="1" fill="rgba(0,0,0,0.2)" />
            </pattern>
            <pattern id="pattern-stone" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
                <image href="${chrome.runtime.getURL('stone.png')}" width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                <rect width="1" height="1" fill="rgba(0,0,0,0.6)" />
            </pattern>
        </defs>
    `;
    document.body.appendChild(svg);
}

function applyBackgroundColor(newColor) {
    const characterID = getCharacterID();
    const color = newColor.slice(0, 7);
    document.documentElement.style.setProperty("--box-bg-color", newColor);
    injectPatterns();

    storage.get(`boxStyle_${characterID}`).then(data => {
        const style = data[`boxStyle_${characterID}`] || 'solid';
        const boxes = document.querySelectorAll('.ddbc-box-background, .InspirationBoxSvg-Sheet_Desktop_Static');
        
        boxes.forEach(box => {
            const allChildren = Array.from(box.querySelectorAll("path, polygon"));
            const parent = box.parentElement;
            
            // RESET
            box.style.backdropFilter = 'none';
            box.style.webkitBackdropFilter = 'none';
            box.style.clipPath = 'none';
            parent.style.backgroundImage = 'none';
            parent.style.backgroundSize = 'cover';
            
            // Remove any existing frosted layers from the parent to prevent stacking/displacement
            const oldLayer = parent.querySelector('.frosted-glass-layer');
            if (oldLayer) oldLayer.remove();

            if (allChildren[0]) {
                allChildren[0].setAttribute("fill", newColor);
                allChildren[0].style.visibility = 'visible';
            }

            if (style === 'frosted') {
                if (allChildren[0]) {
                    const d = allChildren[0].getAttribute("d") || 
                              (allChildren[0].getAttribute("points") ? "M " + allChildren[0].getAttribute("points").replace(/,/g, ' ').trim() + " Z" : null);
                    
                    if (d) {
                        // Create a specific blur layer as a sibling to the SVG
                        const blurLayer = document.createElement('div');
                        blurLayer.className = 'frosted-glass-layer';
                        blurLayer.style.position = 'absolute';
                        blurLayer.style.inset = '0';
                        blurLayer.style.zIndex = '0'; 
                        blurLayer.style.pointerEvents = 'none';
                        blurLayer.style.backdropFilter = 'blur(12px) brightness(1.1)';
                        blurLayer.style.webkitBackdropFilter = 'blur(12px) brightness(1.1)';
                        blurLayer.style.clipPath = `path("${d}")`;
                        
                        if (window.getComputedStyle(parent).position === 'static') {
                            parent.style.position = 'relative';
                        }
                        
                        // Insert behind everything in the parent
                        parent.insertBefore(blurLayer, parent.firstChild);
                        
                        // Ensure original SVG path has the correct tint and transparency
                        allChildren[0].setAttribute("fill", newColor);
                    }
                }
            } else if (style === 'parchment') {
                if (allChildren[0]) {
                    allChildren[0].setAttribute("fill", 'url(#pattern-parchment)');
                } else {
                    parent.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${chrome.runtime.getURL('parchment.jpg')})`;
                }
            } else if (style === 'stone') {
                if (allChildren[0]) {
                    allChildren[0].setAttribute("fill", 'url(#pattern-stone)');
                } else {
                    parent.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${chrome.runtime.getURL('stone.png')})`;
                }
            }

            if (allChildren.length === 3 && allChildren[1]) {
                allChildren[1].setAttribute("fill", newColor);
            }
        });
    });

    document.querySelectorAll(".styles_input__coHiS").forEach(el => {
        el.style.setProperty("background-color", color, "important");
    });
    
    document.querySelectorAll('.bg').forEach(el => {
        el.setAttribute("style", "fill:" + color + " !important;");
    });
}
window.applyBackgroundColor = applyBackgroundColor;

function applyHeaderColor(newColor) {
  const color = newColor.slice(0, 7);
  const headerBoxes = document.querySelectorAll('.ct-character-header-desktop');
  headerBoxes.forEach(el => {
    el.style.setProperty("background", newColor, "important");
    el.style.setProperty("border", "none", "important");
    el.style.setProperty("margin-top", "0", "important");
    el.style.backdropFilter = 'none';
  });

  let style = document.getElementById('ddbHeaderOverlayStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'ddbHeaderOverlayStyle';
    document.head.appendChild(style);
  }
   style.textContent = `
    /* Eliminate Top Gap */
    .ct-character-sheet,
    .ct-character-sheet__inner,
    #site-main {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    /* Target the primary header and its background layers */
    .ct-character-header-desktop,
    .ct-character-header-desktop__background {
        background: ${newColor} !important;
        margin-top: 0 !important;
        border: none !important;
    }

    /* Target potential grey boxes/dividers below the header */
    .ct-character-header-desktop__group {
        border-color: rgba(255,255,255,0.1) !important;
    }

    /* The bleed fix for side gaps and top gaps */
    .ct-character-header-desktop::before,
    .ct-character-header-desktop::after {
      content: "" !important;
      position: absolute !important;
      top: -50px !important; /* Reach up to cover the site-main gap */
      left: -50vw !important;
      right: -50vw !important;
      bottom: 0 !important;
      background: ${newColor} !important;
      background-image: none !important;
      opacity: 1 !important;
      z-index: -1 !important;
    }

    /* Force the character sheet container to be seamless */
    .ct-character-sheet::before {
        display: none !important; /* Hide original theme backgrounds */
    }
  `;
}
window.applyHeaderColor = applyHeaderColor;

function applyBorderColor(newColor) {
    const color = newColor.slice(0, 7);
    const boxes = document.querySelectorAll('.ct-attunement__group-items, .ddbc-box-background, .InspirationBoxSvg-Sheet_Desktop_Static, .ct-box-background');
    boxes.forEach(box => {
        const allChildren = Array.from(box.querySelectorAll("path, polygon"));
        const element = allChildren[allChildren.length - 1];        
        if (element) element.setAttribute("fill", newColor);
    });

    // Global CSS Overrides for complex components
    let styleEl = document.getElementById('customizer-border-overrides');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'customizer-border-overrides';
        document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
        /* Proficiency & Expertise Circles/Icons */
        .ddbc-proficiency-svg circle,
        .ddbc-proficiency-svg path,
        [id*="ProficiencySvg"] circle,
        [id*="ProficiencySvg"] path,
        [id*="ProficiencyDoubleSvg"] circle,
        [id*="ProficiencyDoubleSvg"] path,
        .ct-proficiency-groups__group-item-indicator, 
        .ddbc-proficiency-indicator {
            fill: ${color} !important;
            background-color: ${color} !important;
            border-color: ${color} !important;
        }

        /* Heroic Inspiration / Sun Icons */
        .ddbc-inspiration-token-svg path,
        .ct-inspiration__icon svg path,
        .ct-heroic-inspiration__icon svg path {
            fill: ${color} !important;
        }

        /* Top Menu Buttons (Short Rest, Long Rest, etc) */
        .ct-character-header-desktop__button {
            border-color: ${color} !important;
        }
        .ct-character-header-desktop__button svg path {
            fill: ${color} !important;
        }

        /* Modifier Box Borders (Skills, Saves, Abilities) */
        .ct-skills__col--modifier,
        .ct-saving-throws__col--modifier,
        .ct-ability-summary__primary,
        .ct-ability-summary__secondary,
        .ct-health-summary__hp-item {
            border-color: ${color} !important;
        }

        /* Links and themed buttons */
        .ddbc-link,
        .ddbc-theme-link,
        .ct-actions__manage-custom-link,
        .ct-theme-button--outline {
            color: ${color} !important;
            border-color: ${color} !important;
        }

        .ct-theme-button--is-enabled {
            background-color: ${color} !important;
            border-color: ${color} !important;
        }

        /* Filled Theme Buttons (Cast, Attack, etc) */
        .ct-theme-button--filled {
            background-color: ${color} !important;
            border-color: ${color} !important;
            color: white !important;
        }

        .ct-theme-button--filled:hover {
            filter: brightness(1.2);
        }

        /* Tab / Group Headers */
        .ct-content-group__header,
        .ct-sidebar__header,
        .ct-creature-pane__header {
            border-bottom-color: ${color} !important;
            color: ${color} !important;
        }

        .ct-content-group__header-content {
            color: ${color} !important;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Integrated Dice Containers */
        .integrated-dice__container {
            border-color: ${color} !important;
            box-shadow: inset 0 0 5px ${color}33 !important;
        }

        /* Modifier Sign Color (+/-) */
        .styles_labelSignColor__Klmbs,
        .styles_sign__NdR6X {
            color: ${color} !important;
        }

        /* Global themed paths */
        .ddbc-svg--themed path {
            fill: ${color} !important;
        }
    `;

    document.querySelectorAll(".content").forEach(bord => {
        bord.style.borderTop = "2px solid " + newColor;
        bord.style.borderBottom = "2px solid " + newColor;
    });
    
    document.querySelectorAll('.bo').forEach(el => {
        el.setAttribute("style", "fill:" + newColor + " !important;");
    });
}
window.applyBorderColor = applyBorderColor;

function applyAccentColor(newColor) {
    const characterID = getCharacterID();
    document.documentElement.style.setProperty("--theme-color", newColor);
    
    document.querySelectorAll('.ct-character-header-desktop__button').forEach(element => {
        element.style.borderColor = newColor;
    });

    const diceToolbar = document.querySelector('.dice-toolbar');
    if(diceToolbar){
        diceToolbar.style.setProperty('--dice-color', newColor, 'important');
    }

    // Accent-Tinted Text Logic (Global Tint)
    let tintStyle = document.getElementById('customizer-accent-tint');
    if (!tintStyle) {
        tintStyle = document.createElement('style');
        tintStyle.id = 'customizer-accent-tint';
        document.head.appendChild(tintStyle);
    }
    const tintColor = newColor.slice(0, 7) + 'cc'; // Slightly transparent
    tintStyle.innerHTML = `
        .ct-character-sheet__label, 
        .ddbc-character-sub-header,
        .ct-sidebar__header-label,
        .ct-ability-summary__label,
        .ct-skills__col--label,
        .ct-saving-throws__label {
            color: ${tintColor} !important;
        }
    `;

    // Global Readability Overrides - Now Conditional
    storage.get(`readabilityMode_${characterID}`).then(data => {
        const enabled = data[`readabilityMode_${characterID}`] === 'true';
        let styleEl = document.getElementById('customizer-readability-overrides');
        
        if (!enabled) {
            if (styleEl) styleEl.innerHTML = '';
            return;
        }

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'customizer-readability-overrides';
            document.head.appendChild(styleEl);
        }

        styleEl.innerHTML = `
            /* GLOBAL READABILITY - Focus on contrast shadows only, avoiding SVGs */
            .ct-character-sheet *:not(svg):not(path):not(circle):not(rect):not(polygon):not(image),
            .ct-sidebar__portal *:not(svg):not(path):not(circle):not(rect):not(polygon):not(image) {
                text-shadow: 1px 1px 1px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,0.5) !important;
            }

            /* Modifier Signs (+ / -) High Visibility */
            .styles_sign__NdR6X,
            .styles_labelSignColor__Klmbs,
            .ddbc-signed-number__sign,
            .ct-signed-number__sign {
                font-weight: 800 !important;
                color: white !important;
                text-shadow: 0px 0px 3px black, 1px 1px 2px black !important;
            }
        `;
    });
}
window.applyAccentColor = applyAccentColor;

function applyTextColor(newColor, num) {
    const styleId = 'globalTextColorStyle';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    // Targeted variables and selector to avoid breaking icons and rarity colors
    styleEl.innerHTML = `
        :root {
            --text-color-primary: ${newColor} !important;
            --text-color-secondary: ${newColor}aa !important;
            --text-color-0: ${newColor} !important;
            --text-color-1: ${newColor} !important;
            --text-color-2: ${newColor} !important;
            --text-color-3: ${newColor} !important;
        }
        .ct-character-sheet,
        .ct-character-sheet *:not(svg):not(path):not(circle):not(rect):not(polygon):not(image):not([class*="common"]):not([class*="rare"]):not([class*="legendary"]):not([class*="artifact"]):not([class*="uncommon"]),
        .ct-sidebar__portal,
        .ct-sidebar__portal *:not(svg):not(path):not(circle):not(rect):not(polygon):not(image):not([class*="common"]):not([class*="rare"]):not([class*="legendary"]):not([class*="artifact"]):not([class*="uncommon"]) { 
            color: ${newColor} !important;
        }
    `;
}
window.applyTextColor = applyTextColor;

function applyRarityAuras() {
    const characterID = getCharacterID();
    if (!characterID) return;

    storage.get(`rarityAuras_${characterID}`).then(data => {
        const enabled = data[`rarityAuras_${characterID}`] === 'true';
        let styleEl = document.getElementById('customizer-rarity-styles');
        
        if (!enabled) {
            if (styleEl) styleEl.innerHTML = '';
            return;
        }

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'customizer-rarity-styles';
            document.head.appendChild(styleEl);
        }

        styleEl.innerHTML = `
            /* Targets D&D Beyond's internal rarity classes using partial matching */
            
            /* Uncommon */
            [class*="uncommon"] {
                color: #1fc219 !important;
            }

            /* Rare */
            [class*="rare"]:not([class*="veryrare"]) {
                color: #0070dd !important;
            }

            /* Very Rare - Purple Glow */
            [class*="veryrare"] { 
                color: #a335ee !important;
                text-shadow: 0 0 8px #a335ee, 0 0 12px #a335ee66, 1px 1px 1px black !important;
                font-weight: bold !important;
                animation: legendary-text-pulse 2s infinite alternate !important;
            }

            /* Legendary - Gold/Orange Pulse */
            [class*="legendary"] { 
                color: #ff8000 !important;
                text-shadow: 0 0 10px #ff8000, 0 0 15px #ff800066, 1px 1px 1px black !important;
                font-weight: bold !important;
                animation: legendary-text-pulse 2s infinite alternate !important;
            }

            /* Artifact - Prismatic Rainbow */
            [class*="artifact"] { 
                font-weight: bold !important;
                animation: artifact-text-rainbow 4s infinite linear !important;
                text-shadow: 0 0 10px rgba(255,255,255,0.4), 1px 1px 1px black !important;
            }

            @keyframes legendary-text-pulse {
                from { text-shadow: 0 0 8px #ff8000, 0 0 12px #ff800044, 1px 1px 1px black; }
                to { text-shadow: 0 0 12px #ff8000, 0 0 20px #ff800088, 1px 1px 1px black; }
            }

            @keyframes artifact-text-rainbow {
                0% { color: #e6cc80; }
                33% { color: #ff8000; }
                66% { color: #a335ee; }
                100% { color: #e6cc80; }
            }
        `;
    });
}
window.applyRarityAuras = applyRarityAuras;

// ----- Colorful RPG Icon Engine (Hand-Drawn Style) -----
const itemIconMap = {
    weapon: "https://wow.zamimg.com/images/wow/icons/large/inv_sword_04.jpg",
    dagger: "https://wow.zamimg.com/images/wow/icons/large/inv_weapon_shortblade_05.jpg",
    axe: "https://wow.zamimg.com/images/wow/icons/large/inv_axe_01.jpg",
    bow: "https://wow.zamimg.com/images/wow/icons/large/inv_weapon_bow_07.jpg",
    hammer: "https://wow.zamimg.com/images/wow/icons/large/inv_hammer_04.jpg",
    armor: "https://wow.zamimg.com/images/wow/icons/large/inv_chest_plate_12.jpg",
    shield: "https://wow.zamimg.com/images/wow/icons/large/inv_shield_04.jpg",
    potion: "https://wow.zamimg.com/images/wow/icons/large/inv_potion_51.jpg",
    scroll: "https://wow.zamimg.com/images/wow/icons/large/inv_scroll_03.jpg",
    wand: "https://wow.zamimg.com/images/wow/icons/large/inv_wand_01.jpg",
    gear: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_08.jpg",
    quiver: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_11.jpg",
    pouch: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_pouch_01.jpg",
    clothes: "https://wow.zamimg.com/images/wow/icons/large/inv_chest_cloth_17.jpg",
    torch: "https://game-icons.net/icons/ffffff/000000/1x1/lorc/torch.png",
    magic: "https://wow.zamimg.com/images/wow/icons/large/inv_jewelry_talisman_07.jpg",
    ring: "https://wow.zamimg.com/images/wow/icons/large/inv_jewelry_ring_03.jpg",
    default: "https://game-icons.net/icons/ffffff/000000/1x1/lorc/locked-chest.png"
};

function getIconForType(typeStr) {
    const t = typeStr.toLowerCase();
    if (t.includes('torch')) return itemIconMap.torch;
    if (t.includes('dagger')) return itemIconMap.dagger;
    if (t.includes('axe') || t.includes('halberd')) return itemIconMap.axe;
    if (t.includes('bow') || t.includes('crossbow')) return itemIconMap.bow;
    if (t.includes('hammer') || t.includes('mace') || t.includes('club')) return itemIconMap.hammer;
    if (t.includes('sword') || t.includes('rapier') || t.includes('scimitar') || t.includes('weapon')) return itemIconMap.weapon;
    if (t.includes('shield')) return itemIconMap.shield;
    if (t.includes('armor') || t.includes('plate') || t.includes('mail')) return itemIconMap.armor;
    if (t.includes('clothes') || t.includes('robe') || t.includes('tunic') || t.includes('outerwear')) return itemIconMap.clothes;
    if (t.includes('quiver') || t.includes('case')) return itemIconMap.quiver;
    if (t.includes('pouch')) return itemIconMap.pouch;
    if (t.includes('backpack') || t.includes('gear') || t.includes('kit') || t.includes('tools') || t.includes('container')) return itemIconMap.gear;
    if (t.includes('potion') || t.includes('vial') || t.includes('flask')) return itemIconMap.potion;
    if (t.includes('scroll')) return itemIconMap.scroll;
    if (t.includes('wand')) return itemIconMap.wand;
    if (t.includes('ring')) return itemIconMap.ring;
    if (t.includes('wondrous') || t.includes('magic') || t.includes('artifact')) return itemIconMap.magic;
    return itemIconMap.default;
}

function injectItemIcons() {
    const items = document.querySelectorAll('.ct-inventory-item');
    items.forEach(item => {
        if (item.querySelector('.custom-item-icon-img')) return;

        const nameEl = item.querySelector('.styles_itemName__xLCwW, .ct-inventory-item__name');
        const meta = item.querySelector('.ct-inventory-item__meta-item, .ct-attunement-slot__meta-item, .ct-attunement__meta-item');
        
        const searchText = (nameEl ? nameEl.innerText : "") + " " + (meta ? meta.innerText : "");
        const iconSrc = getIconForType(searchText);
        
        const img = document.createElement('img');
        img.className = 'custom-item-icon-img';
        img.src = iconSrc;

        // Smart Filtering: JPGs (WoW) are colorful, PNGs (Game-Icons) are tinted
        if (iconSrc.endsWith('.png')) {
            img.style.filter = `drop-shadow(0 0 5px var(--theme-color)) invert(1) sepia(100%) saturate(1000%) hue-rotate(var(--theme-hue, 0deg)) brightness(1.2)`;
        } else {
            img.style.filter = `drop-shadow(0 0 5px rgba(0,0,0,0.5))`;
        }
        
        const nameContainer = item.querySelector('.ct-inventory-item__name, .ct-attunement-slot__name, .ct-attunement__item-name');
        if (nameContainer) {
            item.insertBefore(img, nameContainer.nextSibling);
        }
    });
}

function applyInventoryGrid(enabled) {
    const styleId = 'customizer-inventory-grid-style';
    let styleEl = document.getElementById(styleId);
    
    if (!enabled) {
        if (styleEl) styleEl.remove();
        document.querySelectorAll('.custom-item-icon-img').forEach(el => el.remove());
        return;
    }

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
        .ct-inventory__row-header { display: none !important; }

        .ct-inventory__items {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
            gap: 15px !important;
            padding: 15px !important;
            background: none !important;
        }

        .ct-inventory__items .ct-inventory-item {
            display: flex !important;
            flex-direction: column !important;
            width: 130px !important;
            height: 150px !important;
            min-height: 150px !important;
            background: #1a1a1a !important;
            border: 2px solid #333 !important;
            border-radius: 8px !important;
            padding: 10px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            position: relative !important;
            align-items: center !important;
            justify-content: flex-start !important;
            overflow: hidden !important;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.8) !important;
        }

        .ct-inventory__items .ct-inventory-item:hover {
            border-color: var(--theme-color) !important;
            box-shadow: 0 0 15px var(--theme-color) !important;
            background: #222 !important;
            z-index: 5 !important;
        }

        .ct-inventory-item__action,
        .ct-inventory-item__meta,
        .ct-inventory-item__cost,
        .ct-inventory-item__notes,
        .ct-inventory-item__heading-action {
            display: none !important;
        }

        .ct-inventory-item__name {
            display: block !important;
            height: 45px !important;
            overflow: hidden !important;
            text-align: center !important;
            font-size: 11px !important;
            font-weight: bold !important;
            line-height: 1.2 !important;
            color: #eee !important;
            border: none !important;
            padding: 0 !important;
            margin-bottom: 5px !important;
        }

        .custom-item-icon-img {
            width: 64px !important;
            height: 64px !important;
            border: 2px solid #000 !important;
            border-radius: 4px !important;
            box-shadow: 0 0 5px rgba(0,0,0,1) !important;
            object-fit: cover !important;
            margin-bottom: 5px !important;
        }

        .ct-inventory-item:hover .custom-item-icon-img {
            border-color: var(--theme-color) !important;
        }

        .ct-inventory-item__weight,
        .ct-inventory-item__quantity {
            display: block !important;
            position: absolute !important;
            bottom: 8px !important;
            font-size: 10px !important;
            color: #aaa !important;
            font-family: monospace !important;
        }

        .ct-inventory-item__weight { left: 10px !important; }
        .ct-inventory-item__quantity { right: 10px !important; }

        .ct-inventory-item__weight::before { content: "W:"; color: var(--theme-color); margin-right: 2px; }
        .ct-inventory-item__quantity::before { content: "Q:"; color: var(--theme-color); margin-right: 2px; }

        .ct-content-group__header {
            border-bottom: 2px solid var(--theme-color) !important;
            margin-bottom: 10px !important;
        }
    `;

    injectItemIcons();
}

function applyInventoryGrid(enabled) {
    const styleId = 'customizer-inventory-grid-style';
    let styleEl = document.getElementById(styleId);
    
    if (!enabled) {
        if (styleEl) styleEl.remove();
        document.querySelectorAll('.custom-item-icon-img').forEach(el => el.remove());
        return;
    }

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
        .ct-inventory__row-header { display: none !important; }

        .ct-inventory__items {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
            gap: 12px !important;
            padding: 10px !important;
            background: none !important;
        }

        .ct-inventory__items .ct-inventory-item {
            display: flex !important;
            flex-direction: column !important;
            width: 130px !important;
            height: 130px !important;
            min-height: 130px !important;
            background: rgba(0,0,0,0.6) !important;
            border: 2px solid var(--theme-color) !important;
            border-radius: 10px !important;
            padding: 10px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            position: relative !important;
            align-items: center !important;
            justify-content: flex-start !important;
            overflow: hidden !important;
            transition: all 0.2s ease !important;
        }

        .ct-inventory__items .ct-inventory-item:hover {
            transform: translateY(-5px) scale(1.02) !important;
            box-shadow: 0 5px 15px rgba(0,0,0,0.8), 0 0 12px var(--theme-color) !important;
            background: rgba(255,255,255,0.05) !important;
            z-index: 5 !important;
        }

        .ct-inventory-item__action,
        .ct-inventory-item__meta,
        .ct-inventory-item__cost,
        .ct-inventory-item__notes,
        .ct-inventory-item__heading-action {
            display: none !important;
        }

        .ct-inventory-item__name {
            display: block !important;
            height: 40px !important;
            overflow: hidden !important;
            text-align: center !important;
            font-size: 11px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            line-height: 1.2 !important;
            color: #fff !important;
            border: none !important;
            padding: 0 !important;
            z-index: 2 !important;
        }

        /* The Image Icon Style */
        .custom-item-icon-img {
            width: 50px !important;
            height: 50px !important;
            margin: 5px 0 !important;
            object-fit: contain !important;
            pointer-events: none !important;
            z-index: 2 !important;
            transition: transform 0.2s ease !important;
        }

        .ct-inventory-item:hover .custom-item-icon-img {
            transform: scale(1.1) rotate(5deg) !important;
        }

        .ct-inventory-item__weight,
        .ct-inventory-item__quantity {
            display: block !important;
            position: absolute !important;
            bottom: 8px !important;
            font-size: 10px !important;
            color: var(--theme-color) !important;
            font-family: monospace !important;
            border: none !important;
            background: none !important;
            padding: 0 !important;
            width: auto !important;
            z-index: 2 !important;
        }

        .ct-inventory-item__weight { left: 10px !important; }
        .ct-inventory-item__quantity { right: 10px !important; }

        .ct-inventory-item__weight::before { content: "W:"; font-weight: bold; }
        .ct-inventory-item__quantity::before { content: "Q:"; font-weight: bold; }

        .ct-content-group__header {
            border-bottom: 2px solid var(--theme-color) !important;
            background: rgba(0,0,0,0.2) !important;
            margin-bottom: 10px !important;
        }
    `;

    injectItemIcons();
}
window.applyInventoryGrid = applyInventoryGrid;

// ----- Save Functions -----

function saveBackdrop(fileInput) {
    const characterID = getCharacterID();
    const file = fileInput.files[0];
    if (!characterID || !file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const saveData = { [`backdrop_${characterID}`]: e.target.result };
        chrome.storage.local.set(saveData, () => {
            applyBackdrop();
        });
    };
    reader.readAsDataURL(file);
}
window.saveBackdrop = saveBackdrop;

function saveFrame(fileInput) {
    const characterID = getCharacterID();
    const file = fileInput.files[0];
    if (!characterID || !file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const saveData = { [`frame_${characterID}`]: e.target.result };
        chrome.storage.local.set(saveData, () => {
            applyFrame();
        });
    };
    reader.readAsDataURL(file);
}
window.saveFrame = saveFrame;

function saveColor(color, type){
    const characterID = getCharacterID();
    if (!characterID || !color) return;
    chrome.storage.local.set({ [`${type}_${characterID}`]: color });
}
window.saveColor = saveColor;

// ----- Themed Cursors -----
const cursorSVGs = {
    sword: {
        // Corrected to point Top-Left (0,0)
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzTDI1IDI1TTMgM0w2IDBNMyAzTDAgNk02IDBMMjQgMThNNiAwTDkgLTNNNjUgNiIsIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTMgM0wyNSAyNSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
        pointer: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzTDI1IDI1TTMgM0w2IDBNMyAzTDAgNk02IDBMMjQgMThNNiAwTDkgLTNNNjUgNiIsIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMyAzTDI1IDI1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg=='
    },
    wand: {
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzTDI1IDI1IiBzdHJva2U9IiM4QjQ1MTMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iMyIgY3k9IjMiIHI9IjMiIGZpbGw9IiMwMEZGRkYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+',
        pointer: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzTDI1IDI1IiBzdHJva2U9IiM4QjQ1MTMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iMyIgY3k9IjMiIHI9IjUiIGZpbGw9IiMwMEZGRkYiLz48L3N2Zz4='
    },
    dagger: {
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzTDE3IDE3TDIxIDIxTDE3IDE3TDE2IDE0TDMgMyIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yMCAyMEwyNCAyNCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
        pointer: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzTDE3IDE3TDIxIDIxTDE3IDE3TDE2IDE0TDMgMyIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yMCAyMEwyNCAyNCIgc3Ryb2tlPSIjOTAwIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg=='
    },
    claw: {
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzUzcgMTUgMTUgMTlTMjUgMjUgMjUgMjUiIHN0cm9rZT0iIzQ0NCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMyAzQzYgMTUgMTQgMTQgMTUgMTkiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
        pointer: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzUzcgMTUgMTUgMTlTMjUgMjUgMjUgMjUiIHN0cm9rZT0iIzkwMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMyAzQzYgMTUgMTQgMTQgMTUgMTkiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='
    }
};

function applyCursor(pack) {
    let styleEl = document.getElementById('customizer-cursor-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'customizer-cursor-style';
        document.head.appendChild(styleEl);
    }

    if (pack === 'default' || !cursorSVGs[pack]) {
        styleEl.innerHTML = '';
        return;
    }

    const { default: def, pointer } = cursorSVGs[pack];
    styleEl.innerHTML = `
        * {
            cursor: url("${def}"), auto !important;
        }
        a, button, [role="button"], .ct-character-header-desktop__button, .styles_valueButton__0rK5Z, input, select, [onclick], .ddbc-theme-link {
            cursor: url("${pointer}"), pointer !important;
        }
    `;
}
window.applyCursor = applyCursor;

// ----- Checkbox Theming -----
function applyCheckboxTheming(color = '#ff0000', glow = 50, shape = 'diamond') {
    const characterID = getCharacterID();
    if (!characterID) return;

    let styleEl = document.getElementById('customizer-checkbox-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'customizer-checkbox-style';
        document.head.appendChild(styleEl);
    }

    const glowPx = glow / 3;
    const darkerColor = color.replace(/^#/, '').replace(/../g, c => ('0' + Math.max(0, parseInt(c, 16) - 100).toString(16)).slice(-2));
    
    const icons = {
        diamond: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L2 12l10 10 10-10L12 2z'/%3E%3C/svg%3E",
        shield: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E",
        skull: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C7.03 2 3 6.03 3 11c0 2.21.81 4.21 2.14 5.75L5 22h14l-.14-5.25C20.19 15.21 21 13.21 21 11c0-4.97-4.03-9-9-9zm-3 9c-.83 0-1.5-.67-1.5-1.5S8.17 8 9 8s1.5.67 1.5 1.5S9.83 11 9 11zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 8 15 8s1.5.67 1.5 1.5S15.83 11 15 11z'/%3E%3C/svg%3E",
        circle: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E",
        square: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3C/svg%3E"
    };

    const activeIcon = icons[shape] || icons.diamond;

    styleEl.innerHTML = `
        /* Target D&D Beyond Slot Managers and Dots */
        .ct-slot-manager__slot, .ct-death-saves__dot, .integrated-dice__container--scaled {
            background-color: rgba(0,0,0,0.3) !important;
            border: 2px solid #${darkerColor} !important; /* Larger, darker persistent outline */
            border-radius: 3px !important;
            mask-size: 85% !important;
            mask-repeat: no-repeat !important;
            mask-position: center !important;
            -webkit-mask-size: 85% !important;
            -webkit-mask-repeat: no-repeat !important;
            -webkit-mask-position: center !important;
            -webkit-mask-image: url("${activeIcon}");
            mask-image: url("${activeIcon}");
            transition: all 0.2s ease !important;
            position: relative;
            overflow: visible !important;
        }

        /* When Checked/Used */
        .ct-slot-manager__slot--used, .ct-death-saves__dot--success, .ct-death-saves__dot--fail, .ct-slot-manager__slot--active {
            background-color: ${color} !important;
            /* Soft Radial Glow using shadow */
            box-shadow: 0 0 ${glowPx}px ${color}, 0 0 ${glowPx*2}px ${color}44 !important;
            border-color: ${color} !important;
        }

        /* Hover effect */
        .ct-slot-manager__slot:hover {
            border-color: ${color} !important;
            background-color: rgba(255,255,255,0.1) !important;
        }

        /* Hide original elements */
        .ct-slot-manager__slot:before, .ct-slot-manager__slot:after {
            display: none !important;
        }
    `;
}
window.applyCheckboxTheming = applyCheckboxTheming;

// ----- Dynamic Health -----
let vignetteEl;
function initHealth() {
    if (vignetteEl) return;
    vignetteEl = document.createElement('div');
    vignetteEl.id = 'health-vignette';
    document.body.appendChild(vignetteEl);
}

function applyHealthOrb(percent, enabled) {
    const hpBox = document.querySelector('[class*="hitPointsBox"]');
    if (!hpBox) return;

    const numbersContainer = hpBox.querySelector('[class*="innerContainer"]');
    if (!numbersContainer) return;

    let orb = numbersContainer.querySelector('.customizer-health-orb');
    let orbStyle = document.getElementById('customizer-orb-styles');

    if (!enabled) {
        if (orb) orb.remove();
        if (orbStyle) orbStyle.innerHTML = '';
        hpBox.style.overflow = '';
        return;
    }

    if (!orbStyle) {
        orbStyle = document.createElement('style');
        orbStyle.id = 'customizer-orb-styles';
        document.head.appendChild(orbStyle);
    }

    // Surgical CSS overrides
    orbStyle.innerHTML = `
        /* Hide the "Hit Points" header and Current/Max labels */
        [class*="hitPointsBox"] [class*="label__Ivf2i"],
        [class*="innerContainer"] [class*="label__ysVMP"] {
            display: none !important;
        }

        /* Ensure parent box allows overflowing orb */
        [class*="hitPointsBox"] {
            overflow: visible !important;
        }

        /* Container for the Current/Max numbers */
        [class*="innerContainer"] {
            position: relative !important;
            z-index: 5 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100px !important;
            min-width: 80px !important; /* Reduced width to bring numbers together */
            gap: 2px !important; /* Added a tight gap */
            margin: 0 !important;
            transform: translateY(-15px) !important; /* Move numbers up to match the orb's shift */
        }

        /* The Orb itself - Center it behind numbers */
        .customizer-health-orb {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 105px !important;
            height: 105px !important;
            border-radius: 50% !important;
            border: 4px solid #222 !important;
            background: #000 !important;
            box-shadow: 
                0 0 15px rgba(0,0,0,0.8), 
                inset 0 0 25px rgba(0,0,0,0.9),
                0 0 8px var(--theme-color) !important;
            z-index: -1 !important;
            overflow: hidden !important;
            pointer-events: none !important;
        }
        
        .customizer-health-orb::after {
            content: "" !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: ${percent}% !important;
            background: linear-gradient(0deg, #800 0%, #ff3333 100%) !important;
            box-shadow: 0 0 40px #ff0000 !important;
            transition: height 0.4s ease-out !important;
        }

        /* Style the numbers and slash inside orb */
        [class*="innerContainer"] [class*="number__j1d93"] {
            font-size: 22px !important; /* Slightly smaller for compactness */
            line-height: 1 !important;
            color: white !important;
            text-shadow: 2px 2px 4px black !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        [class*="innerContainer"] [class*="slash__UmBPf"] {
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            transform: translateY(-5px) !important; /* Moved slash up even more */
        }

        /* Fix the input field when editing Current HP */
        [class*="innerContainer"] input {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            height: 35px !important;
            width: 50px !important;
            z-index: 10 !important;
            text-align: center !important;
            background: #222 !important;
            color: white !important;
            border: 1px solid var(--theme-color) !important;
        }
    `;

    if (!orb) {
        orb = document.createElement('div');
        orb.className = 'customizer-health-orb';
        numbersContainer.insertBefore(orb, numbersContainer.firstChild);
    }
}

function checkHealth(forcedPercent = null) {
    const characterID = getCharacterID();
    if (!characterID) return;

    Promise.all([
        storage.get(`dynamicHealth_${characterID}`),
        storage.get(`healthOrb_${characterID}`)
    ]).then(([vignetteData, orbData]) => {
        const vignetteEnabled = vignetteData[`dynamicHealth_${characterID}`] === 'true';
        const orbEnabled = orbData[`healthOrb_${characterID}`] === 'true';

        // Robustly find Current and Max HP
        const currentHPButton = document.querySelector('[class*="item__UVpsr"] button[class*="number"]');
        const currentHPInput = document.querySelector('[class*="item__UVpsr"] input');
        const maxHPElement = document.querySelector('[data-testid="max-hp"], [class*="max-hp"], [class*="hp-number--max"]');
        
        let percent = 100;
        if (forcedPercent !== null) {
            percent = forcedPercent;
        } else if (maxHPElement) {
            let current = 0;
            if (currentHPInput) {
                current = parseInt(currentHPInput.value) || 0;
            } else if (currentHPButton) {
                current = parseInt(currentHPButton.innerText.trim()) || 0;
            }
            
            const max = parseInt(maxHPElement.innerText.trim()) || 1;
            percent = Math.min(100, Math.max(0, (current / max) * 100));
        }

        applyHealthOrb(percent, orbEnabled);

        if (!vignetteEnabled && forcedPercent === null) {
            document.body.classList.remove('health-bloodied', 'health-critical');
            const portrait = document.querySelector(".ddbc-character-avatar");
            if (portrait) portrait.classList.remove('portrait-bloodied');
            updateSavedColors(); 
            return;
        }

        initHealth();
        // ... (rest of the vignette logic)

        console.log(`[Health Check] Percent: ${percent}%`);
        const portrait = document.querySelector(".ddbc-character-avatar");

        if (percent <= 25) {
            document.body.classList.add('health-critical');
            document.body.classList.remove('health-bloodied');
            if (portrait) portrait.classList.add('portrait-bloodied');
        } else if (percent <= 50) {
            document.body.classList.add('health-bloodied');
            document.body.classList.remove('health-critical');
            if (portrait) portrait.classList.add('portrait-bloodied');
        } else {
            document.body.classList.remove('health-bloodied', 'health-critical');
            if (portrait) portrait.classList.remove('portrait-bloodied');
        }
    });
}
window.checkHealth = checkHealth;

function triggerHealFlash() {
    initHealth();
    vignetteEl.classList.add('heal-flash');
    setTimeout(() => {
        vignetteEl.classList.remove('heal-flash');
    }, 500); // Quick flash
}

// Global listener for heal button clicks
document.addEventListener('click', (e) => {
    // Look specifically for a button or themed element that contains "heal"
    const healBtn = e.target.closest('button[class*="heal"], div[class*="heal"][role="button"], [class*="styles_heal"]');
    if (healBtn) {
        triggerHealFlash();
    }
}, true);

// ----- Particle Engine -----
let particleCanvas, ctx, particles = [], animationId;
let currentParticleType = 'none', currentIntensity = 50, currentParticleColor = '#ffffff';
let leafImage = new Image();
leafImage.src = chrome.runtime.getURL('leaf.png');

function initParticles() {
    if (particleCanvas) return;
    particleCanvas = document.createElement('canvas');
    particleCanvas.id = 'customizer-particle-canvas';
    particleCanvas.style.position = 'fixed';
    particleCanvas.style.top = '0';
    particleCanvas.style.left = '0';
    particleCanvas.style.width = '100vw';
    particleCanvas.style.height = '100vh';
    particleCanvas.style.pointerEvents = 'none';
    particleCanvas.style.zIndex = '5';
    document.body.appendChild(particleCanvas);
    ctx = particleCanvas.getContext('2d');

    const updateSize = () => {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', updateSize);
    updateSize();
}

function applyParticles(type, intensity = 50, color = '#ffffff') {
    if (currentParticleType === type && currentIntensity === intensity && currentParticleColor === color && particles.length > 0) {
        return; // Don't reset if nothing changed
    }
    
    currentParticleType = type;
    currentIntensity = intensity;
    currentParticleColor = color;
    initParticles();
    
    // Clear and stop old animation if type is none
    if (type === 'none') {
        particles = [];
        if (animationId) cancelAnimationFrame(animationId);
        if (ctx) ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        return;
    }
    
    particles = [];
    if (animationId) cancelAnimationFrame(animationId);
    createParticles();
    animateParticles();
}
window.applyParticles = applyParticles;

class Particle {
    constructor() {
        this.reset();
    }

    reset(isBurst = false) {
        this.w = particleCanvas.width;
        this.h = particleCanvas.height;
        this.x = Math.random() * this.w;
        // Start embers at the bottom, staggered
        this.y = currentParticleType === 'embers' ? this.h + Math.random() * 100 : Math.random() * this.h;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 1;
        this.speedY = (Math.random() - 0.5) * 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.flicker = Math.random() * 0.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        
        const hexToRgba = (hex, opacity) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        this.baseColor = currentParticleColor;

        if (currentParticleType === 'embers') {
            this.speedY = -Math.random() * 1.5 - 0.5;
            this.speedX = (Math.random() - 0.5) * 1.5;
            this.size = Math.random() * 4 + 2;
            if (isBurst) {
                this.speedY *= 3;
                this.size *= 2;
                this.opacity = 1;
            }
        } else if (currentParticleType === 'rain') {
            this.y = -20;
            this.speedY = Math.random() * 10 + 10;
            this.speedX = -1.5;
            this.size = 1.2;
        } else if (currentParticleType === 'snow') {
            this.y = -10;
            this.speedY = Math.random() * 1 + 0.5;
            this.speedX = (Math.random() - 0.5) * 1;
            this.size = Math.random() * 3 + 2;
        } else if (currentParticleType === 'eldritch') {
            this.size = Math.random() * 6 + 3;
            this.speedY = (Math.random() - 0.5) * 0.6;
            this.speedX = (Math.random() - 0.5) * 0.6;
        } else if (currentParticleType === 'leaves' || currentParticleType === 'green_leaves' || currentParticleType === 'petals') {
            this.y = -20;
            this.speedY = Math.random() * 1 + 0.5;
            this.speedX = Math.random() * 1.5 - 0.75;
            this.size = Math.random() * 8 + 8;
            this.rotationSpeed = (Math.random() - 0.5) * 0.05;
            if (currentParticleType === 'leaves') {
                const autumnColors = ['#d35400', '#f39c12', '#c0392b'];
                this.baseColor = autumnColors[Math.floor(Math.random() * autumnColors.length)];
            }
        } else if (currentParticleType === 'gears') {
            this.size = Math.random() * 15 + 10;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.rotationSpeed = (Math.random() - 0.5) * 0.04;
            this.teeth = Math.floor(Math.random() * 5) + 7;
        } else if (currentParticleType === 'bubbles') {
            this.y = this.h + 10;
            this.speedY = -Math.random() * 1.5 - 0.5;
            this.size = Math.random() * 5 + 3;
        } else if (currentParticleType === 'sand') {
            this.speedX = -Math.random() * 5 - 5;
            this.speedY = Math.random() * 1;
            this.x = this.w + 20;
            this.size = Math.random() * 2 + 1;
        } else if (currentParticleType === 'fog') {
            this.size = Math.random() * 100 + 150;
            this.speedX = Math.random() * 0.5 + 0.2;
            this.speedY = (Math.random() - 0.5) * 0.2;
            this.opacity = Math.random() * 0.1 + 0.05;
        } else if (currentParticleType === 'stars') {
            this.speedX = 0;
            this.speedY = 0;
            this.size = Math.random() * 2 + 1;
            this.opacity = Math.random();
            this.twinkleSpeed = Math.random() * 0.03 + 0.01;
        } else if (currentParticleType === 'lightning') {
            this.opacity = 0;
            this.strikeData = null;
        }

        this.color = hexToRgba(this.baseColor, this.opacity);
    }

    update() {
        if (currentParticleType === 'lightning') {
            if (Math.random() < 0.001 && this.opacity <= 0) { // Much rarer
                this.opacity = 1;
                this.x = Math.random() * this.w;
                this.strikeData = [];
                let curX = this.x;
                let curY = 0;
                while (curY < this.h) {
                    let nextX = curX + (Math.random() - 0.5) * 60;
                    let nextY = curY + Math.random() * 40 + 20;
                    this.strikeData.push({x1: curX, y1: curY, x2: nextX, y2: nextY});
                    curX = nextX;
                    curY = nextY;
                }
            }
            if (this.opacity > 0) this.opacity -= 0.05; // Fade slower
            return;
        }

        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (currentParticleType === 'bubbles') {
            this.x += Math.sin(this.y * 0.05) * 1;
        } else if (currentParticleType === 'stars') {
            this.opacity += this.twinkleSpeed;
            if (this.opacity > 1 || this.opacity < 0.1) this.twinkleSpeed *= -1;
        }

        const r = parseInt(this.baseColor.slice(1, 3), 16);
        const g = parseInt(this.baseColor.slice(3, 5), 16);
        const b = parseInt(this.baseColor.slice(5, 7), 16);
        this.color = `rgba(${r}, ${g}, ${b}, ${Math.max(0, this.opacity)})`;

        // Check for out of bounds and reset
        if (currentParticleType !== 'stars' && currentParticleType !== 'lightning') {
            const isOut = this.y > this.h + 50 || 
                         this.y < -50 || 
                         this.x < -100 || 
                         this.x > this.w + 100;
            if (isOut) this.reset();
        }
    }

    draw() {
        if (currentParticleType === 'rain') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.speedX, this.y + this.speedY);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.stroke();
            return;
        }

        if (currentParticleType === 'lightning' && this.opacity > 0 && this.strikeData) {
            ctx.beginPath();
            this.strikeData.forEach(d => {
                ctx.moveTo(d.x1, d.y1);
                ctx.lineTo(d.x2, d.y2);
            });
            const r = parseInt(currentParticleColor.slice(1, 3), 16);
            const g = parseInt(currentParticleColor.slice(3, 5), 16);
            const b = parseInt(currentParticleColor.slice(5, 7), 16);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = currentParticleColor;
            ctx.stroke();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (currentParticleType === 'eldritch') {
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size * 0.3, -this.size * 0.2);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(this.size * 0.3, this.size * 0.2);
            ctx.lineTo(0, this.size);
            ctx.lineTo(-this.size * 0.3, this.size * 0.2);
            ctx.lineTo(-this.size, 0);
            ctx.lineTo(-this.size * 0.3, -this.size * 0.2);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fill();
        } else if (currentParticleType === 'embers') {
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.5, -this.size * 0.2);
            ctx.lineTo(this.size * 0.3, -this.size * 0.6);
            ctx.lineTo(this.size * 0.6, 0.2);
            ctx.lineTo(0.1, this.size * 0.5);
            ctx.lineTo(-this.size * 0.4, 0.4);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        } else if (currentParticleType === 'leaves' || currentParticleType === 'green_leaves') {
            if (leafImage.complete) {
                // Ensure no shadow/blur is active for the image
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                
                // Draw the leaf
                ctx.drawImage(leafImage, -this.size, -this.size, this.size * 2, this.size * 2);
                
                // Only apply tint if it's not the default white or if it's autumn leaves
                if (this.baseColor !== '#ffffff' || currentParticleType === 'leaves') {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = this.color;
                    // Slightly smaller fill to prevent edge bleeding "boxes"
                    ctx.fillRect(-this.size - 1, -this.size - 1, this.size * 2 + 2, this.size * 2 + 2);
                    ctx.globalCompositeOperation = 'source-over';
                }
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.bezierCurveTo(this.size, -this.size, this.size, this.size, 0, this.size);
                ctx.bezierCurveTo(-this.size, this.size, -this.size, -this.size, 0, -this.size);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        } else if (currentParticleType === 'petals') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(this.size, -this.size, this.size * 1.5, this.size, 0, this.size);
            ctx.bezierCurveTo(-this.size * 1.5, this.size, -this.size, -this.size, 0, 0);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (currentParticleType === 'gears') {
            const innerRadius = this.size * 0.7;
            const outerRadius = this.size;
            const holeRadius = this.size * 0.3;

            ctx.beginPath();
            // Create gear teeth
            for (let i = 0; i < this.teeth; i++) {
                const angle = (i / this.teeth) * Math.PI * 2;
                const nextAngle = ((i + 0.5) / this.teeth) * Math.PI * 2;
                
                ctx.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
                ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                ctx.lineTo(Math.cos(nextAngle) * outerRadius, Math.sin(nextAngle) * outerRadius);
                ctx.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
            }
            
            // Create central hole (counter-clockwise path)
            ctx.moveTo(holeRadius, 0);
            ctx.arc(0, 0, holeRadius, 0, Math.PI * 2, true);
            
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fill();
        } else if (currentParticleType === 'bubbles') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fill();
        } else if (currentParticleType === 'stars') {
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.lineTo(this.size, 0);
                ctx.lineTo(0.2 * this.size, 0.2 * this.size);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        } else if (currentParticleType === 'fog') {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            grad.addColorStop(0, this.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.restore();
    }
}

function createParticles() {
    const count = Math.floor((currentIntensity / 100) * 200);
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Occasional Fire Roar
    if (currentParticleType === 'embers' && Math.random() < 0.01) {
        const roarCount = Math.floor(Math.random() * 5) + 5;
        for(let i = 0; i < roarCount; i++) {
            const p = particles[Math.floor(Math.random() * particles.length)];
            if (p) p.reset(true);
        }
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    animationId = requestAnimationFrame(animateParticles);
}

// ----- Initialization -----
function updateSavedColors(){
    const characterID = getCharacterID();
    if (!characterID) return;
    
    const types = ['background', 'header', 'border', 'accent', 'text1', 'text0', 'particleType', 'particleIntensity', 'particleColor', 'checkboxColor', 'checkboxGlow', 'checkboxShape', 'portraitShape', 'customFont', 'boxStyle', 'rarityAuras', 'inventoryGrid', 'readabilityMode'];
    types.forEach(type => {
        storage.get(`${type}_${characterID}`).then((data) => {
            const val = data[`${type}_${characterID}`];
            if (val) {
                if (type === 'background') applyBackgroundColor(val);
                else if (type === 'header') applyHeaderColor(val);
                else if (type === 'border') applyBorderColor(val);
                else if (type === 'accent') applyAccentColor(val);
                else if (type === 'portraitShape') applyPortraitShape(val);
                else if (type === 'customFont') applyFont(val);
                else if (type === 'rarityAuras') applyRarityAuras();
                else if (type === 'inventoryGrid') applyInventoryGrid(val === 'true');
                else if (type === 'readabilityMode' && val === 'true') {
                    // Re-trigger accent to apply readability CSS if accent exists
                    storage.get(`accent_${characterID}`).then(acData => {
                        const ac = acData[`accent_${characterID}`] || '#be1e2dff';
                        applyAccentColor(ac);
                    });
                }
                else if (type === 'checkboxColor') {
                    if (val) {
                        Promise.all([
                            storage.get(`checkboxGlow_${characterID}`),
                            storage.get(`checkboxShape_${characterID}`)
                        ]).then(([gData, sData]) => {
                            applyCheckboxTheming(
                                val, 
                                gData[`checkboxGlow_${characterID}`] || 50,
                                sData[`checkboxShape_${characterID}`] || 'diamond'
                            );
                        });
                    } else {
                        const styleEl = document.getElementById('customizer-checkbox-style');
                        if (styleEl) styleEl.innerHTML = '';
                    }
                }
                else if (type.startsWith('text')) applyTextColor(val, parseInt(type.slice(-1)));
                else if (type === 'particleType') {
                    Promise.all([
                        storage.get(`particleIntensity_${characterID}`),
                        storage.get(`particleColor_${characterID}`)
                    ]).then(([iData, cData]) => {
                        applyParticles(
                            val, 
                            iData[`particleIntensity_${characterID}`] || 50,
                            cData[`particleColor_${characterID}`] || '#ffffff'
                        );
                    });
                }
            }
        });
    });
}
window.updateSavedColors = updateSavedColors;

const initialize = () => {
    applyBackdrop();
    applyFrame();
    injectButton();
    updateSavedColors();
    checkHealth();
    applyRarityAuras();
    
    const characterID = getCharacterID();
    storage.get(`inventoryGrid_${characterID}`).then(data => {
        if (data[`inventoryGrid_${characterID}`] === 'true') applyInventoryGrid(true);
    });
};

if (document.readyState === "complete" || document.readyState === "interactive") {
    initialize();
} else {
    document.addEventListener("DOMContentLoaded", initialize);
}

const observer = new MutationObserver(debounce(() => {
    // Only re-apply if critical elements are missing or sheet re-rendered
    if (!document.getElementById('customizer-particle-canvas')) initParticles();
    
    // Check if backdrop is still applied
    const body = document.querySelector("body.body-rpgcharacter-sheet");
    if (body && !body.style.backgroundImage) applyBackdrop();
    
    // Check if frame is still applied
    if (!document.querySelector(".custom-frame-overlay")) applyFrame();
    
    if(!document.getElementById(injectedBtnId)) injectButton();
    
    checkHealth();
    updateSavedColors();
    applyRarityAuras();

    const characterID = getCharacterID();
    storage.get(`inventoryGrid_${characterID}`).then(data => {
        if (data[`inventoryGrid_${characterID}`] === 'true') applyInventoryGrid(true);
    });
}, 200));

observer.observe(document.body, { childList: true, subtree: true });
