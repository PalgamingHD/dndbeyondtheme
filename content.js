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
const injectedBtnSvgId = "customizerBtnSvg";

let injectionPending  = false
function injectButton(){
    if (document.getElementById(injectedBtnId) || injectionPending) return;
    
    injectionPending = true;
    waitForElement(parentSelector, (container) => {
        // console.log("valore buffo:" + !document.getElementById(injectedBtnId))
        // console.log("dentro funzione")  
        const buttonPresente = document.getElementById(injectedBtnId)   
        if(!buttonPresente){
                // console.log("dentro if")
                const url = chrome.runtime.getURL("button.html");
                fetch(url)
                    .then(response => response.text())
                    .then(htmlContent => {           

                        // Create a temporary container and parse the HTML
                        const temp = document.createElement('div');
                        temp.innerHTML = htmlContent.trim();
                        const newElement = temp.firstElementChild;
                    
                        // Insert the new element as the first child of container
                        container.insertBefore(newElement, container.childNodes[2]);
                        // Get the normal button and compute its border color:
                        const normalBtn = document.querySelector(normalBtnSelector);
                        const normalBtnColor = window.getComputedStyle(normalBtn).borderColor;
                        
                        const injectedBtn = document.getElementById("customizerBtn");
                        const injectedBtnSvg = document.getElementById("customizerBtnSvg");
                        if (injectedBtn && injectedBtnSvg) {
                        injectedBtn.style.borderColor = normalBtnColor;
                        injectedBtnSvg.style.fill = normalBtnColor;
                        } else {
                        console.error("Injected button not found.");
                        }
                    })
                    .catch(error => console.error('Error loading HTML:', error));
            injectionPending = false;
        }else{injectionPending = false;}
    });
};
// injectButton()

waitForElement(
    "#character-tools-target > div > div.ct-character-sheet__inner > div > div.ct-character-header-desktop > div.ct-character-header-desktop__group.ct-character-header-desktop__group--custom",
    (extBtn) => {
    //   console.log("btn found");
      extBtn.addEventListener("click", (event) => {
        // event.stopImmediatePropagation();
        // chrome.runtime.sendMessage({ action: "injectFileSelector" });
        injectFileSelector()
      }, true);
    }
);

// Extract character ID from URL
const getCharacterID = () => {
    const match = window.location.href.match(/\/characters\/(\d+)/);
    return match ? match[1] : null;
};

function getFromStorage(key){
  // Works with either `browser` or `chrome`
  if (typeof browser !== "undefined") return browser.storage.local.get(key);
  return new Promise((resolve, reject) => {
    try { chrome.storage.local.get(key, resolve); }
    catch (e) { reject(e); }
  });
}

// ----- Apply Functions -----

// Function to apply backdrop
function applyBackdrop() {
    const characterID = getCharacterID();
    if (!characterID) {
        // console.log("No character ID found. Skipping backdrop replacement.");
        return;
    }

      getFromStorage(`backdrop_${characterID}`).then((data) => {
        const backdropData = data[`backdrop_${characterID}`];

        if (!backdropData) {
            // console.log(`No custom backdrop found for character ${characterID}.`);
            return;
        }

        // console.log(`Found backdrop for character ${characterID}`);

        // Directly apply the backdrop to the body tag (fastest method)
        let bodyElement = document.querySelector("body.body-rpgcharacter-sheet");
        if (bodyElement) {
            bodyElement.style.setProperty("background-image", `url(${backdropData})`, "important");
            bodyElement.style.setProperty("background-size", "cover", "important");
            bodyElement.style.setProperty("background-position", "center center", "important");
            bodyElement.style.setProperty("background-repeat", "no-repeat", "important");
        }

    }).catch(error => {
        console.error("Error loading backdrop:", error);
    });
};

function applyFrame(){
   const characterID = getCharacterID();
   if (!characterID) {
      return;
   } // skip if character doesn't exist
      getFromStorage(`frame_${characterID}`).then((data) => {
      const frameData = data[`frame_${characterID}`];

      if (!frameData) {
         return;
      } // skip if no current frame

      const frameEl = document.querySelector(".ddbc-character-avatar__frame");
      if (frameEl) {
         frameEl.style.setProperty("background-image", `url(${frameData})`, "important");
         // console.log("frame applied to body!");
      } else{
         console.log("frame failed");
      }

   }).catch(error => {
      console.error("Error loading frame:", error);
   });  

}

// Apply Box Background Color
function applyBackgroundColor(newColor, num) {
    // Select all ddbc-box-background containers
    const boxes = document.querySelectorAll('.ddbc-box-background, .InspirationBoxSvg-Sheet_Desktop_Static');
    boxes.forEach(box => {
        // Get all child elements and filter for <path> or <polygon>
        const allChildren = Array.from(box.querySelectorAll("path, polygon"));
        const firstElement = allChildren[0];

        // Check if any valid candidate is found
        firstElement.setAttribute("fill", newColor);

        if (allChildren.length == 3) {
            const secondElement = allChildren[1];
            secondElement.setAttribute("fill", newColor);
            return;
        }

        // console.log(`🎨 Changed color of first ${firstElement.tagName} to ${newColor}`);
    });

    // Change the background color of the input fields
    document.querySelectorAll(".styles_input__coHiS").forEach(el => {
        el.style.setProperty("background-color", newColor.slice(0, -2), "important");
    });
    
    const sideBackground = document.querySelectorAll('.bg');
    if(sideBackground){
        sideBackground.forEach(el => {
            el.setAttribute("style", "fill:" + newColor.slice(0, -2) + " !important;");
        });
    }
    
    const dbSidebarBg = document.querySelectorAll('.styles_content__3knKz.styles_dark__6-qrS, .styles_gap__kuwYv.styles_dark__6-qrS')
    if(dbSidebarBg){
        dbSidebarBg.forEach(el => {
            el.setAttribute("style", "background:" + newColor.slice(0, -2) + " !important;");
        });
    }
    
    const dbSidebarBorderBg = document.querySelectorAll('.styles_border__jHreB.styles_dark__6-qrS [class*=borderBg]')
    if(dbSidebarBorderBg){
        dbSidebarBorderBg.forEach(el => {
            el.setAttribute("style", "fill:" + newColor.slice(0, -2) + " !important;");
        });
    }
    
    const dbSidebarCenterBg = document.querySelectorAll('.styles_intro__DxeXR')
    if(dbSidebarCenterBg){
        dbSidebarCenterBg.forEach(el => {
            el.setAttribute("style", "background:" + newColor.slice(0, -2) + " !important;");
        });
    }
    
    const dbSidebarCenterBg2 = document.querySelector('.ct-decorate-pane__current-selections')
        if(dbSidebarCenterBg2){
            dbSidebarCenterBg2.setAttribute("style", "background:" + newColor.slice(0, -2) + " !important;")
        }
    
    const dbSidebarUndregroundSwitch = document.querySelectorAll('.ct-decorate-pane__preferences-content')
        if(dbSidebarUndregroundSwitch){
        dbSidebarUndregroundSwitch.forEach(el => {
            el.setAttribute("style", "background:" + newColor.slice(0, -2) + " !important;");
        });
    }
}
window.applyBackgroundColor = applyBackgroundColor;

