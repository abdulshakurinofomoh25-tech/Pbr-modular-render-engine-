import { pbrSettings } from './config.js';

let dracoLoader = null;

export function initDraco() {
    dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    dracoLoader.preload();
    return dracoLoader;
}

export function createSampleMesh(type, scene, camera, controls, state, showToastFn) {
    if (state.currentModel) scene.remove(state.currentModel);

    let geometry;
    if (type === 'sphere') {
        geometry = new THREE.SphereGeometry(1, 48, 48);
        state.loadedMeshName = "sphere";
    } else if (type === 'knot') {
        geometry = new THREE.TorusKnotGeometry(0.7, 0.25, 96, 24);
        state.loadedMeshName = "torus_knot";
    } else if (type === 'drone') {
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 32);
        state.loadedMeshName = "sci_fi_core";
    }

    const material = new THREE.MeshPhysicalMaterial({
        color: pbrSettings.color,
        roughness: pbrSettings.roughness,
        metalness: pbrSettings.metalness,
        clearcoat: pbrSettings.clearcoat,
        transmission: pbrSettings.transmission,
        wireframe: pbrSettings.wireframe,
        envMapIntensity: 1.0
    });

    state.currentModel = new THREE.Mesh(geometry, material);
    state.currentModel.name = state.loadedMeshName;
    state.currentModel.castShadow = true;
    state.currentModel.receiveShadow = true;
    scene.add(state.currentModel);

    document.getElementById('model-name').textContent = `Primitive: ${type.toUpperCase()}`;
    document.getElementById('model-info').textContent = `${geometry.attributes.position.count.toLocaleString()} Vertices • PBR Physical`;
    
    camera.position.set(0, 1.2, 3.8);
    controls.target.set(0, 0, 0);
}

export function initFileUploadHandlers(scene, camera, controls, state, showToastFn) {
    const fileInputs = [
        document.getElementById('custom-model-input'),
        document.getElementById('top-model-input')
    ];

    fileInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    loadModelFromFile(e.target.files[0], scene, camera, controls, state, showToastFn);
                    e.target.value = '';
                }
            });
        }
    });

    const viewport = document.getElementById('viewport-container');
    viewport.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    viewport.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            loadModelFromFile(e.dataTransfer.files[0], scene, camera, controls, state, showToastFn);
        }
    });
}

function loadModelFromFile(file, scene, camera, controls, state, showToastFn) {
    const filename = file.name;
    const extension = filename.split('.').pop().toLowerCase();

    const spinner = document.getElementById('loading-spinner');
    const loadingProgress = document.getElementById('loading-progress');
    spinner.classList.remove('hidden');
    spinner.classList.remove('opacity-0');
    loadingProgress.textContent = `Loading ${filename}...`;

    if (extension === 'glb' || extension === 'gltf') {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function (e) {
            const contents = e.target.result;
            const loader = new THREE.GLTFLoader();
            loader.setDRACOLoader(dracoLoader);
            
            loader.parse(contents, '', (gltf) => {
                setupLoadedModel(gltf.scene, filename, scene, camera, controls, state, showToastFn);
                spinner.classList.add('opacity-0');
                setTimeout(() => spinner.classList.add('hidden'), 300);
            }, (error) => {
                console.error(error);
                showToastFn('Error parsing GLTF/GLB file', 'error');
                spinner.classList.add('opacity-0');
                setTimeout(() => spinner.classList.add('hidden'), 300);
            });
        };
    } else if (extension === 'drc') {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function (e) {
            const contents = e.target.result;
            dracoLoader.parse(contents, (geometry) => {
                geometry.computeVertexNormals();
                const material = new THREE.MeshPhysicalMaterial({
                    color: pbrSettings.color,
                    roughness: pbrSettings.roughness,
                    metalness: pbrSettings.metalness,
                    clearcoat: pbrSettings.clearcoat,
                    transmission: pbrSettings.transmission,
                    wireframe: pbrSettings.wireframe,
                    envMapIntensity: 1.0
                });
                const mesh = new THREE.Mesh(geometry, material);
                setupLoadedModel(mesh, filename, scene, camera, controls, state, showToastFn);
                spinner.classList.add('opacity-0');
                setTimeout(() => spinner.classList.add('hidden'), 300);
            });
        };
    } else if (extension === 'obj') {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
            const contents = e.target.result;
            const loader = new THREE.OBJLoader();
            const object = loader.parse(contents);
            setupLoadedModel(object, filename, scene, camera, controls, state, showToastFn);
            spinner.classList.add('opacity-0');
            setTimeout(() => spinner.classList.add('hidden'), 300);
        };
    } else {
        showToastFn('Unsupported file format. Use .glb, .gltf, .obj, or .drc', 'error');
        spinner.classList.add('opacity-0');
        setTimeout(() => spinner.classList.add('hidden'), 300);
    }
}

function setupLoadedModel(object, filename, scene, camera, controls, state, showToastFn) {
    if (state.currentModel) scene.remove(state.currentModel);
    state.currentModel = object;
    state.loadedMeshName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");

    const box = new THREE.Box3().setFromObject(state.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    state.currentModel.position.x = -center.x;
    state.currentModel.position.y = -center.y + (size.y / 2);
    state.currentModel.position.z = -center.z;

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        const targetSize = 2.2;
        const scale = targetSize / maxDim;
        state.currentModel.scale.set(scale, scale, scale);
        state.currentModel.position.y = 0;
    }

    let vertexCount = 0;
    state.currentModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.geometry && child.geometry.attributes.position) {
                vertexCount += child.geometry.attributes.position.count;
            }
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => {
                    if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) {
                        const newMat = new THREE.MeshPhysicalMaterial({
                            map: mat.map || null,
                            color: mat.color ? mat.color.clone() : new THREE.Color(pbrSettings.color),
                            roughness: pbrSettings.roughness,
                            metalness: pbrSettings.metalness,
                            clearcoat: pbrSettings.clearcoat,
                            transmission: pbrSettings.transmission,
                            wireframe: pbrSettings.wireframe,
                            envMapIntensity: 1.0
                        });
                        mat.dispose();
                        child.material = newMat;
                    }
                });
            }
        }
    });

    scene.add(state.currentModel);
    document.getElementById('model-name').textContent = filename;
    document.getElementById('model-info').textContent = `${vertexCount.toLocaleString()} Vertices • Uploaded`;
    
    camera.position.set(0, 1.2, 3.8);
    controls.target.set(0, 0, 0);
    showToastFn(`Loaded ${filename}`, 'success');
}
