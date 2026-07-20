/* ==========================================================================
   Velocity City 3D - Third-Person & Chase Follow Camera Controller
   ========================================================================== */

class CameraController {
    constructor(camera, carMesh) {
        this.camera = camera;
        this.carMesh = carMesh;

        // Camera Modes: 0 = Smooth 3rd Person, 1 = Hood/Bonnet Cam, 2 = Cinematic High Angle
        this.mode = 0;
        this.totalModes = 3;

        // Current & Target Vectors
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();

        // Base Configuration
        this.baseFov = 60;
        this.maxFovBonus = 12;

        // Offset parameters for Mode 0 (3rd Person)
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

        const forwardX = Math.sin(carYaw);
        const forwardZ = Math.cos(carYaw);

        let targetCamPos = new THREE.Vector3();
        let targetLookAt = new THREE.Vector3();

        if (this.mode === 0) {
            // MODE 0: Smooth 3rd-Person Follow Camera
            targetCamPos.x = carPosition.x - forwardX * this.followDistance;
            targetCamPos.y = carPosition.y + this.followHeight;
            targetCamPos.z = carPosition.z - forwardZ * this.followDistance;

            targetLookAt.x = carPosition.x + forwardX * 2.0;
            targetLookAt.y = carPosition.y + this.lookAtHeight;
            targetLookAt.z = carPosition.z + forwardZ * 2.0;

            // Dynamic FOV Boost based on Speed
            const speedRatio = Math.min(Math.abs(currentSpeed) / 32.0, 1.0);
            const targetFov = this.baseFov + speedRatio * this.maxFovBonus;
            this.camera.fov += (targetFov - this.camera.fov) * 5.0 * dt;
            this.camera.updateProjectionMatrix();

        } else if (this.mode === 1) {
            // MODE 1: Hood / Bonnet First-Person Cam
            targetCamPos.x = carPosition.x + forwardX * 0.4;
            targetCamPos.y = carPosition.y + 1.25;
            targetCamPos.z = carPosition.z + forwardZ * 0.4;

            targetLookAt.x = carPosition.x + forwardX * 15.0;
            targetLookAt.y = carPosition.y + 1.2;
            targetLookAt.z = carPosition.z + forwardZ * 15.0;

            this.camera.fov = this.baseFov;
            this.camera.updateProjectionMatrix();

        } else if (this.mode === 2) {
            // MODE 2: Cinematic High Angle Drone View
            targetCamPos.x = carPosition.x - forwardX * 14.0;
            targetCamPos.y = carPosition.y + 12.0;
            targetCamPos.z = carPosition.z - forwardZ * 14.0;

            targetLookAt.copy(carPosition);

            this.camera.fov = 55;
            this.camera.updateProjectionMatrix();
        }

        // Initialize position on first frame without lerp delay
        if (!this.initialized) {
            this.currentPos.copy(targetCamPos);
            this.currentLookAt.copy(targetLookAt);
            this.initialized = true;
        } else {
            // Smooth lerp lag for polished feel
            const lerpSpeed = this.mode === 1 ? 25.0 : 8.0;
            this.currentPos.lerp(targetCamPos, lerpSpeed * dt);
            this.currentLookAt.lerp(targetLookAt, lerpSpeed * dt);
        }

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLookAt);
    }
}
