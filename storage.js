import { pbrSettings } from './config.js';
import { updateAllMaterials } from './materials.js';

export function saveProjectToLocalStorage(state, camera, controls, dracoCompressionLevel, currentQuality, showToastFn) {
    try {
        const projectData = {
            pbrSettings: pbrSettings,
            dracoCompressionLevel: dracoCompressionLevel,
            currentQuality: currentQuality,
            cameraFov: camera.fov,
            cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            controlsTarget: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
            loadedMeshName: state.loadedMeshName,
            timestamp: Date.now()
        };
        localStorage.setItem('pbr_studio_project', JSON.stringify(projectData));
        showToastFn('Project saved to Local Storage!', 'success');
    } catch (e) {
        console.error(e);
        showToastFn('Failed to save to Local Storage', 'error');
    }
}

export function loadProjectFromLocalStorage(state, camera, controls, renderer, dirLight, bloomPass, studioEnvMap, scene, setQualityProfileFn, showToastFn) {
    try {
        const saved = localStorage.getItem('pbr_studio_project');
        if (!saved) {
            showToastFn('No saved project found in Local Storage', 'error');
            return;
        }
        const data = JSON.parse(saved);
        
        if (data.pbrSettings) {
            Object.assign(pbrSettings, data.pbrSettings);
            
            document.getElementById('color-picker').value = '#' + pbrSettings.color.toString(16).padStart(6, '0');
            document.getElementById('input-roughness').value = pbrSettings.roughness;
            document.getElementById('val-roughness').textContent = pbrSettings.roughness.toFixed(2);
            document.getElementById('input-metalness').value = pbrSettings.metalness;
            document.getElementById('val-metalness').textContent = pbrSettings.metalness.toFixed(2);
            document.getElementById('input-transmission').value = pbrSettings.transmission;
            document.getElementById('val-transmission').textContent = pbrSettings.transmission.toFixed(2);
            document.getElementById('input-clearcoat').value = pbrSettings.clearcoat;
            document.getElementById('val-clearcoat').textContent = pbrSettings.clearcoat.toFixed(2);
            document.getElementById('input-emission').value = pbrSettings.emission;
            document.getElementById('val-emission').textContent = pbrSettings.emission.toFixed(2);
            document.getElementById('input-wireframe').checked = pbrSettings.wireframe;
            
            document.getElementById('input-exposure').value = pbrSettings.exposure;
            document.getElementById('val-exposure').textContent = pbrSettings.exposure.toFixed(2);
            renderer.toneMappingExposure = pbrSettings.exposure;
            
            document.getElementById('input-light-intensity').value = pbrSettings.lightIntensity;
            document.getElementById('val-light-intensity').textContent = pbrSettings.lightIntensity.toFixed(2);
            dirLight.intensity = pbrSettings.lightIntensity;

            document.getElementById('input-bloom').value = pbrSettings.bloomIntensity;
            document.getElementById('val-bloom').textContent = pbrSettings.bloomIntensity.toFixed(2);
            if (bloomPass) bloomPass.strength = pbrSettings.bloomIntensity;

            if (pbrSettings.bgType === 'color') {
                scene.background = new THREE.Color(pbrSettings.bgColor);
                document.getElementById('bg-color-picker').value = pbrSettings.bgColor;
                document.getElementById('bg-btn-color').click();
            } else {
                if (studioEnvMap) scene.background = studioEnvMap;
                document.getElementById('bg-btn-hdri').click();
            }

            updateAllMaterials(state.currentModel, (mat) => {
                mat.color.set(pbrSettings.color);
                mat.roughness = pbrSettings.roughness;
                mat.metalness = pbrSettings.metalness;
                mat.clearcoat = pbrSettings.clearcoat;
                mat.transmission = pbrSettings.transmission;
                mat.wireframe = pbrSettings.wireframe;
                if (mat.emissive) {
                    mat.emissive.setHex(pbrSettings.color);
                    mat.emissiveIntensity = pbrSettings.emission;
                }
                mat.needsUpdate = true;
            });
        }

        if (data.cameraFov) {
            camera.fov = data.cameraFov;
            document.getElementById('input-fov').value = data.cameraFov;
            document.getElementById('val-fov').textContent = data.cameraFov + '°';
            camera.updateProjectionMatrix();
        }

        if (data.cameraPosition && data.controlsTarget) {
            camera.position.set(data.cameraPosition.x, data.cameraPosition.y, data.cameraPosition.z);
            controls.target.set(data.controlsTarget.x, data.controlsTarget.y, data.controlsTarget.z);
            controls.update();
        }

        if (data.currentQuality) {
            setQualityProfileFn(data.currentQuality);
        }

        showToastFn('Project loaded from Local Storage!', 'success');
    } catch (e) {
        console.error(e);
        showToastFn('Failed to load project from Local Storage', 'error');
    }
}
