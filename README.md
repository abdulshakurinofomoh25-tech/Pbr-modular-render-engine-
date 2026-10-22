# 3D PBR Real-Time Studio Engine & Mobile Viewer

An enterprise-grade, browser-based 3D WebGL / WebGPU rendering engine and material studio built with Three.js. This application offers real-time Physically Based Rendering (PBR), customizable procedural HDRI environment lighting, post-processing unreal bloom effects, and a complete suite of multi-format exporters (including WASM Draco mesh compression).

---

## 🌟 Key Features

### 🎨 Real-Time PBR Material Studio
- **Physical Material Controls**: Full control over Roughness, Metalness, Transmission (glass opacity), Clearcoat, and Emissive intensity.
- **Instant Material Presets**: High-fidelity, one-touch presets for Gold, Chrome, Glass, Car Paint, Sci-Fi Metallic, Ceramic, Plastic, and Copper.
- **Wireframe & Geometry Overlay**: Real-time wireframe toggle and interactive mesh focus controls.

### 💡 Procedural Lighting & Environment
- **Procedural HDRI Map Generator**: Dynamically generates equirectangular studio softbox lighting using standard HTML5 Canvas without external HDRI asset overhead.
- **Lighting Controls**: Adjustable key light direction, intensity, ambient fill, exposure mapping, and solid color/HDRI background switching.
- **Unreal Bloom Post-Processing**: Shader-pass bloom effects powered by Three.js `EffectComposer` and `UnrealBloomPass`.

### 📂 Multi-Format Importers & Mesh Parsers
- **3D File Formats Supported**: Drag-and-drop or upload custom `.glb`, `.gltf`, `.obj`, and `.drc` (Draco compressed) geometry.
- **Automatic Mesh Normalization**: Auto-calculates bounding boxes, scales models to fit viewport bounds, and normalizes materials on load.

### 📤 High-Performance Multi-Format Exporters
- **Draco Compressed GLB Export**: Integrated `DRACOExporter` with configurable WASM compression levels (1–10) for ultra-compact storage.
- **Standard 3D Exports**: Export to uncompressed `.glb`, JSON-based `.gltf`, Wavefront `.obj`, and native Three.js scene `.json`.
- **Vertex Data CSV Export**: Extracts complete mesh positional vectors (X, Y, Z) and surface normals to structured CSV tables for analysis.

### ⚡ Performance & Mobile Optimization
- **Responsive Mobile Controls**: Glassmorphism sliding bottom drawer built with Tailwind CSS, touch gesture bindings (pinch zoom, 2-finger pan, 1-finger rotate).
- **Adaptive Auto-FPS Engine**: Dynamically monitors frame rates and scales down pixel ratio and shadow rendering when performance drops below threshold.
- **Local Project Storage**: Save and reload studio configurations, camera states, bloom settings, and material parameters locally in browser storage.

---

## 📁 Repository Structure

```text
.
├── index.html            # Main UI viewport layout, Tailwind styling & CDN dependencies
├── config.js             # Default PBR material parameters and preset definitions
├── engine.js             # Main rendering loop, camera setup, scene & state manager
├── exporters.js          # Export handlers for Draco GLB, OBJ, JSON, and vertex CSV
├── lighting.js           # Directional lights & procedural canvas HDRI generator
├── loaders.js            # Asynchronous file parsers (GLTF, OBJ, DRC) & drag-and-drop
├── materials.js          # Material update handlers and preset application logic
├── storage.js          # LocalStorage serialization for saving/loading studio projects
├── ui.js                 # Drawer sheet interactions, slider bindings, and toast notifications
└── README.md             # Technical documentation & project specification
```

---

## 🚀 Quick Start & Installation

Because the engine relies on ES6 modules and WebAssembly worker decoders (for Draco mesh parsing), it should be served via a local or production HTTP web server.

### Local Development Setup

1. **Clone or Extract Repository**:
   ```bash
   git clone <repository-url>
   cd 3d-pbr-studio-engine
   ```

2. **Serve with a Local Web Server**:
   Using Python:
   ```bash
   python3 -m http.server 8000
   ```
   Or using Node.js `serve`:
   ```bash
   npx serve .
   ```

3. **Access in Browser**:
   Open `http://localhost:8000` in any modern web browser supporting WebGL2/WebGPU (Chrome, Safari, Edge, Firefox).

---

## 📜 Intellectual Property & Terms of Sale

This engine is provided **"AS IS"** without warranties or representations of any kind, express or implied. 

Upon full transfer of funds, the purchaser is granted non-exclusive or exclusive worldwide ownership rights to use, modify, integrate, rebrand, or sublicense this codebase. No ongoing maintenance, hosting, or third-party integration support is included under the standard turn-key source code delivery.