function applyHeaderColor(newColor) {
  const color = newColor.slice(0, -2); // keep your pattern

  // 1) Keep (or drop) this if you DO want the inner button bar colored:
  const headerBoxes = document.querySelectorAll('.ct-character-header-desktop');
  headerBoxes.forEach(el => {
    el.setAttribute("style", "background:" + color + " !important;");
    el.style.backdropFilter = 'none';
    el.style.webkitBackdropFilter = 'none';
  });

  // 2) IMPORTANT: Do NOT paint the .ct-character-sheet element background.
  //    Also clear any previous override that might have colored the whole page.
  document.querySelectorAll('.ct-character-sheet').forEach(el => {
    el.style.setProperty('background', 'transparent', 'important');
    el.style.removeProperty('background-image'); // in case we set it before
  });

  // 3) Recolor ONLY the overlay pseudo-elements
  let style = document.getElementById('ddbHeaderOverlayStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'ddbHeaderOverlayStyle';
    document.head.appendChild(style);
  }
   style.textContent = `
    .ct-character-sheet::before,
    .ct-character-sheet--dark-mode::before,
    .ct-character-header-desktop::before {
      content: "" !important;
      background: ${color} !important;
      background-image: none !important;
      opacity: 1 !important;
      mix-blend-mode: normal !important;
      box-shadow: none !important;
    }
    .ct-character-header-desktop::after {
      background: transparent !important;
      background-image: none !important;
      opacity: 0 !important;
      box-shadow: none !important;
    }
  `;
}

window.applyHeaderColor = applyHeaderColor;


// Apply Box Border Color
function applyBorderColor(newColor, num) {
    // Reduced alpha color
    let alpha = parseInt(newColor.slice(-2), 16);
    alpha = Math.floor(alpha / 2);
    let reducedColor = newColor.slice(0, -2) + alpha.toString(16).padStart(2, '0')

    // Select all ddbc-box-background containers
    const boxes = document.querySelectorAll('.ct-attunement__group-items, .ddbc-box-background, .InspirationBoxSvg-Sheet_Desktop_Static');
    boxes.forEach(box => {
        // Get all child elements and filter for <path> or <polygon>
        const allChildren = Array.from(box.querySelectorAll("path, polygon"));
        const element = allChildren[allChildren.length - 1];        
        
        element.setAttribute("fill", allChildren.length == 1 ? reducedColor : newColor);

        // console.log(`🎨 Changed color of ${Element.tagName} to ${newColor}`);
    });

    const sidebarBorders = document.querySelectorAll(".content")
    if(sidebarBorders){
        for(const bord of sidebarBorders){
            bord.style.borderTop = "2px solid " + newColor;
            bord.style.borderBottom = "2px solid " + newColor;
        }
    };
    
    const sideBorder = document.querySelectorAll('.bo');
    if(sideBorder){
        sideBorder.forEach(el => {
            el.setAttribute("style", "fill:" + newColor + " !important;");
        });
    }else{
        // console.log('No side border found');
    }
}
window.applyBorderColor = applyBorderColor;

