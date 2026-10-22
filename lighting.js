import { pbrSettings } from './config.js';

export let ambientLight, dirLight, studioEnvMap = null;

export function initLights(scene) {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, pbrSettings.lightIntensity);
    dirLight.position.set(3, 4, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    return { ambientLight, dirLight };
}

export function initProceduralHDR(renderer, scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#111827');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSoftbox(ctx, 100, 70, 120, 60, '#ffffff', 0.95);
    drawSoftbox(ctx, 380, 80, 150, 70, '#e0f2fe', 0.85);
    drawSoftbox(ctx, 250, 200, 200, 40, '#38bdf8', 0.3);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    studioEnvMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = studioEnvMap;

    if (pbrSettings.bgType === 'hdri') {
        scene.background = studioEnvMap;
    }

    pmremGenerator.dispose();
    texture.dispose();

    return studioEnvMap;
}

function drawSoftbox(ctx, x, y, w, h, color, alpha) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, w / 2);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
}
