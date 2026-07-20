/* ==========================================================================
   Velocity City 3D - Web Audio API Synthetic Engine & Tire Noise Generator
   ========================================================================== */

class SoundController {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isInitialized = false;

        // Sound nodes
        this.engineOsc = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.screechNoise = null;
        this.screechGain = null;
        this.screechFilter = null;
    }

    init() {
        if (this.isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // 1. Engine Oscillator Setup (Rich V8 Sawtooth Synth)
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';

            // Lowpass filter for warm engine rumble
            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.value = 350;

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = 0.0; // Starts silent

            this.engineOsc.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);
            this.engineOsc.start();

            // 2. Tire Screech Noise Setup (Bandpass White Noise Buffer)
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            this.screechNoise = this.ctx.createBufferSource();
            this.screechNoise.buffer = noiseBuffer;
            this.screechNoise.loop = true;

            this.screechFilter = this.ctx.createBiquadFilter();
            this.screechFilter.type = 'bandpass';
            this.screechFilter.frequency.value = 1300;
            this.screechFilter.Q.value = 3.5;

            this.screechGain = this.ctx.createGain();
            this.screechGain.gain.value = 0.0;

            this.screechNoise.connect(this.screechFilter);
            this.screechFilter.connect(this.screechGain);
            this.screechGain.connect(this.ctx.destination);
            this.screechNoise.start();

            this.isInitialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported or blocked", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.engineGain) {
            this.engineGain.gain.value = 0;
            this.screechGain.gain.value = 0;
        }
        return this.isMuted;
    }

    update(speedRatio, isDrifting, isAccelerating) {
        if (!this.isInitialized || this.isMuted) return;

        // Smooth natural pitch modulation matching RPM/Speed (50 Hz idle -> 340 Hz top speed)
        const baseFreq = 50;
        const maxFreq = 340;
        const absSpeed = Math.abs(speedRatio);
        const currentFreq = baseFreq + Math.pow(absSpeed, 0.75) * (maxFreq - baseFreq);

        if (this.engineOsc) {
            this.engineOsc.frequency.setTargetAtTime(currentFreq, this.ctx.currentTime, 0.04);
        }

        // Open filter frequency as RPM rises for richer roar
        if (this.engineFilter) {
            const filterFreq = 350 + absSpeed * 800;
            this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);
        }

        // Slightly increased volume without distortion or clipping
        if (this.engineGain) {
            let targetGain = 0.12 + absSpeed * 0.16;
            if (isAccelerating) targetGain += 0.06;
            this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
        }

        // Tire Screech volume modulation during handbrake/drift
        if (this.screechGain) {
            const screechTarget = (isDrifting && absSpeed > 0.12) ? 0.20 : 0.0;
            this.screechGain.gain.setTargetAtTime(screechTarget, this.ctx.currentTime, 0.06);
        }
    }
}

// Global Sound Instance
window.soundEngine = new SoundController();
