# D&D Beyond Character Customizer

## Overview

D&D Beyond Character Customizer is a browser extension for Chrome and Firefox designed to transform the standard character sheet into an immersive RPG interface. It provides a suite of visual tools to theme character sheets according to class, background, or campaign setting.

---

## Visual Features

### Environment and Assets
* **Custom Backdrops:** Upload and save unique high-resolution backgrounds for each character.
* **Dynamic Frames:** Upload custom portrait frames with multiple masking shapes including Circle, Diamond, and Hexagon.

### Component Materials
* **Advanced Box Styles:** Choose between Solid Color, Frosted Glass, Ancient Parchment, or Hewn Stone materials.
* **Precision Shape Clipping:** Textures and effects are clipped to the exact shape of D&D Beyond's UI components using advanced SVG path extraction.
* **Dynamic Glass Tinting:** The Frosted Glass material inherits selected base colors and transparency levels for a custom tinted appearance.

### Global Theme Control
* **Unified Color Overrides:** Modify box backgrounds, borders, headers, and UI accents through a single interface.
* **Aggressive Theming:** Overrides default D&D Beyond colors on proficiency indicators, inspiration icons, and action buttons.
* **Google Fonts Integration:** Support for fantasy-themed typography including Cinzel, MedievalSharp, and Pirata One.

### Readability Enhancements
* **Accent-Tinted Text:** Automatically tints secondary labels and descriptions to match your chosen accent color.
* **High-Contrast Shadows:** Implements dual-layer text shadows to ensure legibility against complex background textures.
* **Bold Modifiers:** Enhances the visibility of HP modifiers and numerical sign-values.

### Immersive Effects
* **Health Orb Layout:** Replaces the standard HP box with a dynamic, glowing 3D sphere that reflects current health percentages.
* **Dynamic Health Vignette:** A reactive border effect that pulses when a character is Bloodied (below 50% HP) or Critical (below 25% HP).
* **Particle Engine:** A high-performance overlay featuring effects such as Clockwork Gears, Autumn Leaves, Eldritch Sparks, and Weather effects.
* **Item Rarity Auras:** Adds visual glows and unique typography to inventory items based on their rarity level.

---

## Installation

### Chrome
1. Download or clone this repository to your local machine.
2. Navigate to `chrome://extensions/` in your browser.
3. Enable "Developer mode" using the toggle in the top-right corner.
4. Click "Load unpacked" and select the project folder.

### Firefox
1. Download or clone this repository to your local machine.
2. Navigate to `about:debugging#/runtime/this-firefox` in your browser.
3. Click "Load Temporary Add-on...".
4. Select the `manifest.json` file from the project folder.

---

## Usage

1. Open any D&D Beyond Character Sheet.
2. Locate and click the Customizer Icon in the top header (near the Short Rest button).
3. Use the sidebar to modify environment settings, colors, and effects in real-time.
4. Settings are automatically saved and persisted per character ID.

---

## License

This project is licensed under the MIT License.

Note: This project is a modified version of the D&D Beyond Backdrop Replacer, featuring enhanced CSS and JavaScript logic for an updated user interface.