// Apply Accent Color
function applyAccentColor(newColor, num) {
    document.documentElement.style.setProperty("--theme-color", newColor);

    const partyTime = document.querySelector('#rainbowModeBtn')
    if(partyTime){
        if(partyTime.value === '0'){
            partyTime.style.backgroundColor = newColor
        }
    }
    
    const elements = document.querySelectorAll('.ct-character-header-desktop__button');
    elements.forEach(element => {
        if (element) {
          element.style.borderColor = newColor
        }
    });

    const sliders = document.querySelectorAll('#alphaInputBg, #alphaInputBo')
    sliders.forEach(element => {
        if (element) {
            element.setAttribute("style", "accent-color: " + newColor + " !important;")
        }
    });
    
    const dbSidebarButtonsBorder = document.querySelectorAll('.ddbc-collapsible--opened > .ddbc-collapsible__header')
        if(dbSidebarButtonsBorder){
        dbSidebarButtonsBorder.forEach(el => {
            el.setAttribute("style", "border-color:" + newColor + " !important;");
        });
    };
    
    const savingThrowsborders = document.querySelectorAll('.ddbc-saving-throw-selection-box-svg path')
        if(savingThrowsborders){
        savingThrowsborders.forEach(el => {
            el.style.stroke = newColor;
        });
    };

    const invAction = document.querySelectorAll('.ct-inventory__action')
    invAction.forEach(element => {
        if (element) {
            element.setAttribute("style", "color: " + newColor + " !important;")
        }
    });
    
    const diceContainerBord = document.querySelectorAll('.integrated-dice__container')
        if(diceContainerBord){
            diceContainerBord.forEach(el => {                  
            el.setAttribute("style", "border-color:" + newColor + " !important;");
            // const style = document.createElement('style');
            // style.textContent = `
            // button.integrated-dice__container:hover {
            //     background-color: ${newColor.slice(0, -2) + "44"} !important;
            // }
            // `;
            // document.head.appendChild(style);
        });
    };

    const diceContainerHover = ".integrated-dice__container:hover:not(:has(+ .ddbc-saving-throw-selection-box-svg))";
    const diceContainerHoverSVG = ".integrated-dice__container:hover ~ .ddbc-saving-throw-selection-box-svg";
    let hoverStyleEl = document.getElementById("diceContainerHoverStyle");
    if (!hoverStyleEl) {
        hoverStyleEl = document.createElement("style");
        hoverStyleEl.id = "diceContainerHoverStyle";
        document.head.appendChild(hoverStyleEl);
    }

    hoverStyleEl.innerHTML = `
        ${diceContainerHover} {
            background-color: ${newColor.slice(0,-2)}33 !important;
        }
        ${diceContainerHoverSVG} {
            fill: ${newColor.slice(0,-2)}33 !important;
        }
    `;
    
    const diceToolbar = document.querySelector('.dice-toolbar')
    if(diceToolbar){
        
        const darkColor = newColor.replace(/^#/, '').replace(/../g, c => ('0' + Math.max(0, parseInt(c, 16) - 30).toString(16)).slice(-2));
        const darkColorRgb = `rgb(${parseInt(darkColor.slice(0, 2), 16)}, ${parseInt(darkColor.slice(2, 4), 16)}, ${parseInt(darkColor.slice(4, 6), 16)})`;
        // const shadow = boxShadow.replace(/rgb\(\d+, \d+, \d+\)/g, darkColorRgb);
                       
        diceToolbar.style.setProperty('--dice-color', newColor, 'important');
        diceToolbar.style.setProperty('--dice-color-hover', darkColorRgb, 'important');
    };
    
    const dbSidebarImgBorder = document.querySelectorAll('.ddbc-character-avatar__portrait')
        if(dbSidebarImgBorder){
        dbSidebarImgBorder.forEach(el => {
            el.setAttribute("style", "border-color:" + newColor + " !important;");
        });
    };
    
    const dbSidebarCenterBorder = document.querySelectorAll('.ct-decorate-pane__current-selections')
        if(dbSidebarCenterBorder){
        dbSidebarCenterBorder.forEach(el => {
            el.setAttribute("style", "border-bottom: 1px solid " + newColor + " !important;");
        });
    };
    const dbSidebarCollBorder = document.querySelectorAll('.ct-decorate-pane__preferences')
        if(dbSidebarCollBorder){
        dbSidebarCollBorder.forEach(el => {
            el.setAttribute("style", "border-bottom: 1px solid " + newColor + " !important;");
        });
    };
    
    const dbSidebarCollBorderTop = document.querySelectorAll('.ct-decorate-pane__preferences-content')
        if(dbSidebarCollBorderTop){
        dbSidebarCollBorderTop.forEach(el => {
            el.setAttribute("style", "border-top: 1px solid " + newColor + " !important;");
        });
    };
    
    const cosiCheAVolteNonCambiano = document.querySelectorAll('.site .ddbc-theme-link')
        if(cosiCheAVolteNonCambiano){
            cosiCheAVolteNonCambiano.forEach(el => {
            el.setAttribute("style", "color: " + newColor + " !important;");
        });
    };

    const attackBorders = document.querySelectorAll('.ddbc-combat-attack, .ct-description__traits')
        if(attackBorders){
            attackBorders.forEach(el => {
            el.setAttribute("style", "border-color: " + newColor.slice(0,-2)+"33 !important;");
        });
    };
    
    // Iterate over header buttons svg childrens
    for (const child of document.querySelector('.ct-character-header-desktop').children) {
        for (const grandchild of child.children) {
            if (grandchild.getAttribute('role') === 'button') {
                const svg = grandchild.querySelector('svg');
                if (svg) {
                    svg.querySelectorAll('*').forEach(svgChild => {
                        if (svgChild.tagName === 'ellipse') {
                            svgChild.style.stroke = newColor;
                        } else {
                            svgChild.style.fill = newColor;
                        }
                    });
                }
            }
        }
    }

    document.querySelectorAll('circle').forEach(el => {
        el.setAttribute("fill", newColor);
        
        const parentElement = el.parentElement;
        if (parentElement.children.length > 0) {
            // console.log("ci provo")
            parentElement.children[0].setAttribute("fill", newColor);
        }
    });
    document.querySelectorAll('.styles_extra__BgeMp').forEach(el => {
        el.setAttribute("style", "border-color:" + newColor + " !important;");
    });
    document.querySelectorAll("#site-bar > div").forEach(el => {
        el.setAttribute("style", "border-color:" + newColor + " !important;");
    });
    document.querySelectorAll('.ct-class-detail__name').forEach(el => {
        el.setAttribute("style", "color:" + newColor + " !important;");
    });

    const sidebarBey = document.querySelector("#site > div.ct-sidebar__portal > div:nth-child(2) > div > div > div > div.styles_pane__AOt0h > div.styles_content__3knKz.styles_dark__6-qrS.styles_fullWidth__SRmoS > div > div")
    if(sidebarBey){
        sidebarBey.querySelectorAll('svg').forEach(el => {
            el.setAttribute("style", "fill: "+newColor);
            el.querySelectorAll('*').forEach(child => {
                child.setAttribute('fill', newColor);
            });
        });
    };

    const skills = document.querySelectorAll('[role="cell"]');
    for (const skill of skills) {
        const rgbaMatch = skill.style.getPropertyValue('border-color').match(/rgba\(\d+, \d+, \d+, (\d+(\.\d+)?)\)/);
        if (rgbaMatch) {
            const alpha = Math.floor(parseFloat(rgbaMatch[1]) * 255).toString(16).padStart(2, '0');
            const newColorAlpha = newColor.slice(0, -2) + alpha;
            skill.style.setProperty('border-color',newColorAlpha);
        } 
    };

    const profs = document.querySelectorAll('.ct-combat__statuses-group, .ct-proficiency-groups__group, .styles_attack__6-4vH.ddbc-combat-action-attack-weapon.ddbc-combat-attack');
    for (const prof of profs) {
        const rgbaMatch = prof.style.getPropertyValue('border-color').match(/rgba\(\d+, \d+, \d+, (\d+(\.\d+)?)\)/);
        if (rgbaMatch) {
            const alpha = Math.floor(parseFloat(rgbaMatch[1]) * 255).toString(16).padStart(2, '0');
            const newColorAlpha = newColor.slice(0, -2) + alpha;
            prof.style.setProperty('border-color', newColorAlpha);
        }
    };

    const styleSheet = document.querySelector("html > style").sheet;
    if (styleSheet) {
        // console.log(styleSheet.cssRules.length);
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            const rule = styleSheet.cssRules[i];
            // console.log(rule, rule.cssText);
            if ((rule instanceof CSSStyleRule)) {
                if (rule) {
                    const style = rule.style;
                    for (let j = 0; j < style.length; j++) {
                        const property = style[j];
                        if (
                            ( (rule.cssText.includes('.ct-theme-button--outline.ct-button')) &&
                              !(property == 'background-color') &&
                              !(property == 'color')
                            )
                                    ||
                            ( (rule.cssText.includes('.ct-theme-button--outline.ct-button')) &&
                              (rule.cssText.includes(':hover')) &&
                              !(property == 'color')
                            )
                                    ||
                            ( (rule.cssText.includes('ct-theme-button--filled')) &&
                              !(rule.cssText.includes(':disabled')) &&
                              !(property == 'color')
                            )
                                    ||
                            ( (rule.cssText.includes('slot-manager__slot')) &&
                              (rule.cssText.includes('--used')) &&
                              !(property == 'background-color')
                            )
                                    ||
                            ( (rule.cssText.includes('slot-manager__slot')) &&
                              (rule.cssText.includes('--used')) &&
                              (rule.cssText.includes(':before')) &&
                              (property == 'background-color')
                            )
                                    ||
                            ( (rule.cssText.includes('ct-content-group__header'))
                            )
                                    ||
                            ( (rule.cssText.includes('line')) &&
                              !(rule.cssText.includes('.ct-theme-button--outline.ct-button'))
                            )
                                    ||
                            ( (rule.cssText.includes('theme-link')) &&
                              !(rule.cssText.includes('.ct-theme-button--outline.ct-button'))
                            )
                        ) {
                            if (style.getPropertyValue(property).includes('rgba')) {
                                const rgbaMatch = style.getPropertyValue(property).match(/rgba\(\d+, \d+, \d+, (\d+(\.\d+)?)\)/);
                                if (rgbaMatch) {
                                    const alpha = Math.floor(parseFloat(rgbaMatch[1]) * 255).toString(16).padStart(2, '0');
                                    const newColorAlpha = newColor.slice(0, -2) + alpha;
                                    style.setProperty(property, newColorAlpha)
                                } 
                            } else if(property == 'box-shadow'){
                                const boxShadow = style.getPropertyValue(property);
                                const darkColor = newColor.replace(/^#/, '').replace(/../g, c => ('0' + Math.max(0, parseInt(c, 16) - 30).toString(16)).slice(-2));
                                const darkColorRgb = `rgb(${parseInt(darkColor.slice(0, 2), 16)}, ${parseInt(darkColor.slice(2, 4), 16)}, ${parseInt(darkColor.slice(4, 6), 16)})`;
                                const shadow = boxShadow.replace(/rgb\(\d+, \d+, \d+\)/g, darkColorRgb);
                                style.setProperty(property, shadow)
                            }
                            else{style.setProperty(property, newColor);}                     
                        }
                    }
                }
            }
        }
    };

    // console.log(`🎨 Changed Accent color to ${newColor}`);
}
window.applyAccentColor = applyAccentColor;

// Apply Text Color
const whiteClasses = [
    "headerSidebar",
    ".ct-item-slot-manager--empty",
    ".ct-inventory-item__quantity",
    ".ct-inventory-item__cost",
    ".styles_pane__AOt0h .styles_content__3knKz",
    ".styles_pane__AOt0h .ddbc-collapsible__heading",
    ".styles_pane__AOt0h .styles_characterManagePane__cAzM6",
    ".styles_pane__AOt0h .styles_classSummary__190Xx",
    ".styles_pane__AOt0h .ddbc-character-progression-summary__level",
    ".styles_pane__AOt0h .styles_characterName__vGRGp",
    "ct-extra-row__hp-sep",
    "ct-equipment-overview__weight-carried",
    "ct-equipment-overview__weight-carried--dark-mode",
    "styles_tabList__Q4CqK button[aria-checked=true]",
    "ct-extra-row__ac",
    "ct-extra-row__ac--dark-mode",
    "ct-extra-row__hp-value--current",
    "ct-extra-row__name",
    "ct-extra-row__name--dark-mode",
    "styles_item__8bGe2[role]>p",
    "styles_headingDarkMode__YO4Ql",
    "ct-feature-snippet__action-limited-label",
    "ct-feature-snippet__action-summary",
    "ct-feature-snippet__choice",
    "ct-feature-snippet__action-limited-label--dark-mode",
    "ct-feature-snippet__action-summary--dark-mode",
    "ct-feature-snippet__choice--dark-mode",
    "styles_common__4urYa",
    "ct-equipment__container-name",
    "ct-notes__note",
    "ddbc-tooltip",
    "ddbc-tooltip--dark-mode",
    "tss-1r5d1qn-Notification",
    "integrated-dice__container",
    "ct-description",
    "styles_tabFilter__50iSv",
    "styles_content__QjnYw",
    "ct-content-group",
    "ct-content-group__content",
    "ct-background",
    "ct-background__name",
    "ct-background__feature",
    "ct-background__feature-name",
    "ct-background__feature-description",
    "ct-description__physical",
    "styles_physical__2aytL",
    "styles_item__8bGe2",
    "InfoItem_label__+wkfa",
    "InfoItem_value__rVPhW",
    "ct-description__traits",
    "ct-trait-content",
    "ct-trait-content--no-content",
    "ct-trait-content__heading",
    "ct-trait-content__content",
    "sync-blocker",
    "sync-blocker-inactive",
    "sync-blocker-group",
    "sync-blocker-logo",
    "ddbc-animated-loading-ring-svg",
    "sync-blocker-anim",
    "styles_numberDisplay__Rg1za",
    "styles_signed__scf97",
    "ct-proficiency-bonus-box__value",
    "ct-proficiency-bonus-box__value--dark-mode",
    "styles_large__3C8uq",
    "styles_largeDistance__YVw96",
    "styles_label__Bj6YW",
    "styles_dark__+NBMD",
    "styles_label__Ivf2i",
    "styles_input__coHiS",
    "styles_number__j1d93",
    "styles_maxContainer__mt+Ff",
    "ddbc-saving-throws-summary__ability-name",
    "ddbc-saving-throws-summary__ability-name--dark-mode",
    "ddbc-manage-icon",
    "ddbc-manage-icon--edge-icon",
    "ddbc-manage-icon--interactive",
    "ddbc-manage-icon--dark-mode",
    "ddbc-tooltip--is-interactive",
    "ddbc-manage-icon__content",
    "ddbc-manage-icon__icon",
    "ddbc-manage-icon__icon--dark-mode",
    "ct-senses__callout-value",
    "ct-senses__callout-value--dark-mode",
    "ct-senses__callout-label",
    "ct-senses__callout-label--dark-mode",
    "ct-senses__summary",
    "ct-senses__summary--dark-mode",
    "ct-proficiency-groups__group-items",
    "ct-proficiency-groups__group-items--dark-mode",
    "ct-proficiency-groups__group-item",
    "ct-proficiency-groups__group-item--dark-mode",
    "ct-skills__col--skill",
    "ct-skills__col--skill--dark-mode",
    "styles_label__6xv1b",
    "styles_dark__Vo9m3",
    "ddbc-armor-class-box__value",
    "ddbc-armor-class-box__value--dark-mode",
    "ct-defenses-summary__defense",
    "ct-defenses-summary__defense--dark-mode",
    "ddbc-condition__name",
    "ddbc-condition__name--dark-mode",
    "styles_col__3hY1K",
    "styles_darkMode__jYXhg",
    "styles_icon__1IA7a",
    "styles_name__MDLaF",
    "styles_range__Wxk2r",
    "styles_tohit__zsX78",
    "styles_damage__2d1fl",
    "styles_notes__mSXl3",
    "ddbc-combat-attack__label",
    "ddbc-combat-attack__label--dark-mode",
    "ddbc-combat-attack__range-value",
    "ddbc-combat-attack__range-value--dark-mode",
    "ddbc-combat-attack__range-value-close",
    "ddbc-combat-attack__range-value-close--dark-mode",
    "ddbc-damage",
    "ddbc-damage--dark-mode",
    "ddbc-damage__value",
    "ddbc-damage__value--dark-mode",
    "ddbc-damage__icon",
    "ddbc-damage-type-icon",
    "ddbc-damage-type-icon--piercing",
    "ddbc-damage-type-icon__img",
    "ddbc-damage-type-icon__img--piercing",
    "ddbc-damage-type-icon--radiant",
    "ddbc-damage-type-icon__img--radiant",
    "ddbc-damage-type-icon--force",
    "ddbc-damage-type-icon__img--force",
    "ddbc-damage-type-icon--thunder",
    "ddbc-damage-type-icon__img--thunder",
    "styles_spellName__wX3ll",
    "ddbc-combat-attack__spell-range",
    "ddbc-combat-attack__spell-range-value",
    "ddbc-damage-type-icon--fire",
    "ddbc-damage-type-icon__img--fire",
    "ddbc-damage-type-icon--acid",
    "ddbc-damage-type-icon__img--acid",
    "ddbc-combat-attack__save-value",
    "ddbc-combat-attack__save-value--dark-mode",
    "styles_sectionHeading__f715p",
    "ct-basic-actions",
    "ct-basic-actions--dark-mode",
    "ct-basic-actions__action",
    "ct-basic-actions__action-sep",
    "ct-feature-snippet__heading",
    "ct-feature-snippet__heading--dark-mode",
    "ddbc-snippet",
    "ddbc-snippet--parsed",
    "ddbc-snippet--dark-mode",
    "jsx-parser",
    "ddbc-snippet__content",
    "ddbc-snippet__tag",
    "ddbc-combat-attack__spell-range-origin",
    "ddbc-combat-attack__spell-range-origin--dark-mode",
    "ddbc-damage-type-icon--lightning",
    "ddbc-damage-type-icon__img--lightning",
    "ddbc-action-name",
    "styles_concentrationIcon__BsaNr",
    "styles_icon__Heo9G",
    "styles_svg__Jr+M-",
    "Tooltip_container__20y9m",
    "ct-feature-snippet__limited-use",
    "ct-feature-snippet__limited-use--dark-mode",
    "ct-feature-snippet__limited-use-usages",
    "ct-feature-snippet__limited-use-reset",
    "ct-slot-manager",
    "ct-slot-manager--size-small",
    "ct-slot-manager__slot",
    "ct-slot-manager__slot--interactive",
    "ddbc-combat-attack__empty",
    "ddbc-action-name__customized",
    "ct-feature-snippet__heading-activation",
    "ct-feature-snippet__heading-activation--dark-mode",
    "ddb-footer__link",
    "styles_arrows__182cG",
    "styles_solid__2ijrG",
    "styles_dark__O1vGK",
    "styles_fullWidth__dRMhB",
    "styles_mobile__6xVb4",
    "css-79xub",
    "MuiBox-root",
    "css-dgzhqv",
    "MuiTypography-body1",
    "dice-toolbar__target-user",
    "css-9l3uo3",
    "dice-toolbar__target-roll",
    "css-k58djc",
    "MuiSvgIcon-root",
    "MuiSvgIcon-fontSizeMedium",
    "css-vubbuv"
];
const grayClasses = [
    '.ct-defenses-summary__default',
    '.ct-conditions-summary__default',
    '.ct-button__content',
    ".ddbc-attunement-slot__meta",
    "ct-spell-detail__components-description",
    ".styles_pane__AOt0h .ct-item-detail__spell-damage-group-data-origin",
    ".styles_pane__AOt0h .ct-item-detail__spell-damage-group-restriction",
    ".ct-spells-spell__empty-value",
    "ct-spells-spell__notes",
    "ct-attunement__meta",
    "ct-attunement__group-header",
    "ddbc-spell-damage-effect",
    "ddbc-spell-damage-effect--dark-mode",
    "ct-inventory-item__meta",
    "ct-inventory-item__meta--dark-mode",
    ".styles_pane__AOt0h .ddbc-character-summary",
    String.raw`styles_classMeta__Pd\+W2`,
    "styles_reference__4pmEk",
    "ct-equipment__container-weight-capacity",
    "ct-equipment-overview__weight-speed",
    "ct-equipment__container-quantity",
    "ct-character-sheet",
    "ct-character-sheet--dark-mode",
    "ct-spells-level-casting__info-label",
    "ct-spells-spell__save-label",
    "ct-actions__attacks-per-action",
    "ct-actions__attacks-per-action--dark-mode",
    ".styles_tabButton__wvSLf",
    "ct-extra-row__hp-value--total",
    "ct-extra-row__meta",
    "ct-extra-row__meta--dark-mode",
    "ct-extra-row__meta",
    "ct-extra-row__meta--dark-mode",
    "styles_legacy__hyrw1",
    "styles_expanded__goxgO",
    "styles_level__yuVR8",
    "ddbc-combat-attack__save-label",
    "ddbc-combat-attack__range-label",
    "ddbc-combat-attack__meta",
    "ddbc-combat-attack__meta--dark-mode",
    "ddbc-combat-attack__range-value-long",
    "ct-spells-filter__input[type=search]",
    ".ct-spells-level__spells-row-header",
    ".ct-spells-level__spells-row-header--dark-mode",
    "ct-spells-spell__meta-item",
    "ddbc-spell-damage-effect__tags",
    "styles_labelSignColor__Klmbs",
    "styles_label__L8mZK",
    "ct-spells-spell__at-will",
    "ddbc-note-components__component",
    "ddbc-note-components__component--dark-mode",
    "styles_buttons__hGhtB",
    "ddbc-combat-attack__notes",
    "ct-character-sheet",
    "ct-character-sheet--dice-enabled",
    "ct-character-sheet--dark-mode",
    "ct-character-sheet__inner",
    "ct-character-sheet-desktop",
    "ct-quick-info",
    "ct-quick-info__abilities",
    "ct-quick-info__ability",
    "ddbc-ability-summary",
    "ddbc-box-background",
    "ddbc-svg",
    "ddbc-ability-score-box-svg",
    "ddbc-ability-summary__heading",
    "ddbc-ability-summary__label",
    "ddbc-ability-summary__label--dark-mode",
    "ddbc-ability-summary__abbr",
    "ddbc-ability-summary__primary",
    "ddbc-ability-summary__primary--dark-mode",
    "ddbc-ability-summary__secondary",
    "ddbc-ability-summary__secondary--dark-mode",
    "ct-quick-info__box",
    "ct-quick-info__box--proficiency",
    "ct-proficiency-bonus-box",
    "ct-proficiency-bonus-box__heading",
    "ct-proficiency-bonus-box__heading--dark-mode",
    "ct-proficiency-bonus-box__label",
    "ct-proficiency-bonus-box__label--dark-mode",
    "ct-quick-info__box--speed",
    "ct-speed-box",
    "ct-speed-box__heading",
    "ct-speed-box__heading--dark-mode",
    "ct-speed-box__box-value",
    "ct-speed-box__box-value--dark-mode",
    "ct-speed-box__label",
    "ct-speed-box__label--dark-mode",
    "ct-quick-info__inspiration",
    "styles_box__6xvSR",
    "styles_interactive__0wY9H",
    "ddbc-inspiration-box-svg",
    "styles_status__wfjbc",
    "ct-quick-info__health",
    "styles_hitPointsBox__iqcr7",
    "styles_content__nPt0e",
    "styles_container__1cATf",
    "styles_container__nsTN6",
    "styles_innerContainer__Xn2+o",
    "styles_item__UVpsr",
    "styles_label__ysVMP",
    "styles_spacer__fglT0",
    "styles_number__j1d93",
    "styles_slash__UmBPf",
    "accessibility_screenreaderOnly__OEzRB",
    "styles_temp__pxAha",
    "styles_valueButton__0rK5Z",
    "styles_tempEmpty__fI4gV",
    "ct-subsections",
    "ct-subsection",
    "ct-subsection--abilities",
    "ct-saving-throws-box",
    "ct-saving-throws-box__abilities",
    "ddbc-saving-throws-summary",
    "ddbc-saving-throws-summary__ability",
    "ddbc-saving-throws-summary__ability--str",
    "ddbc-saving-throw-row-box-svg",
    "ddbc-svg--themed",
    "ddbc-saving-throws-summary__ability-proficiency",
    "ddbc-tooltip",
    "ddbc-tooltip--dark-mode",
    "ddbc-proficiency-svg",
    "ddbc-proficiency-icon",
    "ddbc-proficiency-level-icon",
    "ddbc-saving-throws-summary__ability-modifier",
    "ddbc-saving-throw-selection-box-svg",
    "ddbc-saving-throws-summary__ability-modifier-background",
    "ddbc-saving-throws-summary__ability--dex",
    "ddbc-saving-throws-summary__ability--con",
    "ddbc-saving-throws-summary__ability--int",
    "ddbc-saving-throws-summary__ability--wis",
    "ddbc-saving-throws-summary__ability--cha",
    "ct-saving-throws-box__info",
    "ct-saving-throws-box__modifiers",
    "ct-saving-throws-box__modifiers--multi",
    "ct-saving-throws-box__modifiers--dark-mode",
    "ct-saving-throws-box__modifier",
    "ct-dice-adjustment-summary",
    "ct-dice-adjustment-summary__icon",
    "ddbc-advantage-icon",
    "ddbc-advantage-svg",
    "ddbc-svg--positive",
    "ct-dice-adjustment-summary__restriction",
    "ct-dice-adjustment-summary__description",
    "ct-dice-adjustment-summary__description--ability",
    "ct-dice-adjustment-summary__description--ability--dark-mode",
    "ddbc-bonus-positive-svg",
    "ct-dice-adjustment-summary__value",
    "ct-subsection__footer",
    "ct-senses-desktop",
    "ct-subsection--senses",
    "ct-senses-box",
    "ct-senses",
    "ct-senses__callouts",
    "ct-senses__callout",
    "ddbc-sense-row-box-svg",
    "ct-subsection--proficiency-groups",
    "ct-proficiency-groups-box",
    "ct-proficiency-groups",
    "ct-proficiency-groups__group",
    "ct-proficiency-groups__group-label",
    "ct-proficiency-groups__group-label--dark-mode",
    "ct-subsection--skills",
    "ct-skills-box",
    "ct-skills",
    "ct-skills--dark-mode",
    "ct-skills__header",
    "ct-skills__col--proficiency",
    "ct-skills__heading",
    "ct-skills__heading--dark-mode",
    "ct-skills__col--stat",
    "ct-skills__col--modifier",
    "ct-skills__list",
    "ct-skills__item",
    "ddbc-no-proficiency-icon",
    "ddbc-no-proficiency-icon--dark-mode",
    "ct-skills__col--stat--dark-mode",
    "ct-skills__col--modifier--dark-mode",
    "ddbc-twice-proficiency-icon",
    "ddbc-twice-proficiency-icon--modified",
    "ddbc-proficiency-half-svg",
    "ddbc-twice-proficiency-icon__inner",
    "ct-subsection--combat",
    "ct-combat",
    "ct-combat__summary",
    "ct-combat__summary-group",
    "ct-combat__summary-group--initiative",
    "styles_box__PLQui",
    "styles_value__hqDak",
    "ddbc-initiative-box-svg",
    "ct-combat__summary-group--ac",
    "ddbc-armor-class-box",
    "ddbc-armor-class-box-svg",
    "ddbc-armor-class-box__label",
    "ddbc-armor-class-box__label--dark-mode",
    "ct-combat__summary-group--statuses",
    "ct-combat__statuses",
    "ct-combat__statuses-group",
    "ct-combat__statuses-group--defenses",
    "ct-combat__summary-label",
    "ct-combat__summary-label--dark-mode",
    "ct-defenses-summary",
    "ct-defenses-summary__group",
    "ct-defenses-summary__group-preview",
    "ddbc-resistance-icon",
    "ct-defenses-summary__group-items",
    "ddbc-immunity-icon",
    "ct-combat__statuses-group--conditions",
    "ct-conditions-summary",
    "ddbc-condition",
    "ct-subsection--primary-box",
    "ct-primary-box",
    "ct-primary-box--dark-mode",
    "styles_tabList__Q4CqK",
    "styles_tabs__aTttL",
    "styles_tabButton__wvSLf",
    "ct-primary-box__tab--actions",
    "ct-actions",
    "styles_tabFilter__50iSv",
    "styles_content__QjnYw",
    "styles_actionsList__tw2cW",
    "styles_attackTable__E+HtW",
    "styles_tableHeader__Ow6Oy",
    "ddbc-combat-attack--item",
    "ddbc-combat-item-attack--ranged",
    "styles_attack__6-4vH",
    "ddbc-combat-attack",
    "ddbc-combat-attack__icon",
    "ddbc-combat-attack__icon-img--weapon-spell-damage",
    "ddbc-attack-type-icon",
    "ddbc-attack-type-icon--1-2",
    "ddbc-attack-type-icon--weapon-spell",
    "ddbc-combat-attack__name",
    "ddbc-combat-attack__range",
    "ddbc-combat-attack__action",
    "ddbc-combat-attack__tohit",
    "ddbc-combat-attack__damage",
    "ddbc-combat-item-attack__damage",
    "ddbc-combat-item-attack--melee",
    "ddbc-attack-type-icon--1-1",
    "ddbc-combat-attack--spell",
    "ddbc-combat-attack__icon-img--spell-school-necromancy",
    "ddbc-spell-school-icon",
    "ddbc-spell-school-icon--necromancy",
    "ddbc-combat-attack__icon-img--spell-school-evocation",
    "ddbc-spell-school-icon--evocation",
    "ddbc-combat-attack__icon-img--spell-school-transmutation",
    "ddbc-spell-school-icon--transmutation",
    "ddbc-combat-attack__save",
    "styles_section__sO+fQ",
    "styles_activatable__ismyq",
    "ct-feature-snippet",
    "ct-feature-snippet__content",
    "ddbc-combat-action-attack-spell",
    "ddbc-combat-attack__icon-img--action-attack-spell-ranged",
    "ddbc-attack-type-icon--2-2",
    "prefix__cls-1",
    "prefix__cls-5",
    "ct-feature-snippet__spells",
    "ct-feature-snippet__spells--layout-compact",
    "ct-feature-snippet__spells--dark-mode",
    "ct-feature-snippet__spell",
    "ct-feature-snippet__spell-summary",
    "ct-feature-snippet__spell-sep",
    "ct-feature-snippet__limited-use-extra",
    "ct-slot-manager-large",
    "ct-slot-manager-large__values",
    "ct-slot-manager-large__label",
    "ct-slot-manager-large__value-control",
    "ct-slot-manager-large__value-control--use",
    "ct-slot-manager-large__value",
    "ct-slot-manager-large__value--cur",
    "ct-slot-manager-large__value-control--gain",
    "ddbc-combat-action-attack-general",
    "ddbc-combat-attack__icon-img--action-attack-general-melee",
    "prefix__st0",
    "prefix__st1",
    "prefix__st2",
    "prefix__st3",
    "prefix__st5",
    "prefix__st6",
    "prefix__st8",
    "prefix__st9",
    "prefix__st11",
    "prefix__st12",
    "prefix__st13",
    "prefix__st15",
    "prefix__st16",
    "prefix__st18",
    "prefix__st19",
    "ddbc-combat-attack__empty"
];
function applyTextColor(newColor, num) {
    // Determine an id for the style element based on which set you're targeting.
    var styleId = (num) ? 'whiteTextColorStyle' : 'grayTextColorStyle';
    let styleEl = document.getElementById(styleId);
    // console.log(`${styleId}, ${num}`)
    
    // Create a style element if it doesn't exist.
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    var classes = (num) ? whiteClasses : grayClasses;
    const selectors = classes
        .filter(cls => cls.trim() !== "")
        .map(cls => cls.trim().startsWith('.') ? cls.trim() : '.' + cls.trim())
        .join(', ');
    
    // Update the CSS rule—this one rule applies to all matched elements.
    var cssText = `
        ${selectors}{
            color: ${newColor} !important;
        }
    `;
    var cssGreySVG = `
        /* Only override fill if a fill attribute is present */
        .ddbc-combat-attack * path[fill],
        .ddbc-combat-attack * line[fill],
        .ddbc-combat-attack * polygon[fill],
        .ddbc-damage-type-icon__img path[fill],
        .ddbc-damage-type-icon__img line[fill],
        .ddbc-damage-type-icon__img polygon[fill],
        .ddbc-damage-type-icon__img * path[fill],
        .ddbc-damage-type-icon__img * line[fill],
        .ddbc-damage-type-icon__img * polygon[fill],
        .ddbc-spell-damage-effect__healing path[fill],
        .ddbc-attunement-icon__icon path[fill],
        .ddbc-attunement-icon__icon line[fill],
        .ddbc-attunement-icon__icon polygon[fill],
        .styles_svg__Jr\\+M- rect[fill],
        .ddbc-aoe-type-icon path[fill],
        .ddbc-collapsible__header-status path[fill],
        .ddbc-attack-type-icon g[fill],
        .ddbc-attack-type-icon path[fill] {
            fill: ${newColor} !important;
        }
        
        /* Only override stroke if a stroke attribute is present */
        .ddbc-combat-attack * path[stroke],
        .ddbc-combat-attack * line[stroke],
        .ddbc-combat-attack * polygon[stroke],
        .ddbc-damage-type-icon__img path[stroke],
        .ddbc-damage-type-icon__img line[stroke],
        .ddbc-damage-type-icon__img polygon[stroke],
        .ddbc-damage-type-icon__img * path[stroke],
        .ddbc-damage-type-icon__img * line[stroke],
        .ddbc-damage-type-icon__img * polygon[stroke],
        .ddbc-spell-damage-effect__healing path[stroke],
        .ddbc-attunement-icon__icon path[stroke],
        .ddbc-attunement-icon__icon line[fill],
        .ddbc-attunement-icon__icon polygon[fill] {
            stroke: ${newColor} !important;
        }
        
        /* Dumb svgs */
        .prefix__st0,prefix__st1,prefix__st2,prefix__st3 {
            fill: ${newColor} !important
        }
    `;
    if(!num){cssText = cssText+cssGreySVG}
    styleEl.innerHTML = cssText;
}
window.applyTextColor = applyTextColor;


// ----- Save Functions -----

// Function to Save Backdrop
function saveBackdrop(fileInput) {
    const characterID = getCharacterID();
    if (!characterID) {
        return;
    }

    const file = fileInput.files[0];
    if (!file) {
        alert("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result;
        // console.log(`📤 Storing backdrop for Character ${characterID}`);

        let saveData = {};
        saveData[`backdrop_${characterID}`] = imageData;

        chrome.storage.local.set(saveData, () => {
            // console.log(`✅ Backdrop saved for Character ${characterID}`);
            applyBackdrop();
        });
    };

    reader.readAsDataURL(file);
};
window.saveBackdrop = saveBackdrop;

function saveFrame(fileInput) {
    const characterID = getCharacterID();
    if (!characterID) {
        return;
    }

    const file = fileInput.files[0];
    if (!file) {
        alert("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result;
        // console.log(`📤 Storing backdrop for Character ${characterID}`);

        let saveData = {};
        saveData[`frame_${characterID}`] = imageData;

        chrome.storage.local.set(saveData, () => {
            // console.log(`✅ Backdrop saved for Character ${characterID}`);
            applyFrame();
        });
    };

    reader.readAsDataURL(file);
};
window.saveFrame = saveFrame;

// Save colors
function saveColor(color, type){
    const characterID = getCharacterID();
    if (!characterID) {
        return;
    };
    if (!color || !type){
        // console.log(`No color: ${color} or type: ${type}`)
        return
    }
    let saveData = {};
    // console.log(`${type}_${characterID}`)
    saveData[`${type}_${characterID}`] = color;

    chrome.storage.local.set(saveData, () => {
        // console.log(`✅ ${type} color saved for character ${characterID}:`, saveData[`${type}_${characterID}`]);
    });

}
window.saveColor = saveColor;


// ------------------------------
let rainbowInterval;

function startRainbowMode() {
    // console.log("🌈 Starting Rainbow Mode...");
    let hue = 0;

    rainbowInterval = setInterval(() => {
        const hslToHex = (h, s, l) => {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        };
        const color = hslToHex(hue, 100, 50)+'ff';
        
        applyBorderColor(color);
        applyAccentColor(color);
        // console.log(`🎨 Updated colors to ${color}`);

        hue = (hue + 10) % 360; // Increment hue, loop at 360
    }, 200); // Change color every 200ms
}
window.startRainbowMode = startRainbowMode;

function stopRainbowMode() {
    // console.log("🛑 Stopping Rainbow Mode...");
    clearInterval(rainbowInterval);
    const characterID = getCharacterID();
        if (characterID) {
            for (const type of ['background', 'border', 'accent']) {
                storage.get(`${type}_${characterID}`).then((data) => {
                    if (data[`${type}_${characterID}`]) {
                        // console.log(`${type} color found for character ${characterID}`);
                        window[`apply${type.charAt(0).toUpperCase() + type.slice(1)}Color`](data[`${type}_${characterID}`]);
                    } else {
                        // console.log(`No ${type} color found for character ${characterID}`);
                    }
                }).catch(error => {
                    console.error(`Error accessing ${type} storage:`, error);
                })
            }
        };
}
window.stopRainbowMode = stopRainbowMode;
// ------------------------------


// ----- Remove Functions -----

// Function to remove the backdrop from storage
function removeBackdrop() {
    const characterID = getCharacterID();
    if (!characterID) {
        return;
    }

    chrome.storage.local.remove(`backdrop_${characterID}`, () => {
        // console.log(`Backdrop removed for Character ${characterID}`);
    });
};
window.removeBackdrop = removeBackdrop;

function removeFrame() {
    const characterID = getCharacterID();
    if (!characterID) {
        return;
    }

    chrome.storage.local.remove(`frame_${characterID}`, () => {
        // console.log(`Frame removed for Character ${characterID}`);
    });
};
window.removeFrame = removeFrame;


function removeColor(type) {
    const characterID = getCharacterID();
    if (!characterID) {
        return;
    }

    chrome.storage.local.remove(`${type}_${characterID}`, () => {
        // console.log(`${type} color removed for Character ${characterID}`);
    });
};
window.removeBackdrop = removeBackdrop;


// ----- Event Listeners and Observers -----
function updateSavedColors(){
    const characterID = getCharacterID();
    if (characterID) {
        for (const type of ['background', 'header', 'border', 'accent', 'text1', 'text0']) {
            storage.get(`${type}_${characterID}`).then((data) => {

                var typeOf = type
                var num = 3
                if(typeOf.slice(0,4) == 'text'){num = Number(typeOf.slice(-1)); typeOf = 'text';}

                if (data[`${type}_${characterID}`]) {
                    // console.log(`${type} color found for character ${characterID}`);
                    // console.log(`${type}_${characterID}, numero: ${num}`)
                    window[`apply${typeOf.charAt(0).toUpperCase() + typeOf.slice(1)}Color`](data[`${type}_${characterID}`],num);
                } else {
                    // console.log(`No ${type} color found for character ${characterID}`);
                }
            }).catch(error => {
                console.error(`Error accessing ${type} storage: `, error);
            })
        }
    };
};


// DOM ready
if (document.readyState === "complete" || document.readyState === "interactive") {
    console.log("DOM is ready listener");
    applyBackdrop();
   applyFrame();
    injectButton();
    updateSavedColors();

    // const characterID = getCharacterID();
    // if (characterID) {
    //     for (const type of ['background', 'border', 'accent', 'text1', 'text0']) {
    //         storage.get(`${type}_${characterID}`).then((data) => {

    //             var typeOf = type
    //             var num = 3
    //             if(typeOf.slice(0,4) == 'text'){num = typeOf.slice(-1); typeOf = 'text';}

    //             if (data[`${type}_${characterID}`]) {
    //                 // console.log(`${type} color found for character ${characterID}`);
    //                 window[`apply${typeOf.charAt(0).toUpperCase() + typeOf.slice(1)}Color`](data[`${type}_${characterID}`],num);
    //             } else {
    //                 // console.log(`No ${type} color found for character ${characterID}`);
    //             }
    //         }).catch(error => {
    //             console.error(`Error accessing ${type} storage: `, error);
    //         })
    //     }
    // };

} else {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM is loaded listener");
        applyBackdrop();
      applyFrame();
        injectButton();
        updateSavedColors();

        // const characterID = getCharacterID();
        // if (characterID) {
        //     for (const type of ['background', 'border', 'accent', 'text1', 'text0']) {
        //         storage.get(`${type}_${characterID}`).then((data) => {
    
        //             var typeOf = type
        //             var num = 3
        //             if(typeOf.slice(0,4) == 'text'){num = typeOf.slice(-1); typeOf = 'text';}
    
        //             if (data[`${type}_${characterID}`]) {
        //                 // console.log(`${type} color found for character ${characterID}`);
        //                 window[`apply${typeOf.charAt(0).toUpperCase() + typeOf.slice(1)}Color`](data[`${type}_${characterID}`],num);
        //             } else {
        //                 // console.log(`No ${type} color found for character ${characterID}`);
        //             }
        //         }).catch(error => {
        //             console.error(`Error accessing ${type} storage: `, error);
        //         })
        //     }
        // };
    });
}

// Run when the page loads
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM is content listener");
    applyBackdrop();
   applyFrame();
    injectButton();
    updateSavedColors();

    // const characterID = getCharacterID();
    // if (characterID) {
    //     for (const type of ['background', 'border', 'accent', 'text1', 'text0']) {
    //         storage.get(`${type}_${characterID}`).then((data) => {

    //             var typeOf = type
    //             var num = 3
    //             if(typeOf.slice(0,4) == 'text'){num = typeOf.slice(-1); typeOf = 'text';}

    //             if (data[`${type}_${characterID}`]) {
    //                 // console.log(`${type} color found for character ${characterID}`);
    //                 window[`apply${typeOf.charAt(0).toUpperCase() + typeOf.slice(1)}Color`](data[`${type}_${characterID}`],num);
    //             } else {
    //                 // console.log(`No ${type} color found for character ${characterID}`);
    //             }
    //         }).catch(error => {
    //             console.error(`Error accessing ${type} storage: `, error);
    //         })
    //     }
    // };
});

