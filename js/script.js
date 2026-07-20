/* ==========================================================================
   Velocity City 3D - Complete Game Engine (js/script.js)
   ========================================================================== */

(function () {
    'use strict';

    if (window.__VELOCITY_GAME_LOADED__) return;
    window.__VELOCITY_GAME_LOADED__ = true;

    /* ==========================================================================
       1. WEB AUDIO API SYNTHETIC ENGINE & DRIFT SOUND CONTROLLER
       ========================================================================== */
    class SoundController {
        constructor() {
            this.ctx = null;
            this.isMuted = false;
            this.isInitialized = false;

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

                this.engineOsc = this.ctx.createOscillator();
                this.engineOsc.type = 'sawtooth';

                this.engineFilter = this.ctx.createBiquadFilter();
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.value = 350;

                this.engineGain = this.ctx.createGain();
                this.engineGain.gain.value = 0.0;

                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                this.engineGain.connect(this.ctx.destination);
                this.engineOsc.start();

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
                console.warn('Web Audio API not supported or blocked', e);
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

            const baseFreq = 50;
            const maxFreq = 340;
            const absSpeed = Math.abs(speedRatio);
            const currentFreq = baseFreq + Math.pow(absSpeed, 0.75) * (maxFreq - baseFreq);

            if (this.engineOsc) {
                this.engineOsc.frequency.setTargetAtTime(currentFreq, this.ctx.currentTime, 0.04);
            }

            if (this.engineFilter) {
                const filterFreq = 350 + absSpeed * 800;
                this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);
            }

            if (this.engineGain) {
                let targetGain = 0.12 + absSpeed * 0.16;
                if (isAccelerating) targetGain += 0.06;
                this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
            }

            if (this.screechGain) {
                const screechTarget = (isDrifting && absSpeed > 0.12) ? 0.20 : 0.0;
                this.screechGain.gain.setTargetAtTime(screechTarget, this.ctx.currentTime, 0.06);
            }
        }
    }

    /* ==========================================================================
       2. INPUT CONTROLLER
       ========================================================================== */
    class InputController {
        constructor() {
            this.keys = { forward: false, backward: false, left: false, right: false, handbrake: false };
            this.touchState = { forward: false, backward: false, left: false, right: false, handbrake: false };

            this.resetRequested = false;
            this.pauseRequested = false;
            this.cameraRequested = false;
            this.soundRequested = false;

            this.initKeyboard();
            this.initTouch();
        }

        initKeyboard() {
            window.addEventListener('keydown', (e) => {
                if (window.soundEngine) window.soundEngine.init();

                switch (e.code) {
                    case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
                    case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
                    case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
                    case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                    case 'Space': this.keys.handbrake = true; e.preventDefault(); break;
                    case 'KeyR': this.resetRequested = true; break;
                    case 'KeyP': case 'Escape': this.pauseRequested = true; break;
                    case 'KeyC': this.cameraRequested = true; break;
                    case 'KeyM': this.soundRequested = true; break;
                }
            });

            window.addEventListener('keyup', (e) => {
                switch (e.code) {
                    case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
                    case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
                    case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
                    case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
                    case 'Space': this.keys.handbrake = false; break;
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

        get throttle() { return (this.keys.forward || this.touchState.forward) ? 1.0 : 0.0; }
        get brake() { return (this.keys.backward || this.touchState.backward) ? 1.0 : 0.0; }
        get steering() {
            let dir = 0;
            if (this.keys.left || this.touchState.left) dir -= 1.0;
            if (this.keys.right || this.touchState.right) dir += 1.0;
            return dir;
        }
        get handbrake() { return this.keys.handbrake || this.touchState.handbrake; }

        consumeReset() { const val = this.resetRequested; this.resetRequested = false; return val; }
        consumePause() { const val = this.pauseRequested; this.pauseRequested = false; return val; }
        consumeCamera() { const val = this.cameraRequested; this.cameraRequested = false; return val; }
        consumeSound() { const val = this.soundRequested; this.soundRequested = false; return val; }
    }

    /* ==========================================================================
       3. ENHANCED CAR MODEL GENERATOR & ANIMATIONS
       ========================================================================== */
    class Car {
        constructor() {
            this.mesh = new THREE.Group();
            this.bodyGroup = new THREE.Group();
            this.mesh.add(this.bodyGroup);

            this.frontLeftWheel = null;
            this.frontRightWheel = null;
            this.rearLeftWheel = null;
            this.rearRightWheel = null;
            this.wheels = [];

            this.headlightMaterial = null;
            this.taillightMaterial = null;
            this.spotlights = [];

            this.buildCar();
        }

        buildCar() {
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x2563eb,
                metalness: 0.45,
                roughness: 0.25,
                flatShading: true
            });

            const darkTrimMat = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                roughness: 0.7,
                flatShading: true
            });

            const windowMat = new THREE.MeshStandardMaterial({
                color: 0x0284c7,
                roughness: 0.1,
                metalness: 0.9,
                transparent: true,
                opacity: 0.82
            });

            const chromeMat = new THREE.MeshStandardMaterial({
                color: 0xf1f5f9,
                metalness: 0.95,
                roughness: 0.15
            });

            const tireMat = new THREE.MeshStandardMaterial({
                color: 0x111827,
                roughness: 0.85,
                flatShading: true
            });

            const brakeCaliperMat = new THREE.MeshStandardMaterial({
                color: 0xef4444,
                roughness: 0.3
            });

            this.headlightMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfff0c2,
                emissiveIntensity: 1.0,
                roughness: 0.1
            });

            this.taillightMaterial = new THREE.MeshStandardMaterial({
                color: 0xef4444,
                emissive: 0xef4444,
                emissiveIntensity: 0.5,
                roughness: 0.2
            });

            const chassisGeo = new THREE.BoxGeometry(2.05, 0.58, 4.4);
            const chassisMesh = new THREE.Mesh(chassisGeo, bodyMat);
            chassisMesh.position.y = 0.55;
            chassisMesh.castShadow = true;
            chassisMesh.receiveShadow = true;
            this.bodyGroup.add(chassisMesh);

            const bumperGeo = new THREE.BoxGeometry(1.95, 0.28, 0.45);
            const bumperMesh = new THREE.Mesh(bumperGeo, darkTrimMat);
            bumperMesh.position.set(0, 0.35, 2.12);
            bumperMesh.castShadow = true;
            this.bodyGroup.add(bumperMesh);

            const scoopGeo = new THREE.BoxGeometry(0.85, 0.08, 1.3);
            const scoopMesh = new THREE.Mesh(scoopGeo, darkTrimMat);
            scoopMesh.position.set(0, 0.86, 0.7);
            this.bodyGroup.add(scoopMesh);

            const skirtGeo = new THREE.BoxGeometry(2.15, 0.15, 2.8);
            const skirtMesh = new THREE.Mesh(skirtGeo, darkTrimMat);
            skirtMesh.position.set(0, 0.32, 0);
            this.bodyGroup.add(skirtMesh);

            const cabinGeo = new THREE.BoxGeometry(1.62, 0.64, 2.25);
            const cabinMesh = new THREE.Mesh(cabinGeo, windowMat);
            cabinMesh.position.set(0, 1.12, -0.2);
            cabinMesh.castShadow = true;
            this.bodyGroup.add(cabinMesh);

            const roofPanelGeo = new THREE.BoxGeometry(1.5, 0.07, 1.6);
            const roofPanelMesh = new THREE.Mesh(roofPanelGeo, bodyMat);
            roofPanelMesh.position.set(0, 1.46, -0.2);
            roofPanelMesh.castShadow = true;
            this.bodyGroup.add(roofPanelMesh);

            const wingGeo = new THREE.BoxGeometry(1.85, 0.08, 0.38);
            const wingMesh = new THREE.Mesh(wingGeo, darkTrimMat);
            wingMesh.position.set(0, 1.12, -2.12);

            const strutGeo = new THREE.BoxGeometry(0.08, 0.32, 0.18);
            const strutL = new THREE.Mesh(strutGeo, darkTrimMat);
            strutL.position.set(-0.65, 0.92, -2.12);
            const strutR = new THREE.Mesh(strutGeo, darkTrimMat);
            strutR.position.set(0.65, 0.92, -2.12);

            this.bodyGroup.add(wingMesh);
            this.bodyGroup.add(strutL);
            this.bodyGroup.add(strutR);

            const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 12);
            pipeGeo.rotateX(Math.PI / 2);
            const pipeL = new THREE.Mesh(pipeGeo, chromeMat);
            pipeL.position.set(-0.55, 0.35, -2.22);
            const pipeR = new THREE.Mesh(pipeGeo, chromeMat);
            pipeR.position.set(0.55, 0.35, -2.22);
            this.bodyGroup.add(pipeL);
            this.bodyGroup.add(pipeR);

            const headlightGeo = new THREE.BoxGeometry(0.42, 0.14, 0.08);
            const headL = new THREE.Mesh(headlightGeo, this.headlightMaterial);
            headL.position.set(-0.72, 0.65, 2.21);
            const headR = new THREE.Mesh(headlightGeo, this.headlightMaterial);
            headR.position.set(0.72, 0.65, 2.21);
            this.bodyGroup.add(headL);
            this.bodyGroup.add(headR);

            const tailL = new THREE.Mesh(headlightGeo, this.taillightMaterial);
            tailL.position.set(-0.72, 0.65, -2.21);
            const tailR = new THREE.Mesh(headlightGeo, this.taillightMaterial);
            tailR.position.set(0.72, 0.65, -2.21);
            this.bodyGroup.add(tailL);
            this.bodyGroup.add(tailR);

            const spotL = new THREE.SpotLight(0xfff0c2, 1.8, 35, Math.PI / 5, 0.4, 1);
            spotL.position.set(-0.72, 0.65, 2.15);
            spotL.target.position.set(-0.72, 0.2, 14);
            this.mesh.add(spotL);
            this.mesh.add(spotL.target);

            const spotR = new THREE.SpotLight(0xfff0c2, 1.8, 35, Math.PI / 5, 0.4, 1);
            spotR.position.set(0.72, 0.65, 2.15);
            spotR.target.position.set(0.72, 0.2, 14);
            this.mesh.add(spotR);
            this.mesh.add(spotR.target);

            this.spotlights.push(spotL, spotR);

            const wheelRadius = 0.42;
            const wheelWidth = 0.36;
            const wheelPositions = [
                { name: 'FL', x: -0.98, y: wheelRadius, z: 1.35, front: true },
                { name: 'FR', x: 0.98, y: wheelRadius, z: 1.35, front: true },
                { name: 'RL', x: -0.98, y: wheelRadius, z: -1.35, front: false },
                { name: 'RR', x: 0.98, y: wheelRadius, z: -1.35, front: false }
            ];

            wheelPositions.forEach((pos) => {
                const pivotGroup = new THREE.Group();
                pivotGroup.position.set(pos.x, pos.y, pos.z);

                const wheelMeshGroup = new THREE.Group();

                const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
                tireGeo.rotateZ(Math.PI / 2);
                const tireMesh = new THREE.Mesh(tireGeo, tireMat);
                tireMesh.castShadow = true;
                wheelMeshGroup.add(tireMesh);

                const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 12);
                rimGeo.rotateZ(Math.PI / 2);
                const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
                wheelMeshGroup.add(rimMesh);

                const spokeCount = 5;
                for (let s = 0; s < spokeCount; s++) {
                    const spokeAngle = (s / spokeCount) * Math.PI * 2;
                    const spokeGeo = new THREE.BoxGeometry(wheelWidth + 0.03, wheelRadius * 0.9, 0.06);
                    const spokeMesh = new THREE.Mesh(spokeGeo, chromeMat);
                    spokeMesh.rotation.x = spokeAngle;
                    wheelMeshGroup.add(spokeMesh);
                }

                const caliperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.16);
                const caliperMesh = new THREE.Mesh(caliperGeo, brakeCaliperMat);
                caliperMesh.position.set(0, 0.12, 0);
                pivotGroup.add(caliperMesh);

                pivotGroup.add(wheelMeshGroup);
                this.mesh.add(pivotGroup);

                const wheelObj = { pivot: pivotGroup, mesh: wheelMeshGroup, isFront: pos.front };
                this.wheels.push(wheelObj);
                if (pos.name === 'FL') this.frontLeftWheel = wheelObj;
                if (pos.name === 'FR') this.frontRightWheel = wheelObj;
                if (pos.name === 'RL') this.rearLeftWheel = wheelObj;
                if (pos.name === 'RR') this.rearRightWheel = wheelObj;
            });

            this.mesh.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
        }

        updateAnimations(steeringAngle, currentSpeed, isBraking, dt) {
            const maxSteerAngle = 0.48;
            const targetSteerAngle = -steeringAngle * maxSteerAngle;
            if (this.frontLeftWheel && this.frontRightWheel) {
                this.frontLeftWheel.pivot.rotation.y = targetSteerAngle;
                this.frontRightWheel.pivot.rotation.y = targetSteerAngle;
            }

            const wheelRadius = 0.42;
            const angularVelocity = (currentSpeed / wheelRadius) * dt;
            this.wheels.forEach((w) => { w.mesh.rotation.x += angularVelocity; });

            const targetPitch = isBraking ? 0.09 : (currentSpeed > 2 && Math.abs(steeringAngle) < 0.2 ? -0.05 : 0);
            const targetRoll = steeringAngle * (Math.abs(currentSpeed) / 40) * 0.14;

            this.bodyGroup.rotation.x += (targetPitch - this.bodyGroup.rotation.x) * 10.0 * dt;
            this.bodyGroup.rotation.z += (targetRoll - this.bodyGroup.rotation.z) * 10.0 * dt;

            if (this.taillightMaterial) {
                this.taillightMaterial.emissiveIntensity = isBraking ? 2.2 : 0.4;
            }
        }

        setNightFactor(nightFactor) {
            const spotIntensity = 0.5 + nightFactor * 2.8;
            this.spotlights.forEach(s => { s.intensity = spotIntensity; });
            if (this.headlightMaterial) {
                this.headlightMaterial.emissiveIntensity = 0.8 + nightFactor * 1.8;
            }
        }
    }

    /* ==========================================================================
       4. ARCADE CAR PHYSICS ENGINE
       ========================================================================== */
    class PhysicsEngine {
        constructor(carMesh) {
            this.carMesh = carMesh;
            this.position = new THREE.Vector3(0, 0, 0);
            this.yaw = 0.0;

            this.speed = 0.0;
            this.maxSpeedForward = 46.5;
            this.maxSpeedReverse = -14.0;
            
            this.accelerationPower = 34.0;
            this.brakePower = 48.0;
            this.naturalDrag = 9.0;
            this.handbrakeDrag = 32.0;

            this.steerAngle = 0.0;
            this.isDrifting = false;
            this.carRadius = 1.6;
            this.colliders = [];
            this.resetPosition();
        }

        setColliders(collidersList) { this.colliders = collidersList; }

        resetPosition(x = 0, z = 0, yaw = 0) {
            this.position.set(x, 0.0, z);
            this.yaw = yaw;
            this.speed = 0.0;
            this.steerAngle = 0.0;
            this.isDrifting = false;
            if (this.carMesh) {
                this.carMesh.position.copy(this.position);
                this.carMesh.rotation.y = this.yaw;
            }
        }

        update(throttle, brake, steeringInput, handbrake, dt) {
            dt = Math.min(dt, 0.1);
            let netAccel = 0.0;

            if (throttle > 0) {
                if (this.speed < 0) netAccel += this.brakePower * throttle;
                else {
                    const powerFactor = 1.0 - Math.pow(Math.abs(this.speed) / this.maxSpeedForward, 1.2);
                    netAccel += this.accelerationPower * throttle * Math.max(0.25, powerFactor);
                }
            }

            if (brake > 0) {
                if (this.speed > 0) netAccel -= this.brakePower * brake;
                else {
                    const reversePowerFactor = 1.0 - (Math.abs(this.speed) / Math.abs(this.maxSpeedReverse));
                    netAccel -= (this.accelerationPower * 0.6) * brake * Math.max(0.2, reversePowerFactor);
                }
            }

            if (throttle === 0 && brake === 0) {
                if (this.speed > 0) {
                    netAccel -= this.naturalDrag;
                    if (this.speed + netAccel * dt < 0) this.speed = 0;
                } else if (this.speed < 0) {
                    netAccel += this.naturalDrag;
                    if (this.speed + netAccel * dt > 0) this.speed = 0;
                }
            }

            this.isDrifting = handbrake && Math.abs(this.speed) > 6.0;
            if (handbrake) {
                if (this.speed > 0) {
                    netAccel -= this.handbrakeDrag;
                    if (this.speed < 0) this.speed = 0;
                } else if (this.speed < 0) {
                    netAccel += this.handbrakeDrag;
                    if (this.speed > 0) this.speed = 0;
                }
            }

            this.speed += netAccel * dt;
            this.speed = THREE.MathUtils.clamp(this.speed, this.maxSpeedReverse, this.maxSpeedForward);

            if (Math.abs(this.speed) < 0.05 && throttle === 0 && brake === 0) this.speed = 0;

            const speedRatio = Math.abs(this.speed) / this.maxSpeedForward;
            const steeringSensitivity = 1.9 - speedRatio * 0.95;
            const driftMultiplier = this.isDrifting ? 1.6 : 1.0;
            
            const targetSteerAngle = steeringInput * steeringSensitivity;
            this.steerAngle += (targetSteerAngle - this.steerAngle) * 14.0 * dt;

            if (Math.abs(this.speed) > 0.2) {
                const direction = this.speed >= 0 ? 1.0 : -1.0;
                this.yaw -= this.steerAngle * direction * (Math.abs(this.speed) / 7.0) * driftMultiplier * dt;
            }

            const forwardVector = new THREE.Vector3(-Math.sin(this.yaw), 0, Math.cos(this.yaw));
            const newPos = this.position.clone().addScaledVector(forwardVector, this.speed * dt);
            this.resolveCollisions(newPos);

            this.position.copy(newPos);
            if (this.carMesh) {
                this.carMesh.position.copy(this.position);
                this.carMesh.rotation.y = this.yaw;
            }
        }

        resolveCollisions(targetPos) {
            for (const collider of this.colliders) {
                if (collider.type === 'box') {
                    const closestX = THREE.MathUtils.clamp(targetPos.x, collider.minX, collider.maxX);
                    const closestZ = THREE.MathUtils.clamp(targetPos.z, collider.minZ, collider.maxZ);

                    const distX = targetPos.x - closestX;
                    const distZ = targetPos.z - closestZ;
                    const distanceSq = distX * distX + distZ * distZ;

                    if (distanceSq < this.carRadius * this.carRadius) {
                        const distance = Math.sqrt(distanceSq);
                        const overlap = this.carRadius - distance;

                        if (distance === 0) targetPos.x += this.carRadius;
                        else {
                            targetPos.x += (distX / distance) * overlap;
                            targetPos.z += (distZ / distance) * overlap;
                        }

                        this.speed *= -0.25;
                    }
                } else if (collider.type === 'cylinder') {
                    const distX = targetPos.x - collider.x;
                    const distZ = targetPos.z - collider.z;
                    const distanceSq = distX * distX + distZ * distZ;
                    const minDistance = this.carRadius + collider.radius;

                    if (distanceSq < minDistance * minDistance) {
                        const distance = Math.sqrt(distanceSq);
                        const overlap = minDistance - distance;

                        if (distance > 0) {
                            targetPos.x += (distX / distance) * overlap;
                            targetPos.z += (distZ / distance) * overlap;
                        }

                        this.speed *= -0.2;
                    }
                }
            }
        }

        getSpeedKmH() { return Math.round(Math.abs(this.speed) * 3.6); }
    }

    /* ==========================================================================
       5. ENHANCED CITY BUILDER
       ========================================================================== */
    class CityBuilder {
        constructor(scene) {
            this.scene = scene;
            this.colliders = [];
            this.lampBulbs = [];
            this.lampLights = [];

            this.materials = {
                road: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
                roadMarking: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
                yellowMarking: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }),
                sidewalk: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 }),
                curb: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 }),
                grass: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }),
                buildingColors: [
                    0x0f172a, 0x1e293b, 0x334155, 0x1e3a8a, 0x0284c7, 
                    0x0d9488, 0x059669, 0xd97706, 0x9333ea, 0xe11d48
                ],
                windowGlass: new THREE.MeshStandardMaterial({
                    color: 0x38bdf8,
                    emissive: 0x0284c7,
                    emissiveIntensity: 0.45,
                    roughness: 0.1,
                    metalness: 0.85
                }),
                roofMetal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }),
                trunk: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
                foliageLight: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75, flatShading: true }),
                foliageDark: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75, flatShading: true }),
                lampPole: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.25 }),
                carColors: [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xffffff, 0x1e293b]
            };

            this.buildCity();
        }

        buildCity() {
            const gridSize = 6;
            const blockSize = 38;
            const roadWidth = 14;
            const spacing = blockSize + roadWidth;
            const halfSize = (gridSize * spacing) / 2;

            const groundGeo = new THREE.PlaneGeometry(650, 650);
            groundGeo.rotateX(-Math.PI / 2);
            const groundMesh = new THREE.Mesh(groundGeo, this.materials.grass);
            groundMesh.position.y = -0.05;
            groundMesh.receiveShadow = true;
            this.scene.add(groundMesh);

            for (let x = -gridSize / 2; x <= gridSize / 2; x++) {
                for (let z = -gridSize / 2; z <= gridSize / 2; z++) {
                    const posX = x * spacing;
                    const posZ = z * spacing;

                    this.createRoadSegment(posX, posZ, spacing, roadWidth);

                    if (x < gridSize / 2 && z < gridSize / 2) {
                        const blockCenterX = posX + spacing / 2;
                        const blockCenterZ = posZ + spacing / 2;
                        this.createCityBlock(blockCenterX, blockCenterZ, blockSize);
                    }
                }
            }

            this.createBoundaryWalls(halfSize + 20);
        }

        createRoadSegment(x, z, length, width) {
            const roadGeo = new THREE.PlaneGeometry(length + width, length + width);
            roadGeo.rotateX(-Math.PI / 2);
            const roadMesh = new THREE.Mesh(roadGeo, this.materials.road);
            roadMesh.position.set(x, 0.01, z);
            roadMesh.receiveShadow = true;
            this.scene.add(roadMesh);

            const yellowLineGeo = new THREE.PlaneGeometry(0.35, length);
            yellowLineGeo.rotateX(-Math.PI / 2);
            const yellowMeshZ = new THREE.Mesh(yellowLineGeo, this.materials.yellowMarking);
            yellowMeshZ.position.set(x, 0.02, z);
            yellowMeshZ.receiveShadow = true;
            this.scene.add(yellowMeshZ);

            const yellowMeshX = new THREE.Mesh(yellowLineGeo, this.materials.yellowMarking);
            yellowMeshX.rotation.y = Math.PI / 2;
            yellowMeshX.rotation.x = -Math.PI / 2;
            yellowMeshX.position.set(x, 0.02, z);
            yellowMeshX.receiveShadow = true;
            this.scene.add(yellowMeshX);

            this.createCrosswalks(x, z, width);
        }

        createCrosswalks(x, z, roadWidth) {
            const stripGeo = new THREE.PlaneGeometry(0.85, 4.2);
            stripGeo.rotateX(-Math.PI / 2);

            const offsets = [-roadWidth * 0.7, roadWidth * 0.7];
            offsets.forEach(off => {
                for (let i = -4; i <= 4; i += 2) {
                    const strip1 = new THREE.Mesh(stripGeo, this.materials.roadMarking);
                    strip1.position.set(x + i * 1.1, 0.03, z + off);
                    this.scene.add(strip1);

                    const strip2 = new THREE.Mesh(stripGeo, this.materials.roadMarking);
                    strip2.rotation.y = Math.PI / 2;
                    strip2.rotation.x = -Math.PI / 2;
                    strip2.position.set(x + off, 0.03, z + i * 1.1);
                    this.scene.add(strip2);
                }
            });
        }

        createCityBlock(centerX, centerZ, size) {
            const sidewalkGeo = new THREE.BoxGeometry(size, 0.3, size);
            const sidewalkMesh = new THREE.Mesh(sidewalkGeo, this.materials.sidewalk);
            sidewalkMesh.position.set(centerX, 0.15, centerZ);
            sidewalkMesh.receiveShadow = true;
            this.scene.add(sidewalkMesh);

            const curbGeo = new THREE.BoxGeometry(size + 0.6, 0.35, size + 0.6);
            const curbMesh = new THREE.Mesh(curbGeo, this.materials.curb);
            curbMesh.position.set(centerX, 0.12, centerZ);
            curbMesh.receiveShadow = true;
            this.scene.add(curbMesh);

            const layoutType = Math.floor(Math.random() * 4);

            if (layoutType === 0) {
                this.createSkyscraper(centerX, centerZ, size * 0.75, Math.random() * 32 + 26);
            } else if (layoutType === 1 || layoutType === 2) {
                const subSize = size * 0.42;
                const offset = size * 0.24;

                this.createBuilding(centerX - offset, centerZ - offset, subSize, Math.random() * 18 + 12);
                this.createBuilding(centerX + offset, centerZ - offset, subSize, Math.random() * 22 + 10);
                this.createBuilding(centerX - offset, centerZ + offset, subSize, Math.random() * 16 + 8);
                this.createParkingLot(centerX + offset, centerZ + offset, subSize);
            } else {
                const subWidth = size * 0.8;
                const subDepth = size * 0.38;

                this.createBuilding(centerX, centerZ - size * 0.22, subWidth, Math.random() * 20 + 12, subDepth);
                this.createBuilding(centerX, centerZ + size * 0.22, subWidth, Math.random() * 16 + 10, subDepth);

                this.createTree(centerX - size * 0.3, centerZ);
                this.createTree(centerX + size * 0.3, centerZ);
            }

            const half = size / 2 - 1.5;
            this.createStreetLamp(centerX - half, centerZ - half);
            this.createStreetLamp(centerX + half, centerZ - half);
            this.createStreetLamp(centerX - half, centerZ + half);
            this.createStreetLamp(centerX + half, centerZ + half);

            this.createTree(centerX - half, centerZ);
            this.createTree(centerX + half, centerZ);
            this.createTree(centerX, centerZ - half);
            this.createTree(centerX, centerZ + half);
        }

        createBuilding(x, z, width, height, depth = width) {
            const color = this.materials.buildingColors[Math.floor(Math.random() * this.materials.buildingColors.length)];
            const bldgMat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.45,
                flatShading: true
            });

            const bldgGeo = new THREE.BoxGeometry(width, height, depth);
            const bldgMesh = new THREE.Mesh(bldgGeo, bldgMat);
            bldgMesh.position.set(x, height / 2 + 0.3, z);
            bldgMesh.castShadow = true;
            bldgMesh.receiveShadow = true;
            this.scene.add(bldgMesh);

            this.createWindows(x, z, width, height, depth);

            const roofBorderGeo = new THREE.BoxGeometry(width + 0.4, 0.4, depth + 0.4);
            const roofBorderMesh = new THREE.Mesh(roofBorderGeo, this.materials.roofMetal);
            roofBorderMesh.position.set(x, height + 0.4, z);
            this.scene.add(roofBorderMesh);

            if (height > 15) {
                const hvacGeo = new THREE.BoxGeometry(width * 0.35, 1.2, depth * 0.35);
                const hvacMesh = new THREE.Mesh(hvacGeo, this.materials.roofMetal);
                hvacMesh.position.set(x, height + 1.2, z);
                this.scene.add(hvacMesh);
            }

            this.colliders.push({
                type: 'box',
                minX: x - width / 2 - 0.5,
                maxX: x + width / 2 + 0.5,
                minZ: z - depth / 2 - 0.5,
                maxZ: z + depth / 2 + 0.5
            });
        }

        createSkyscraper(x, z, width, height) {
            this.createBuilding(x, z, width, height);

            const spireGeo = new THREE.ConeGeometry(2, 8, 4);
            const spireMesh = new THREE.Mesh(spireGeo, this.materials.roofMetal);
            spireMesh.position.set(x, height + 4.5, z);
            this.scene.add(spireMesh);
        }

        createWindows(x, z, width, height, depth) {
            const windowGroup = new THREE.Group();
            const rows = Math.floor(height / 3);
            const colsX = Math.floor(width / 3);
            const winGeo = new THREE.PlaneGeometry(1.2, 1.6);

            for (let r = 1; r < rows; r++) {
                const posY = r * 3;
                for (let c = -colsX / 2 + 0.5; c <= colsX / 2 - 0.5; c += 1) {
                    const posX = c * 2.5;

                    const winFront = new THREE.Mesh(winGeo, this.materials.windowGlass);
                    winFront.position.set(x + posX, posY + 0.3, z + depth / 2 + 0.05);
                    windowGroup.add(winFront);

                    const winBack = new THREE.Mesh(winGeo, this.materials.windowGlass);
                    winBack.rotation.y = Math.PI;
                    winBack.position.set(x + posX, posY + 0.3, z - depth / 2 - 0.05);
                    windowGroup.add(winBack);
                }
            }
            this.scene.add(windowGroup);
        }

        createParkingLot(x, z, size) {
            const parkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
            const parkGeo = new THREE.BoxGeometry(size, 0.05, size);
            const parkMesh = new THREE.Mesh(parkGeo, parkMat);
            parkMesh.position.set(x, 0.32, z);
            parkMesh.receiveShadow = true;
            this.scene.add(parkMesh);

            const lineGeo = new THREE.PlaneGeometry(0.2, 4.0);
            lineGeo.rotateX(-Math.PI / 2);
            for (let i = -size / 3; i <= size / 3; i += 3.5) {
                const line = new THREE.Mesh(lineGeo, this.materials.roadMarking);
                line.position.set(x + i, 0.35, z);
                this.scene.add(line);

                if (Math.random() > 0.3) {
                    this.createParkedCar(x + i, z + (Math.random() > 0.5 ? 1.5 : -1.5));
                }
            }
        }

        createParkedCar(x, z) {
            const carGroup = new THREE.Group();
            const color = this.materials.carColors[Math.floor(Math.random() * this.materials.carColors.length)];

            const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, flatShading: true });
            const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

            const bodyGeo = new THREE.BoxGeometry(1.8, 0.5, 3.6);
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.position.y = 0.5;
            bodyMesh.castShadow = true;
            carGroup.add(bodyMesh);

            const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 1.8);
            const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
            cabinMesh.position.set(0, 0.95, -0.2);
            carGroup.add(cabinMesh);

            carGroup.position.set(x, 0.35, z);
            carGroup.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
            this.scene.add(carGroup);

            this.colliders.push({
                type: 'cylinder',
                x: x,
                z: z,
                radius: 1.5
            });
        }

        createTree(x, z) {
            const treeGroup = new THREE.Group();

            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6);
            const trunkMesh = new THREE.Mesh(trunkGeo, this.materials.trunk);
            trunkMesh.position.y = 1.25;
            trunkMesh.castShadow = true;
            treeGroup.add(trunkMesh);

            const isPine = Math.random() > 0.5;
            if (isPine) {
                const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 6), this.materials.foliageDark);
                cone1.position.y = 2.8;
                cone1.castShadow = true;
                treeGroup.add(cone1);

                const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.0, 6), this.materials.foliageLight);
                cone2.position.y = 4.0;
                cone2.castShadow = true;
                treeGroup.add(cone2);
            } else {
                const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), this.materials.foliageLight);
                sphere.position.y = 3.2;
                sphere.castShadow = true;
                treeGroup.add(sphere);
            }

            treeGroup.position.set(x, 0.3, z);
            this.scene.add(treeGroup);

            this.colliders.push({
                type: 'cylinder',
                x: x,
                z: z,
                radius: 0.6
            });
        }

        createStreetLamp(x, z) {
            const lampGroup = new THREE.Group();

            const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5.0, 8);
            const poleMesh = new THREE.Mesh(poleGeo, this.materials.lampPole);
            poleMesh.position.y = 2.5;
            lampGroup.add(poleMesh);

            const armGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
            const armMesh = new THREE.Mesh(armGeo, this.materials.lampPole);
            armMesh.position.set(0.3, 4.8, 0);
            lampGroup.add(armMesh);

            const bulbMat = new THREE.MeshStandardMaterial({
                color: 0xfef08a,
                emissive: 0xfef08a,
                emissiveIntensity: 0.0
            });

            const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
            const headMesh = new THREE.Mesh(headGeo, bulbMat);
            headMesh.position.set(0.6, 4.7, 0);
            lampGroup.add(headMesh);

            const lampLight = new THREE.PointLight(0xfef08a, 0.0, 16, 2.0);
            lampLight.position.set(0.6, 4.5, 0);
            lampGroup.add(lampLight);

            lampGroup.position.set(x, 0.3, z);
            this.scene.add(lampGroup);

            this.lampBulbs.push(bulbMat);
            this.lampLights.push(lampLight);

            this.colliders.push({
                type: 'cylinder',
                x: x,
                z: z,
                radius: 0.3
            });
        }

        createBoundaryWalls(limit) {
            const wallMat = new THREE.MeshStandardMaterial({
                color: 0xef4444,
                transparent: true,
                opacity: 0.35,
                wireframe: false
            });

            const wallGeo = new THREE.BoxGeometry(limit * 2, 6, 2);

            const wallN = new THREE.Mesh(wallGeo, wallMat);
            wallN.position.set(0, 3, limit);
            this.scene.add(wallN);
            this.colliders.push({ type: 'box', minX: -limit, maxX: limit, minZ: limit - 1, maxZ: limit + 1 });

            const wallS = new THREE.Mesh(wallGeo, wallMat);
            wallS.position.set(0, 3, -limit);
            this.scene.add(wallS);
            this.colliders.push({ type: 'box', minX: -limit, maxX: limit, minZ: -limit - 1, maxZ: -limit + 1 });

            const wallE = new THREE.Mesh(wallGeo, wallMat);
            wallE.rotation.y = Math.PI / 2;
            wallE.position.set(limit, 3, 0);
            this.scene.add(wallE);
            this.colliders.push({ type: 'box', minX: limit - 1, maxX: limit + 1, minZ: -limit, maxZ: limit });

            const wallW = new THREE.Mesh(wallGeo, wallMat);
            wallW.rotation.y = Math.PI / 2;
            wallW.position.set(-limit, 3, 0);
            this.scene.add(wallW);
            this.colliders.push({ type: 'box', minX: -limit - 1, maxX: -limit + 1, minZ: -limit, maxZ: limit });
        }

        setNightFactor(nightFactor) {
            const glow = THREE.MathUtils.clamp((nightFactor - 0.2) * 2.0, 0.0, 2.5);
            const lightIntensity = THREE.MathUtils.clamp((nightFactor - 0.25) * 2.5, 0.0, 1.8);

            this.lampBulbs.forEach(b => { b.emissiveIntensity = glow; });
            this.lampLights.forEach(l => { l.intensity = lightIntensity; });
        }
    }

    /* ==========================================================================
       6. CAMERA CONTROLLER
       ========================================================================== */
    class CameraController {
        constructor(camera, carMesh) {
            this.camera = camera;
            this.carMesh = carMesh;

            this.mode = 0;
            this.totalModes = 3;

            this.currentPos = new THREE.Vector3();
            this.currentLookAt = new THREE.Vector3();

            this.baseFov = 60;
            this.maxFovBonus = 12;

            this.followDistance = 8.5;
            this.followHeight = 3.8;
            this.lookAtHeight = 1.2;

            this.initialized = false;
        }

        toggleMode() {
            this.mode = (this.mode + 1) % this.totalModes;
            return this.mode;
        }

        update(carPosition, carYaw, currentSpeed, dt) {
            if (!carPosition) return;

            const forwardX = -Math.sin(carYaw);
            const forwardZ = Math.cos(carYaw);

            let targetCamPos = new THREE.Vector3();
            let targetLookAt = new THREE.Vector3();

            if (this.mode === 0) {
                targetCamPos.x = carPosition.x - forwardX * this.followDistance;
                targetCamPos.y = carPosition.y + this.followHeight;
                targetCamPos.z = carPosition.z - forwardZ * this.followDistance;

                targetLookAt.x = carPosition.x + forwardX * 2.0;
                targetLookAt.y = carPosition.y + this.lookAtHeight;
                targetLookAt.z = carPosition.z + forwardZ * 2.0;

                const speedRatio = Math.min(Math.abs(currentSpeed) / 46.5, 1.0);
                const targetFov = this.baseFov + speedRatio * this.maxFovBonus;
                this.camera.fov += (targetFov - this.camera.fov) * 5.0 * dt;
                this.camera.updateProjectionMatrix();

            } else if (this.mode === 1) {
                targetCamPos.x = carPosition.x + forwardX * 0.4;
                targetCamPos.y = carPosition.y + 1.25;
                targetCamPos.z = carPosition.z + forwardZ * 0.4;

                targetLookAt.x = carPosition.x + forwardX * 15.0;
                targetLookAt.y = carPosition.y + 1.2;
                targetLookAt.z = carPosition.z + forwardZ * 15.0;

                this.camera.fov = this.baseFov;
                this.camera.updateProjectionMatrix();

            } else if (this.mode === 2) {
                targetCamPos.x = carPosition.x - forwardX * 14.0;
                targetCamPos.y = carPosition.y + 12.0;
                targetCamPos.z = carPosition.z - forwardZ * 14.0;

                targetLookAt.copy(carPosition);

                this.camera.fov = 55;
                this.camera.updateProjectionMatrix();
            }

            if (!this.initialized) {
                this.currentPos.copy(targetCamPos);
                this.currentLookAt.copy(targetLookAt);
                this.initialized = true;
            } else {
                const lerpSpeed = this.mode === 1 ? 25.0 : 8.0;
                this.currentPos.lerp(targetCamPos, lerpSpeed * dt);
                this.currentLookAt.lerp(targetLookAt, lerpSpeed * dt);
            }

            this.camera.position.copy(this.currentPos);
            this.camera.lookAt(this.currentLookAt);
        }
    }

    /* ==========================================================================
       7. UI & SPEEDOMETER HUD CONTROLLER
       ========================================================================== */
    class UIController {
        constructor() {
            this.speedValue = document.getElementById('speed-value');
            this.gearIndicator = document.getElementById('gear-indicator');
            this.gaugeFill = document.getElementById('gauge-fill');
            this.pauseModal = document.getElementById('pause-modal');
            this.toastEl = document.getElementById('toast');
            this.soundIcon = document.getElementById('sound-icon');

            this.btnSound = document.getElementById('btn-sound');
            this.btnCamera = document.getElementById('btn-camera');
            this.btnReset = document.getElementById('btn-reset');
            this.btnPause = document.getElementById('btn-pause');
            this.btnResume = document.getElementById('btn-resume');
            this.btnRestart = document.getElementById('btn-restart');
            this.btnFullscreen = document.getElementById('btn-fullscreen');

            this.maxGaugeOffset = 377;
            this.minGaugeOffset = 94;
            this.toastTimer = null;
        }

        init(callbacks) {
            if (this.btnSound) {
                this.btnSound.addEventListener('click', () => {
                    const muted = callbacks.onToggleSound();
                    if (this.soundIcon) this.soundIcon.textContent = muted ? '🔇' : '🔊';
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

            if (this.btnFullscreen) {
                this.btnFullscreen.addEventListener('click', () => {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    } else if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                });
            }
        }

        updateHUD(speedKmH, currentSpeed, isPaused) {
            if (this.speedValue) {
                this.speedValue.textContent = speedKmH;
            }

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

            if (this.gaugeFill) {
                const maxSpeed = 167.0;
                const ratio = THREE.MathUtils.clamp(speedKmH / maxSpeed, 0, 1);
                const targetOffset = this.maxGaugeOffset - ratio * (this.maxGaugeOffset - this.minGaugeOffset);
                this.gaugeFill.style.strokeDashoffset = targetOffset;

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

    /* ==========================================================================
       8. MAIN APPLICATION LOOP
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

            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

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
            const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });

            for (let i = 0; i < 22; i++) {
                const cloud = new THREE.Group();
                const puffs = Math.floor(Math.random() * 3) + 3;
                for (let p = 0; p < puffs; p++) {
                    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random() * 6 + 6, 0), cloudMat);
                    puff.position.set(p * 6 - 8, Math.random() * 2, Math.random() * 4);
                    cloud.add(puff);
                }
                cloud.position.set((Math.random() - 0.5) * 400, Math.random() * 20 + 50, (Math.random() - 0.5) * 400);
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
            window.ui = new UIController();
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

    window.soundEngine = new SoundController();
    window.controls = new InputController();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.game = new GameApp(); });
    } else {
        window.game = new GameApp();
    }

})();
