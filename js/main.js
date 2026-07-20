/* ==========================================================================
   Velocity City 3D - Main Application Loop (Visual Upgrade)
   ========================================================================== */

class GameApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.isPaused = false;
        this.clock = new THREE.Clock();

        this.dayCycleTime = 20.0;
        this.dayCycleDuration = 160.0;

        this.initScene();
        this.initLighting();
        this.initClouds();

        this.cityBuilder = new CityBuilder(this.scene);
        this.car = new Car();
        this.scene.add(this.car.mesh);

        this.physics = new PhysicsEngine(this.car.mesh);
        this.physics.setColliders(this.cityBuilder.colliders);

        this.cameraController = new CameraController(this.camera, this.car.mesh);
        this.initUI();

        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.skyColorDay = new THREE.Color(0x7dd3fc);
        this.skyColorDusk = new THREE.Color(0xf97316);
        this.skyColorNight = new THREE.Color(0x080e18);

        this.scene.background = this.skyColorDay.clone();
        this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0032);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    initLighting() {
        this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x15803d, 0.65);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
        this.sunLight.position.set(80, 120, 60);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 300;

        const d = 120;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0004;

        this.scene.add(this.sunLight);
    }

    initClouds() {
        this.cloudsGroup = new THREE.Group();
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            flatShading: true
        });

        for (let i = 0; i < 22; i++) {
            const cloud = new THREE.Group();
            const puffs = Math.floor(Math.random() * 3) + 3;

            for (let p = 0; p < puffs; p++) {
                const puff = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(Math.random() * 6 + 6, 0),
                    cloudMat
                );
                puff.position.set(p * 6 - 8, Math.random() * 2, Math.random() * 4);
                cloud.add(puff);
            }

            cloud.position.set(
                (Math.random() - 0.5) * 400,
                Math.random() * 20 + 50,
                (Math.random() - 0.5) * 400
            );
            this.cloudsGroup.add(cloud);
        }
        this.scene.add(this.cloudsGroup);
    }

    updateDayNightCycle(dt) {
        this.dayCycleTime = (this.dayCycleTime + dt) % this.dayCycleDuration;
        const progress = this.dayCycleTime / this.dayCycleDuration;
        const angle = progress * Math.PI * 2;

        const radius = 180;
        const sunX = Math.cos(angle) * radius;
        const sunY = Math.sin(angle) * radius;

        this.sunLight.position.set(sunX, sunY, 50);

        let nightFactor = 0.0;
        if (sunY < 30 && sunY > -30) {
            nightFactor = THREE.MathUtils.clamp((30 - sunY) / 60, 0.0, 1.0);
        } else if (sunY <= -30) {
            nightFactor = 1.0;
        }

        const currentSkyColor = new THREE.Color();
        if (nightFactor < 0.5) {
            currentSkyColor.lerpColors(this.skyColorDay, this.skyColorDusk, nightFactor * 2.0);
        } else {
            currentSkyColor.lerpColors(this.skyColorDusk, this.skyColorNight, (nightFactor - 0.5) * 2.0);
        }

        this.scene.background.copy(currentSkyColor);
        this.scene.fog.color.copy(currentSkyColor);

        this.sunLight.intensity = Math.max(0.1, (1.0 - nightFactor) * 1.35);
        this.hemiLight.intensity = 0.65 - nightFactor * 0.45;

        this.cityBuilder.setNightFactor(nightFactor);
        this.car.setNightFactor(nightFactor);
    }

    initUI() {
        window.ui.init({
            onToggleSound: () => window.soundEngine.toggleMute(),
            onToggleCamera: () => {
                const modeIndex = this.cameraController.toggleMode();
                return ['3rd Person', 'Hood Cam', 'Drone View'][modeIndex];
            },
            onResetCar: () => this.physics.resetPosition(),
            onTogglePause: () => this.togglePause(),
            onRestartGame: () => {
                this.physics.resetPosition();
                this.isPaused = false;
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) window.ui.showPauseModal();
        else window.ui.hidePauseModal();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = this.clock.getDelta();

        if (window.controls.consumeReset()) {
            this.physics.resetPosition();
            window.ui.showToast('Car Position Reset!');
        }

        if (window.controls.consumePause()) this.togglePause();

        if (window.controls.consumeCamera()) {
            const modeIndex = this.cameraController.toggleMode();
            window.ui.showToast(`Camera: ${['3rd Person', 'Hood Cam', 'Drone View'][modeIndex]}`);
        }

        if (window.controls.consumeSound()) {
            const muted = window.soundEngine.toggleMute();
            const soundIcon = document.getElementById('sound-icon');
            if (soundIcon) soundIcon.textContent = muted ? '🔇' : '🔊';
            window.ui.showToast(muted ? 'Sound Muted' : 'Sound Enabled');
        }

        if (!this.isPaused) {
            const throttle = window.controls.throttle;
            const brake = window.controls.brake;
            const steering = window.controls.steering;
            const handbrake = window.controls.handbrake;

            this.physics.update(throttle, brake, steering, handbrake, dt);
            this.car.updateAnimations(this.physics.steerAngle, this.physics.speed, brake > 0, dt);
            this.cameraController.update(this.physics.position, this.physics.yaw, this.physics.speed, dt);
            this.updateDayNightCycle(dt);

            const speedRatio = this.physics.speed / this.physics.maxSpeedForward;
            window.soundEngine.update(speedRatio, this.physics.isDrifting, throttle > 0);

            if (this.cloudsGroup) this.cloudsGroup.rotation.y += 0.01 * dt;
        }

        window.ui.updateHUD(this.physics.getSpeedKmH(), this.physics.speed, this.isPaused);
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameApp();
});