// Fix for Firefox: Ensure storage access is allowed
document.addEventListener("visibilitychange", () => {
    // console.log("visibility change listener");
    if (document.visibilityState === "visible") {
        applyBackdrop();
         applyFrame();
        // injectButton();
        updateSavedColors();

        // const characterID = getCharacterID();
        // if (characterID) {
        //     for (const type of ['background', 'border', 'accent', 'text1', 'text0']) {
        //         storage.get(`${type}_${characterID}`).then((data) => {
    
        //             var typeOf = type
        //             var num = 3
        //             if(typeOf.slice(0,4) == 'text'){num = typeOf.slice(-1); typeOf = 'text';}
    
        //             if (data[`${type}_${characterID}`]) {
        //                 // console.log(`${type} color found for character ${characterID}`);
        //                 window[`apply${typeOf.charAt(0).toUpperCase() + typeOf.slice(1)}Color`](data[`${type}_${characterID}`],num);
        //             } else {
        //                 // console.log(`No ${type} color found for character ${characterID}`);
        //             }
        //         }).catch(error => {
        //             console.error(`Error accessing ${type} storage: `, error);
        //         })
        //     }
        // };
    }
});

// Monitor for dynamically loaded content (in case the backdrop is loaded late)
const debouncedButton = debounce(injectButton,10);
const observer = new MutationObserver(() => {
    console.log("Mutation observer");

    applyBackdrop();
   applyFrame();
    updateSavedColors();
    
    const buttonPresente = document.getElementById(injectedBtnId)
    if(!buttonPresente && !injectionPending){
        console.log("test");
        debouncedButton();
    }

    // const characterID = getCharacterID();
    // if (characterID) {
    //     for (const type of ['background', 'border', 'accent', 'text1', 'text0']) {
    //         storage.get(`${type}_${characterID}`).then((data) => {

    //             var typeOf = type
    //             var num = 3
    //             if(typeOf.slice(0,4) == 'text'){num = typeOf.slice(-1); typeOf = 'text';}

    //             if (data[`${type}_${characterID}`]) {
    //                 // console.log(`${type} color found for character ${characterID}`);
    //                 window[`apply${typeOf.charAt(0).toUpperCase() + typeOf.slice(1)}Color`](data[`${type}_${characterID}`],num);
    //             } else {
    //                 // console.log(`No ${type} color found for character ${characterID}`);
    //             }
    //         }).catch(error => {
    //             console.error(`Error accessing ${type} storage: `, error);
    //         })
    //     }
    // };

});
observer.observe(document.body, { childList: true, subtree: true });

// -----
console.log("Watching for changes..."); 