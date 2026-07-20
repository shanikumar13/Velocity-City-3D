/* ==========================================================================
   Velocity City 3D - Procedural Low-Poly City Builder (Visual Upgrade)
   ========================================================================== */

class CityBuilder {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.lampBulbs = [];
        this.lampLights = [];

        // Materials Cache with Rich HSL Color Tokens
        this.materials = {
            road: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
            roadMarking: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
            yellowMarking: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }),
            sidewalk: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 }),
            curb: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 }),
            grass: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }),
            
            // Modern Architecture Palette
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
            
            // Foliage & Nature
            trunk: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
            foliageLight: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75, flatShading: true }),
            foliageDark: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75, flatShading: true }),
            
            // Street Lighting
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

        // Base Grass Field
        const groundGeo = new THREE.PlaneGeometry(650, 650);
        groundGeo.rotateX(-Math.PI / 2);
        const groundMesh = new THREE.Mesh(groundGeo, this.materials.grass);
        groundMesh.position.y = -0.05;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        // Road & Sidewalk Network
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

        // Map Boundary Perimeter
        this.createBoundaryWalls(halfSize + 20);
    }

    createRoadSegment(x, z, length, width) {
        const roadGeo = new THREE.PlaneGeometry(length + width, length + width);
        roadGeo.rotateX(-Math.PI / 2);
        const roadMesh = new THREE.Mesh(roadGeo, this.materials.road);
        roadMesh.position.set(x, 0.01, z);
        roadMesh.receiveShadow = true;
        this.scene.add(roadMesh);

        // Center Yellow Dividers
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
        // Sidewalk Base
        const sidewalkGeo = new THREE.BoxGeometry(size, 0.3, size);
        const sidewalkMesh = new THREE.Mesh(sidewalkGeo, this.materials.sidewalk);
        sidewalkMesh.position.set(centerX, 0.15, centerZ);
        sidewalkMesh.receiveShadow = true;
        this.scene.add(sidewalkMesh);

        // Curbs Trim
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

        // Roof Border Rim
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

        this.lampBulbs.forEach(b => {
            b.emissiveIntensity = glow;
        });

        this.lampLights.forEach(l => {
            l.intensity = lightIntensity;
        });
    }
}
