/* ==========================================================================
   Velocity City 3D - Enhanced Low-Poly Sports Car (Visual Upgrade)
   ========================================================================== */

class Car {
    constructor() {
        this.mesh = new THREE.Group();
        this.bodyGroup = new THREE.Group(); // Inner body for suspension roll & pitch
        this.mesh.add(this.bodyGroup);

        this.frontLeftWheel = null;
        this.frontRightWheel = null;
        this.rearLeftWheel = null;
        this.rearRightWheel = null;
        this.wheels = [];

        this.headlightMaterial = null;
        this.taillightMaterial = null;
        this.spotlights = [];
        this.exhaustParticles = [];

        this.buildCar();
    }

    buildCar() {
        // Metallic Clearcoat Car Body Paint
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2563eb, // Electric Cobalt Blue
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

        // 1. Lower Chassis & Aerodynamic Body Lines
        const chassisGeo = new THREE.BoxGeometry(2.05, 0.58, 4.4);
        const chassisMesh = new THREE.Mesh(chassisGeo, bodyMat);
        chassisMesh.position.y = 0.55;
        chassisMesh.castShadow = true;
        chassisMesh.receiveShadow = true;
        this.bodyGroup.add(chassisMesh);

        // Front Bumper Splitter & Lower Grille
        const bumperGeo = new THREE.BoxGeometry(1.95, 0.28, 0.45);
        const bumperMesh = new THREE.Mesh(bumperGeo, darkTrimMat);
        bumperMesh.position.set(0, 0.35, 2.12);
        bumperMesh.castShadow = true;
        this.bodyGroup.add(bumperMesh);

        // Hood Scoop Accent
        const scoopGeo = new THREE.BoxGeometry(0.85, 0.08, 1.3);
        const scoopMesh = new THREE.Mesh(scoopGeo, darkTrimMat);
        scoopMesh.position.set(0, 0.86, 0.7);
        this.bodyGroup.add(scoopMesh);

        // Side Skirts
        const skirtGeo = new THREE.BoxGeometry(2.15, 0.15, 2.8);
        const skirtMesh = new THREE.Mesh(skirtGeo, darkTrimMat);
        skirtMesh.position.set(0, 0.32, 0);
        this.bodyGroup.add(skirtMesh);

        // 2. Tapered Glass Cabin Roof
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

        // Rear Wing Spoiler
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

        // Dual Chrome Exhaust Pipes
        const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 12);
        pipeGeo.rotateX(Math.PI / 2);
        const pipeL = new THREE.Mesh(pipeGeo, chromeMat);
        pipeL.position.set(-0.55, 0.35, -2.22);
        const pipeR = new THREE.Mesh(pipeGeo, chromeMat);
        pipeR.position.set(0.55, 0.35, -2.22);
        this.bodyGroup.add(pipeL);
        this.bodyGroup.add(pipeR);

        // 3. Headlights & Taillights
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

        // Headlight Beams (Dual Spotlights)
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

        // 4. Wheels with 5-Spoke Chrome Rims & Red Brake Calipers
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

            // Rubber Tire Cylinder
            const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
            tireGeo.rotateZ(Math.PI / 2);
            const tireMesh = new THREE.Mesh(tireGeo, tireMat);
            tireMesh.castShadow = true;
            wheelMeshGroup.add(tireMesh);

            // Chrome Metallic Rim Disc
            const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 12);
            rimGeo.rotateZ(Math.PI / 2);
            const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
            wheelMeshGroup.add(rimMesh);

            // 5-Spoke Rim Detail
            const spokeCount = 5;
            for (let s = 0; s < spokeCount; s++) {
                const spokeAngle = (s / spokeCount) * Math.PI * 2;
                const spokeGeo = new THREE.BoxGeometry(wheelWidth + 0.03, wheelRadius * 0.9, 0.06);
                const spokeMesh = new THREE.Mesh(spokeGeo, chromeMat);
                spokeMesh.rotation.x = spokeAngle;
                wheelMeshGroup.add(spokeMesh);
            }

            // Red Brake Caliper
            const caliperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.16);
            const caliperMesh = new THREE.Mesh(caliperGeo, brakeCaliperMat);
            caliperMesh.position.set(0, 0.12, 0);
            pivotGroup.add(caliperMesh);

            pivotGroup.add(wheelMeshGroup);
            this.mesh.add(pivotGroup);

            const wheelObj = {
                pivot: pivotGroup,
                mesh: wheelMeshGroup,
                isFront: pos.front
            };

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
        // Wheel Steering Pivot
        const maxSteerAngle = 0.48;
        const targetSteerAngle = -steeringAngle * maxSteerAngle;
        if (this.frontLeftWheel && this.frontRightWheel) {
            this.frontLeftWheel.pivot.rotation.y = targetSteerAngle;
            this.frontRightWheel.pivot.rotation.y = targetSteerAngle;
        }

        // Wheel Rolling
        const wheelRadius = 0.42;
        const angularVelocity = (currentSpeed / wheelRadius) * dt;
        this.wheels.forEach((w) => {
            w.mesh.rotation.x += angularVelocity;
        });

        // Smooth Suspension Pitch & Roll Leaning
        const targetPitch = isBraking ? 0.09 : (currentSpeed > 2 && Math.abs(steeringAngle) < 0.2 ? -0.05 : 0);
        const targetRoll = steeringAngle * (Math.abs(currentSpeed) / 40) * 0.14;

        this.bodyGroup.rotation.x += (targetPitch - this.bodyGroup.rotation.x) * 10.0 * dt;
        this.bodyGroup.rotation.z += (targetRoll - this.bodyGroup.rotation.z) * 10.0 * dt;

        // Taillight Glow Intensity
        if (this.taillightMaterial) {
            this.taillightMaterial.emissiveIntensity = isBraking ? 2.2 : 0.4;
        }
    }

    setNightFactor(nightFactor) {
        const spotIntensity = 0.5 + nightFactor * 2.8;
        this.spotlights.forEach(s => {
            s.intensity = spotIntensity;
        });

        if (this.headlightMaterial) {
            this.headlightMaterial.emissiveIntensity = 0.8 + nightFactor * 1.8;
        }
    }
}
