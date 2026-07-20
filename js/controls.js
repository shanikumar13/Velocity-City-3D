/* ==========================================================================
   Velocity City 3D - User Input Controller (Keyboard & Mobile Touch)
   ========================================================================== */

class InputController {
    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            handbrake: false
        };

        this.touchState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            handbrake: false
        };

        // One-time action flags
        this.resetRequested = false;
        this.pauseRequested = false;
        this.cameraRequested = false;
        this.soundRequested = false;

        this.initKeyboard();
        this.initTouch();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Initialize sound on first user gesture
            if (window.soundEngine) window.soundEngine.init();

            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.handbrake = true;
                    e.preventDefault();
                    break;
                case 'KeyR':
                    this.resetRequested = true;
                    break;
                case 'KeyP':
                case 'Escape':
                    this.pauseRequested = true;
                    break;
                case 'KeyC':
                    this.cameraRequested = true;
                    break;
                case 'KeyM':
                    this.soundRequested = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.handbrake = false;
                    break;
            }
        });
    }

    initTouch() {
        const bindTouch = (id, property) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const start = (e) => {
                e.preventDefault();
                if (window.soundEngine) {
                    window.soundEngine.init();
                    window.soundEngine.resume();
                }
                this.touchState[property] = true;
                btn.classList.add('active');
            };

            const end = (e) => {
                e.preventDefault();
                this.touchState[property] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        bindTouch('touch-accel', 'forward');
        bindTouch('touch-brake', 'backward');
        bindTouch('touch-left', 'left');
        bindTouch('touch-right', 'right');
        bindTouch('touch-handbrake', 'handbrake');
    }

    get throttle() {
        return (this.keys.forward || this.touchState.forward) ? 1.0 : 0.0;
    }

    get brake() {
        return (this.keys.backward || this.touchState.backward) ? 1.0 : 0.0;
    }

    get steering() {
        let dir = 0;
        if (this.keys.left || this.touchState.left) dir -= 1.0;
        if (this.keys.right || this.touchState.right) dir += 1.0;
        return dir;
    }

    get handbrake() {
        return this.keys.handbrake || this.touchState.handbrake;
    }

    consumeReset() {
        const val = this.resetRequested;
        this.resetRequested = false;
        return val;
    }

    consumePause() {
        const val = this.pauseRequested;
        this.pauseRequested = false;
        return val;
    }

    consumeCamera() {
        const val = this.cameraRequested;
        this.cameraRequested = false;
        return val;
    }

    consumeSound() {
        const val = this.soundRequested;
        this.soundRequested = false;
        return val;
    }
}

// Global Controls Instance
window.controls = new InputController();
