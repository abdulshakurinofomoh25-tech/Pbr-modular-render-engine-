import { pbrSettings } from './config.js';
import { initLights, initProceduralHDR } from './lighting.js';
import { initDraco, createSampleMesh, initFileUploadHandlers } from './loaders.js';
import { initExportHandlers } from './exporters.js';
import { initDrawerUI, showToast } from './ui.js';

const state = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    composer: null,
    bloomPass: null,
    currentModel: null,
    loadedMeshName: "model",
    dirLight: null,
    ambientLight: null,
    studioEnvMap: null,
    dracoCompressionLevel: 7,
    currentQuality: 'high',
    enableAutoFps: true,
    lowFpsStreak: 0,
    frameCount: 0,
    lastFpsUpdate: performance.now()
};

window.addEventListener('load', () => {
    initScene();
    initDraco();
    const lights = initLights(state.scene);
    state.dirLight = lights.dirLight;
    state.ambientLight = lights.ambientLight;
    
    state.studioEnvMap = initProceduralHDR(state.renderer, state.scene);
    
    createSampleMesh('sphere', state.scene, state.camera, state.controls, state, showToast);
    
    initDrawerUI(
        state,
        state.scene,
        state.camera,
        state.controls,
        state.renderer,
        state.dirLight,
        state.bloomPass,
        state.studioEnvMap,
        () => state.dracoCompressionLevel,
        setQualityProfile
    );
    
    initExportHandlers(state, () => state.dracoCompressionLevel, showToast);
    initFileUploadHandlers(state.scene, state.camera, state.controls, state, showToast);
    
    animate();

    setTimeout(() => {
        const hint = document.getElementById('gesture-hint');
        if (hint) hint.classList.add('opacity-0');
    }, 6000);
});

function initScene() {
    const canvas = document.getElementById('webgl-canvas');

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(pbrSettings.bgColor);

    const isMobile = window.innerWidth < 640;
    state.camera = new THREE.PerspectiveCamera(isMobile ? 55 : 45, window.innerWidth / window.innerHeight, 0.1, 100);
    state.camera.position.set(0, 1.2, 3.8);

    state.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
    });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = pbrSettings.exposure;
    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    state.composer = new THREE.EffectComposer(state.renderer);
    const renderPass = new THREE.RenderPass(state.scene, state.camera);
    state.composer.addPass(renderPass);

    state.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        pbrSettings.bloomIntensity,
        0.4,
        0.85
    );
    state.composer.addPass(state.bloomPass);

    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.05;
    state.controls.maxDistance = 15;
    state.controls.minDistance = 0.5;
    state.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };

    const gridHelper = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -1;
    state.scene.add(gridHelper);

    window.addEventListener('resize', onWindowResize);
}

function setQualityProfile(quality) {
    state.currentQuality = quality;
    document.getElementById('perf-badge').textContent = quality.toUpperCase();

    if (quality === 'high') {
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        state.renderer.shadowMap.enabled = true;
        if (state.dirLight) state.dirLight.castShadow = true;
    } else if (quality === 'medium') {
        state.renderer.setPixelRatio(1.0);
        state.renderer.shadowMap.enabled = true;
        if (state.dirLight) state.dirLight.castShadow = true;
    } else if (quality === 'low') {
        state.renderer.setPixelRatio(0.85);
        state.renderer.shadowMap.enabled = false;
        if (state.dirLight) state.dirLight.castShadow = false;
    }
    showToast(`Quality: ${quality.toUpperCase()}`, 'info');
}

function onWindowResize() {
    const isMobile = window.innerWidth < 640;
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.fov = isMobile ? 55 : 45;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    if (state.composer) state.composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    state.controls.update();

    state.frameCount++;
    const now = performance.now();
    if (now - state.lastFpsUpdate >= 1000) {
        const fps = Math.round((state.frameCount * 1000) / (now - state.lastFpsUpdate));
        document.getElementById('fps-counter').textContent = `${fps} FPS`;

        if (state.enableAutoFps && fps < 28 && state.currentQuality !== 'low') {
            state.lowFpsStreak++;
            if (state.lowFpsStreak >= 3) {
                setQualityProfile(state.currentQuality === 'high' ? 'medium' : 'low');
                showToast('Auto-adjusted quality for smooth FPS', 'info');
                state.lowFpsStreak = 0;
            }
        } else {
            state.lowFpsStreak = 0;
        }

        state.frameCount = 0;
        state.lastFpsUpdate = now;
    }

    if (state.composer && state.bloomPass && state.bloomPass.strength > 0) {
        state.composer.render();
    } else {
        state.renderer.render(state.scene, state.camera);
    }
}
