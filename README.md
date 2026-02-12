# D&D Beyond Character Customizer

## About

**D&D Beyond Character Customizer** is a powerful browser extension (Chrome & Firefox) that transforms the standard character sheet into a premium, immersive RPG experience. It provides extensive visual tools to theme your sheet according to your character's class, background, or campaign setting.

---

## 🎨 Visual Features

### 🖼️ Environment & Assets
- **Custom Backdrops** – Upload and save unique high-resolution backgrounds for each character.
- **Dynamic Frames** – Upload custom portrait frames and choose from multiple masking shapes (Circle, Diamond, Hexagon, etc.).

### 💎 Component Materials
- **Advanced Box Styles** – Choose between **Solid Color**, **Frosted Glass** (with dynamic backdrop blur), **Ancient Parchment**, or **Hewn Stone**.
- **SVG Clipping** – Textures like Stone and Parchment are surgically clipped to the exact shape of D&D Beyond's UI boxes (like the AC shield) for a perfect fit.

### 🌈 Global Theme Control
- **Unified Color Overrides** – Change the color of box backgrounds, borders, headers, and UI accents with one click.
- **Aggressive Theming** – Overrides "stuck" D&D Beyond colors on proficiency dots, inspiration suns, cast buttons, and modifier boxes.
- **Google Fonts Integration** – Choose from fantasy-ready fonts like *Cinzel*, *MedievalSharp*, and *Pirata One*.

### 📖 Readability Boost
- **Accent-Tinted Text** – Automatically tints secondary text (labels, weights, descriptions) with your accent color for a professional "book" feel.
- **High-Contrast Shadows** – Injects dual-layer text shadows across the entire sheet to ensure legibility against any background texture.
- **Bold Modifiers** – Forces HP modifiers and sign-values (+/-) to be extra bold and visible.

### 🎭 Immersive Effects
- **Health Orb Layout** – A dynamic, glowing 3D health sphere that replaces the standard HP box. The red liquid inside rises and falls based on your current health percentage.
- **Dynamic Health Vignette** – A reactive red border that pulses when your character is "Bloodied" (below 50% HP) or "Critical" (below 25% HP).
- **Particle Engine** – A high-performance canvas overlay with multiple effects: *Clockwork Gears*, *Autumn Leaves*, *Eldritch Sparks*, *Holy Light*, *Rain*, and more.
- **Item Rarity Auras** – Adds magical glows and specific text-styling to items in your inventory based on their rarity (Legendary items pulse with gold, Artifacts cycle through rainbows).

---

## 🚀 Installation

### For Chrome
1. Download or clone this repository.
2. Open `chrome://extensions/`.
3. Enable **Developer Mode** (top-right toggle).
4. Click **Load Unpacked** and select the extension folder.

### For Firefox
1. Download or clone this repository.
2. Open `about:addons`.
3. Click the gear icon and select **Debug Add-ons**.
4. Click **Load Temporary Add-on** and select the `manifest.json`.

---

## 🛠️ Usage
1. Open any **D&D Beyond Character Sheet** (`https://www.dndbeyond.com/characters/XXXXXX`).
2. Click the **Injected Customizer Icon** in the top header (near the "Short Rest" button).
3. Use the sidebar to tweak your environment, colors, and effects in real-time.
4. Settings are **saved automatically** per character ID!

---

## 📜 License
This project is licensed under the **MIT License**. 

*Note: This is a highly modified fork of the original D&D Beyond Backdrop Replacer, enhanced with advanced CSS/JS logic for a modern RPG interface.*
