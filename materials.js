import { pbrSettings, presets } from './config.js';

export function updateAllMaterials(currentModel, callback) {
    if (!currentModel) return;
    currentModel.traverse((child) => {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
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
                    callback(newMat);
                } else {
                    callback(mat);
                }
            });
        }
    });
}

export function applyPreset(key, currentModel, showToastFn) {
    const p = presets[key];
    if (!p || !currentModel) return;

    updateAllMaterials(currentModel, (mat) => {
        if (p.color !== undefined) {
            mat.color.setHex(p.color);
            const colorPicker = document.getElementById('color-picker');
            if (colorPicker) colorPicker.value = '#' + p.color.toString(16).padStart(6, '0');
        }
        if (p.roughness !== undefined) {
            mat.roughness = p.roughness;
            const rInput = document.getElementById('input-roughness');
            const rVal = document.getElementById('val-roughness');
            if (rInput) rInput.value = p.roughness;
            if (rVal) rVal.textContent = p.roughness.toFixed(2);
        }
        if (p.metalness !== undefined) {
            mat.metalness = p.metalness;
            const mInput = document.getElementById('input-metalness');
            const mVal = document.getElementById('val-metalness');
            if (mInput) mInput.value = p.metalness;
            if (mVal) mVal.textContent = p.metalness.toFixed(2);
        }
        if (p.transmission !== undefined) {
            mat.transmission = p.transmission;
            const tInput = document.getElementById('input-transmission');
            const tVal = document.getElementById('val-transmission');
            if (tInput) tInput.value = p.transmission;
            if (tVal) tVal.textContent = p.transmission.toFixed(2);
        }
        mat.needsUpdate = true;
    });
    if (showToastFn) showToastFn(`Preset: ${key.toUpperCase()}`, 'info');
}
