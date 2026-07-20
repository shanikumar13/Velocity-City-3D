# 🚗 Velocity City 3D - Low-Poly Driving Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-green.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://www.netlify.com/)

Velocity City 3D is a lightweight, high-performance, browser-based 3D low-poly driving simulator. Built cleanly with standard web technologies (HTML5, Vanilla CSS, JavaScript) and powered by **Three.js**, it runs instantly in any modern web browser without requiring logins, backends, installation steps, or external build tooling.

---

## ✨ Features

- **⚡ Lightweight & Smooth**: Optimized low-poly geometry and efficient shadow map rendering deliver solid 60 FPS performance on both desktop and low-end mobile devices.
- **🚗 Drivable Sports Car**: Custom low-poly vehicle with animated wheels, steering pivot, illuminated headlights, rear brake light glow on braking, dual exhaust pipes, and dynamic suspension body roll.
- **🏙️ Modern Low-Poly City Map**: Procedurally constructed city grid featuring asphalt roads, yellow dividing lines, white crosswalks, sidewalks, curbs, multi-height skyscrapers, residential apartments, trees, street lights, and parking zones with parked cars.
- **🌆 Dynamic Day / Night Cycle**: Continuous 160-second day-night transition loop with real-time sky color lerping (daytime blue $\rightarrow$ sunset orange $\rightarrow$ night dark indigo). Street lights automatically turn on at dusk.
- **🏎️ Arcade Car Physics**: Boosted ~167 km/h top speed, punchy 34 m/s² acceleration, realistic turn radius scaling with velocity, handbrake drifting, reversing, and AABB/cylinder collision resolution against city structures and map borders.
- **🔊 Synthetic Web Audio Engine**: Zero external audio file dependencies—engine pitch scaling (50 Hz to 340 Hz) and tire screech noise during handbrake drift are synthesized in real time using the Web Audio API.
- **🖥️ Modern Glassmorphic HUD**: Radial circular SVG speedometer gauge + digital speed output (KM/H), gear indicator (`D`/`R`/`P`), camera view toggles, toast notifications, and pause overlay modal.
- **📱 Responsive Touch Controls**: On-screen buttons for gas, brake, left/right steering, handbrake drift, car reset, and camera views on mobile/tablet screens.

---

## 🎮 Controls

| Action | Keyboard Input | Touch Controls |
|---|---|---|
| **Accelerate** | `W` / `Up Arrow` | **GAS** button |
| **Brake / Reverse** | `S` / `Down Arrow` | **BRAKE** button |
| **Turn Left** | `A` / `Left Arrow` | **◀** button |
| **Turn Right** | `D` / `Right Arrow` | **▶** button |
| **Handbrake / Drift** | `Space` | **DRIFT** button |
| **Reset Car Position** | `R` | Top Bar **RESET** |
| **Toggle Camera View** | `C` | Top Bar **📹** |
| **Pause / Resume** | `P` / `Esc` | Top Bar **PAUSE** |
| **Toggle Fullscreen** | `F` | Top Bar **⛶** |
| **Mute / Unmute Sound** | `M` | Top Bar **🔊** |

---

## 🛠️ Technologies Used

- **HTML5**: Semantic document structure and WebGL canvas host element.
- **CSS3 (Vanilla)**: Modern glassmorphism design system (`backdrop-filter: blur()`), custom CSS properties (variables), responsive flexbox/grid layout, and SVG gauge styling.
- **JavaScript (ES6+)**: Modular application architecture, game state loop, and event management.
- **Three.js (r128)**: 3D scene creation, camera management, WebGL renderer, PCF soft shadow maps, materials, and lighting systems.
- **Web Audio API**: Synthetic audio generation for engine V8 frequency pitch modulation and tire noise synthesis.

---

## 📁 Folder Structure

```
velocity-city-3d/
├── index.html            # Main HTML5 entry point & HUD UI layer
├── style.css             # Root CSS stylesheet import wrapper
├── script.js            # Complete bundled game engine script
├── README.md             # Project documentation & deployment guide
├── LICENSE               # MIT License
├── .gitignore            # Git exclusion rules
├── package.json          # Node config & local development scripts
├── vercel.json           # Vercel deployment configuration
├── netlify.toml          # Netlify deployment configuration
├── assets/               # Static assets & media directories
│   ├── models/           # (.gitkeep for 3D model files)
│   ├── textures/         # (.gitkeep for texture maps)
│   ├── sounds/           # (.gitkeep for sound files)
│   └── images/           # (.gitkeep for preview images)
├── css/
│   └── style.css         # Glassmorphic HUD & layout styling
└── js/
    ├── main.js           # Game app entry point, renderer & day/night loop
    ├── car.js            # Drivable car model generator & animations
    ├── city.js           # Procedural city builder (roads, buildings, lights)
    ├── physics.js        # Arcade car physics engine & collision detection
    ├── camera.js         # Follow camera controller (3rd-person, hood cam, drone)
    ├── controls.js       # Keyboard & mobile touch input listener
    ├── audio.js          # Web Audio API engine sound & drift synth
    └── ui.js             # HUD speedometer & modal UI controller
```

---

## 📦 Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/user/velocity-city-3d.git
cd velocity-city-3d
```

---

## 🚀 How to Run

### Option 1: Direct Browser Access
Simply double-click or open `index.html` directly in any WebGL-supported web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari).

### Option 2: Live Server / Local Node Server
If using VS Code, right-click `index.html` and select **Open with Live Server**, or run via Node.js:

```bash
# Start local static server
npm start
```

Then open `http://localhost:8080` in your web browser.

---

## 🌐 Deployment

### 1. GitHub Pages
1. Push this repository to GitHub.
2. Navigate to **Settings** $\rightarrow$ **Pages** on your repository menu.
3. Under **Build and deployment** $\rightarrow$ **Branch**, choose `main` and select `/ (root)`.
4. Click **Save**. Your game URL will be ready in 1–2 minutes!

### 2. Vercel Deployment
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your `velocity-city-3d` GitHub repository.
3. Framework Preset: **Other (Static Site)**.
4. Root Directory: `./`
5. Click **Deploy**. Vercel will automatically detect `vercel.json`.

### 3. Netlify Deployment
1. Log in to [Netlify](https://netlify.com) and click **Add new site** $\rightarrow$ **Import an existing project**.
2. Select your GitHub repository.
3. Build command: *(leave blank)*
4. Publish directory: `.`
5. Click **Deploy Site**. Netlify will use `netlify.toml` automatically.

---

## 🔮 Future Improvements

- [ ] AI traffic vehicles driving along city road lanes.
- [ ] Multiple drivable low-poly vehicles (sports car, SUV, truck, supercar).
- [ ] Time-trial challenge mode and collectible star checkpoints.
- [ ] Weather toggle system (Rain with wet asphalt reflections, Fog, Snow).
- [ ] Customizable car body paint colors and wheel rims.

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
