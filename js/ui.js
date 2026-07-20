/* ==========================================================================
   Velocity City 3D - User Interface & Speedometer HUD Controller
   ========================================================================== */

class UIController {
    constructor() {
        // DOM Elements
        this.speedValue = document.getElementById('speed-value');
        this.gearIndicator = document.getElementById('gear-indicator');
        this.gaugeFill = document.getElementById('gauge-fill');
        this.pauseModal = document.getElementById('pause-modal');
        this.toastEl = document.getElementById('toast');
        this.soundIcon = document.getElementById('sound-icon');

        // Buttons
        this.btnSound = document.getElementById('btn-sound');
        this.btnCamera = document.getElementById('btn-camera');
        this.btnReset = document.getElementById('btn-reset');
        this.btnPause = document.getElementById('btn-pause');
        this.btnResume = document.getElementById('btn-resume');
        this.btnRestart = document.getElementById('btn-restart');

        // SVG Gauge parameters (radius 80, circumference 502)
        this.maxGaugeOffset = 377; // 270 deg arch fill range
        this.minGaugeOffset = 94;

        this.toastTimer = null;
    }

    init(callbacks) {
        if (this.btnSound) {
            this.btnSound.addEventListener('click', () => {
                const muted = callbacks.onToggleSound();
                this.soundIcon.textContent = muted ? '🔇' : '🔊';
                this.showToast(muted ? 'Sound Muted' : 'Sound Enabled');
            });
        }

        if (this.btnCamera) {
            this.btnCamera.addEventListener('click', () => {
                const modeName = callbacks.onToggleCamera();
                this.showToast(`Camera: ${modeName}`);
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => {
                callbacks.onResetCar();
                this.showToast('Car Position Reset!');
            });
        }

        if (this.btnPause) {
            this.btnPause.addEventListener('click', () => {
                callbacks.onTogglePause();
            });
        }

        if (this.btnResume) {
            this.btnResume.addEventListener('click', () => {
                callbacks.onTogglePause();
            });
        }

        if (this.btnRestart) {
            this.btnRestart.addEventListener('click', () => {
                callbacks.onRestartGame();
                this.hidePauseModal();
                this.showToast('Game Restarted!');
            });
        }
    }

    updateHUD(speedKmH, currentSpeed, isPaused) {
        if (this.speedValue) {
            this.speedValue.textContent = speedKmH;
        }

        // Gear Logic (D, R, P)
        if (this.gearIndicator) {
            if (isPaused) {
                this.gearIndicator.textContent = 'P';
                this.gearIndicator.style.borderColor = '#f59e0b';
                this.gearIndicator.style.color = '#fde047';
            } else if (currentSpeed < -0.5) {
                this.gearIndicator.textContent = 'R';
                this.gearIndicator.style.borderColor = '#ef4444';
                this.gearIndicator.style.color = '#fca5a5';
            } else {
                this.gearIndicator.textContent = 'D';
                this.gearIndicator.style.borderColor = '#3b82f6';
                this.gearIndicator.style.color = '#93c5fd';
            }
        }

        // Radial Speedometer Gauge Fill
        if (this.gaugeFill) {
            const maxSpeed = 120.0;
            const ratio = THREE.MathUtils.clamp(speedKmH / maxSpeed, 0, 1);
            const targetOffset = this.maxGaugeOffset - ratio * (this.maxGaugeOffset - this.minGaugeOffset);
            this.gaugeFill.style.strokeDashoffset = targetOffset;

            // Shift gauge color at top speed
            if (ratio > 0.8) {
                this.gaugeFill.style.stroke = '#ef4444';
            } else if (ratio > 0.5) {
                this.gaugeFill.style.stroke = '#f59e0b';
            } else {
                this.gaugeFill.style.stroke = '#3b82f6';
            }
        }
    }

    showPauseModal() {
        if (this.pauseModal) this.pauseModal.classList.remove('hidden');
    }

    hidePauseModal() {
        if (this.pauseModal) this.pauseModal.classList.add('hidden');
    }

    showToast(msg) {
        if (!this.toastEl) return;
        this.toastEl.textContent = msg;
        this.toastEl.classList.remove('hidden');

        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.toastEl.classList.add('hidden');
        }, 2000);
    }
}

// Global UI Instance
window.ui = new UIController();
