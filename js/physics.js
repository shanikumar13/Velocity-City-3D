/* ==========================================================================
   Velocity City 3D - Arcade Car Physics & Collision Engine
   ========================================================================== */

class PhysicsEngine {
    constructor(carMesh) {
        this.carMesh = carMesh;

        // Position & Heading
        this.position = new THREE.Vector3(0, 0, 0);
        this.yaw = 0.0; // Heading angle in radians

        // Motion Variables (Increased Speed by ~45% & Boosted Acceleration)
        this.speed = 0.0; // Current velocity magnitude (m/s)
        this.maxSpeedForward = 46.5; // ~167 km/h (45% boost)
        this.maxSpeedReverse = -14.0; // ~50 km/h
        
        this.accelerationPower = 34.0; // Fast punchy acceleration
        this.brakePower = 48.0;
        this.naturalDrag = 9.0;
        this.handbrakeDrag = 32.0;

        this.steerAngle = 0.0;
        this.isDrifting = false;

        // Bounding Dimensions for Collision Detection
        this.carRadius = 1.6;

        this.colliders = [];
        this.resetPosition();
    }

    setColliders(collidersList) {
        this.colliders = collidersList;
    }

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

        // 1. Acceleration & Braking
        let netAccel = 0.0;

        if (throttle > 0) {
            if (this.speed < 0) {
                netAccel += this.brakePower * throttle;
            } else {
                const powerFactor = 1.0 - Math.pow(Math.abs(this.speed) / this.maxSpeedForward, 1.2);
                netAccel += this.accelerationPower * throttle * Math.max(0.25, powerFactor);
            }
        }

        if (brake > 0) {
            if (this.speed > 0) {
                netAccel -= this.brakePower * brake;
            } else {
                const reversePowerFactor = 1.0 - (Math.abs(this.speed) / Math.abs(this.maxSpeedReverse));
                netAccel -= (this.accelerationPower * 0.6) * brake * Math.max(0.2, reversePowerFactor);
            }
        }

        // Natural Friction / Drag
        if (throttle === 0 && brake === 0) {
            if (this.speed > 0) {
                netAccel -= this.naturalDrag;
                if (this.speed + netAccel * dt < 0) this.speed = 0;
            } else if (this.speed < 0) {
                netAccel += this.naturalDrag;
                if (this.speed + netAccel * dt > 0) this.speed = 0;
            }
        }

        // Handbrake Friction
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

        // Update Speed
        this.speed += netAccel * dt;
        this.speed = THREE.MathUtils.clamp(this.speed, this.maxSpeedReverse, this.maxSpeedForward);

        if (Math.abs(this.speed) < 0.05 && throttle === 0 && brake === 0) {
            this.speed = 0;
        }

        // 2. Steering Logic (FIXED STEERING DIRECTION BUG)
        // steeringInput: -1.0 for LEFT, +1.0 for RIGHT
        // Turning LEFT requires increasing yaw (positive turn angle in Three.js top-down view)
        // Turning RIGHT requires decreasing yaw (negative turn angle in Three.js top-down view)
        const speedRatio = Math.abs(this.speed) / this.maxSpeedForward;
        const steeringSensitivity = 1.9 - speedRatio * 0.95; // Responsive & stable at high speed
        const driftMultiplier = this.isDrifting ? 1.6 : 1.0;
        
        const targetSteerAngle = steeringInput * steeringSensitivity;
        this.steerAngle += (targetSteerAngle - this.steerAngle) * 14.0 * dt;

        if (Math.abs(this.speed) > 0.2) {
            const direction = this.speed >= 0 ? 1.0 : -1.0;
            // CORRECT DIRECTION: -steeringInput turns Left when pressing Left (-1), Right when pressing Right (+1)
            this.yaw -= this.steerAngle * direction * (Math.abs(this.speed) / 7.0) * driftMultiplier * dt;
        }

        // 3. World Position Calculation
        // Forward vector matching mesh rotation.y = yaw
        const forwardVector = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            Math.cos(this.yaw)
        );

        const newPos = this.position.clone().addScaledVector(forwardVector, this.speed * dt);

        // 4. Collision Resolution
        this.resolveCollisions(newPos);

        // 5. Apply Position & Rotation
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

                    if (distance === 0) {
                        targetPos.x += this.carRadius;
                    } else {
                        const normalX = distX / distance;
                        const normalZ = distZ / distance;
                        targetPos.x += normalX * overlap;
                        targetPos.z += normalZ * overlap;
                    }

                    this.speed *= -0.25; // Gentle collision bounce
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

    getSpeedKmH() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }
}
