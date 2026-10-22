import { pbrSettings } from './config.js';
import { updateAllMaterials, applyPreset } from './materials.js';
import { createSampleMesh } from './loaders.js';
import { saveProjectToLocalStorage, loadProjectFromLocalStorage } from './storage.js';

export function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2200);
}

export function initDrawerUI(state, scene, camera, controls, renderer, dirLight, bloomPass, studioEnvMap, getDracoLevelFn, setQualityProfileFn) {
    const drawer = document.getElementById('controls-drawer');
    const openBtn = document.getElementById('btn-open-drawer');
    const closeBtn = document.getElementById('btn-close-drawer');
    const toggleUiBtn = document.getElementById('btn-toggle-ui');
    const toolbar = document.getElementById('quick-toolbar');

    function openDrawer() { drawer.classList.remove('translate-y-full'); }
    function closeDrawer() { drawer.classList.add('translate-y-full'); }

    openBtn.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    toggleUiBtn.addEventListener('click', () => {
        toolbar.classList.toggle('opacity-0');
        toolbar.classList.toggle('pointer-events-none');
    });

    // Tab Switching
    const tabs = ['material', 'env', 'mesh', 'export', 'engine'];
    tabs.forEach(tab => {
        document.getElementById(`tab-btn-${tab}`).addEventListener('click', () => {
            tabs.forEach(t => {
                document.getElementById(`tab-content-${t}`).classList.add('hidden');
                document.getElementById(`tab-btn-${t}`).classList.remove('text-blue-400', 'border-blue-500', 'font-semibold');
                document.getElementById(`tab-btn-${tab}`).classList.add('text-slate-400', 'border-transparent');
            });
            document.getElementById(`tab-content-${tab}`).classList.remove('hidden');
            document.getElementById(`tab-btn-${tab}`).classList.add('text-blue-400', 'border-blue-500', 'font-semibold');
        });
    });

    // Sliders & Controls
    setupSlider('input-roughness', 'val-roughness', (v) => {
        pbrSettings.roughness = v;
        updateAllMaterials(state.currentModel, (mat) => { mat.roughness = v; });
    });
    setupSlider('input-metalness', 'val-metalness', (v) => {
        pbrSettings.metalness = v;
        updateAllMaterials(state.currentModel, (mat) => { mat.metalness = v; });
    });
    setupSlider('input-transmission', 'val-transmission', (v) => {
        pbrSettings.transmission = v;
        updateAllMaterials(state.currentModel, (mat) => { mat.transmission = v; });
    });
    setupSlider('input-clearcoat', 'val-clearcoat', (v) => {
        pbrSettings.clearcoat = v;
        updateAllMaterials(state.currentModel, (mat) => { mat.clearcoat = v; });
    });
    setupSlider('input-emission', 'val-emission', (v) => {
        pbrSettings.emission = v;
        updateAllMaterials(state.currentModel, (mat) => {
            if (mat.emissive) {
                mat.emissive.setHex(mat.color ? mat.color.getHex() : 0xffffff);
                mat.emissiveIntensity = v;
            }
        });
    });

    setupSlider('input-bloom', 'val-bloom', (v) => {
        pbrSettings.bloomIntensity = v;
        if (bloomPass) bloomPass.strength = v;
    });

    setupSlider('input-exposure', 'val-exposure', (v) => {
        pbrSettings.exposure = v;
        renderer.toneMappingExposure = v;
    });
    setupSlider('input-light-intensity', 'val-light-intensity', (v) => {
        pbrSettings.lightIntensity = v;
        dirLight.intensity = v;
    });
    setupSlider('input-fov', 'val-fov', (v) => {
        camera.fov = v;
        camera.updateProjectionMatrix();
    }, '°');

    document.getElementById('input-draco-level').addEventListener('input', (e) => {
        state.dracoCompressionLevel = parseInt(e.target.value);
        document.getElementById('val-draco-level').textContent = state.dracoCompressionLevel;
    });

    document.getElementById('input-light-rotation').addEventListener('input', (e) => {
        const angle = e.target.value * (Math.PI / 180);
        dirLight.position.x = Math.cos(angle) * 4;
        dirLight.position.z = Math.sin(angle) * 4;
        document.getElementById('val-light-rotation').textContent = `${e.target.value}°`;
    });

    document.getElementById('color-picker').addEventListener('input', (e) => {
        pbrSettings.color = parseInt(e.target.value.replace('#', '0x'), 16);
        updateAllMaterials(state.currentModel, (mat) => { mat.color.set(e.target.value); });
    });
    document.getElementById('bg-color-picker').addEventListener('input', (e) => {
        pbrSettings.bgColor = e.target.value;
        if (pbrSettings.bgType === 'color') scene.background = new THREE.Color(e.target.value);
    });

    document.getElementById('input-wireframe').addEventListener('change', (e) => {
        pbrSettings.wireframe = e.target.checked;
        updateAllMaterials(state.currentModel, (mat) => { mat.wireframe = e.target.checked; });
    });
    document.getElementById('input-grid').addEventListener('change', (e) => {
        const gridHelper = scene.getObjectByProperty('type', 'GridHelper');
        if (gridHelper) gridHelper.visible = e.target.checked;
    });
    document.getElementById('input-autorotate').addEventListener('change', (e) => {
        controls.autoRotate = e.target.checked;
        controls.autoRotateSpeed = 2.0;
    });
    document.getElementById('input-shadows').addEventListener('change', (e) => {
        renderer.shadowMap.enabled = e.target.checked;
        dirLight.castShadow = e.target.checked;
    });
    document.getElementById('input-autofps').addEventListener('change', (e) => {
        state.enableAutoFps = e.target.checked;
    });

    // Local Storage Buttons
    document.getElementById('btn-save-storage').addEventListener('click', () => saveProjectToLocalStorage(state, camera, controls, getDracoLevelFn(), state.currentQuality, showToast));
    document.getElementById('btn-load-storage').addEventListener('click', () => loadProjectFromLocalStorage(state, camera, controls, renderer, dirLight, bloomPass, studioEnvMap, scene, setQualityProfileFn, showToast));

    // Background Mode Buttons
    const bgHdriBtn = document.getElementById('bg-btn-hdri');
    const bgColorBtn = document.getElementById('bg-btn-color');
    const bgColorContainer = document.getElementById('bg-color-container');

    bgHdriBtn.addEventListener('click', () => {
        pbrSettings.bgType = 'hdri';
        scene.background = studioEnvMap;
        bgHdriBtn.className = "py-2.5 rounded-xl border border-blue-500/50 bg-blue-500/20 text-slate-200 font-medium";
        bgColorBtn.className = "py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 font-medium";
        bgColorContainer.classList.add('hidden');
    });

    bgColorBtn.addEventListener('click', () => {
        pbrSettings.bgType = 'color';
        scene.background = new THREE.Color(pbrSettings.bgColor);
        bgColorBtn.className = "py-2.5 rounded-xl border border-blue-500/50 bg-blue-500/20 text-slate-200 font-medium";
        bgHdriBtn.className = "py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 font-medium";
        bgColorContainer.classList.remove('hidden');
    });

    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset, state.currentModel, showToast));
    });

    document.querySelectorAll('.btn-mesh').forEach(btn => {
        btn.addEventListener('click', () => createSampleMesh(btn.dataset.mesh, scene, camera, controls, state, showToast));
    });

    document.querySelectorAll('.btn-perf-preset').forEach(btn => {
        btn.addEventListener('click', () => setQualityProfileFn(btn.dataset.quality));
    });
    document.getElementById('btn-perf-toggle').addEventListener('click', () => {
        const nextQuality = state.currentQuality === 'high' ? 'medium' : state.currentQuality === 'medium' ? 'low' : 'high';
        setQualityProfileFn(nextQuality);
    });

    document.getElementById('btn-quick-gold').addEventListener('click', () => applyPreset('gold', state.currentModel, showToast));
    document.getElementById('btn-quick-chrome').addEventListener('click', () => applyPreset('chrome', state.currentModel, showToast));
    document.getElementById('btn-quick-glass').addEventListener('click', () => applyPreset('glass', state.currentModel, showToast));
    document.getElementById('btn-focus-mesh').addEventListener('click', () => {
        if (!state.currentModel) return;
        camera.position.set(0, 1.2, 3.8);
        controls.target.set(0, 0, 0);
    });
    document.getElementById('btn-screenshot').addEventListener('click', () => {
        if (renderer) {
            renderer.render(scene, camera);
            const link = document.createElement('a');
            link.download = `pbr-snapshot-${Date.now()}.png`;
            link.href = renderer.domElement.toDataURL('image/png');
            link.click();
            showToast('Snapshot saved', 'success');
        }
    });
}

function setupSlider(inputId, valId, callback, suffix = '') {
    const input = document.getElementById(inputId);
    const valSpan = document.getElementById(valId);
    if (input && valSpan) {
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            valSpan.textContent = `${val.toFixed(2)}${suffix}`;
            callback(val);
        });
    }
}
