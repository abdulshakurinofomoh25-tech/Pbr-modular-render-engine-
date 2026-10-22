export function initExportHandlers(state, getDracoLevelFn, showToastFn) {
    document.getElementById('btn-export-draco').addEventListener('click', () => exportGLTF(state, { binary: true, draco: true }, getDracoLevelFn, showToastFn));
    document.getElementById('btn-export-glb').addEventListener('click', () => exportGLTF(state, { binary: true, draco: false }, getDracoLevelFn, showToastFn));
    document.getElementById('btn-export-gltf').addEventListener('click', () => exportGLTF(state, { binary: false, draco: false }, getDracoLevelFn, showToastFn));
    document.getElementById('btn-export-obj').addEventListener('click', () => exportOBJ(state, showToastFn));
    document.getElementById('btn-export-json').addEventListener('click', () => exportJSON(state, showToastFn));
    document.getElementById('btn-export-csv').addEventListener('click', () => exportCSV(state, showToastFn));
}

function exportGLTF(state, options, getDracoLevelFn, showToastFn) {
    if (!state.currentModel) {
        showToastFn('No active 3D model to export', 'error');
        return;
    }

    const exporter = new THREE.GLTFExporter();
    const exportOptions = {
        binary: options.binary,
        embedImages: true
    };

    if (options.draco) {
        if (typeof THREE.DRACOExporter !== 'undefined') {
            exportOptions.dracoOptions = {
                compressionLevel: getDracoLevelFn()
            };
        } else {
            showToastFn('Draco Exporter script unavailable', 'error');
            return;
        }
    }

    exporter.parse(
        state.currentModel,
        (result) => {
            if (options.binary) {
                const blob = new Blob([result], { type: 'application/octet-stream' });
                const suffix = options.draco ? '_draco.glb' : '.glb';
                downloadFile(blob, `${state.loadedMeshName}${suffix}`);
            } else {
                const output = JSON.stringify(result, null, 2);
                const blob = new Blob([output], { type: 'application/json' });
                downloadFile(blob, `${state.loadedMeshName}.gltf`);
            }
            showToastFn(`Exported ${state.loadedMeshName}${options.draco ? ' (Draco GLB)' : options.binary ? '.glb' : '.gltf'}`, 'success');
        },
        (error) => {
            console.error(error);
            showToastFn('Error exporting GLTF model', 'error');
        },
        exportOptions
    );
}

function exportOBJ(state, showToastFn) {
    if (!state.currentModel) {
        showToastFn('No active 3D model to export', 'error');
        return;
    }
    const exporter = new THREE.OBJExporter();
    const result = exporter.parse(state.currentModel);
    const blob = new Blob([result], { type: 'text/plain' });
    downloadFile(blob, `${state.loadedMeshName}.obj`);
    showToastFn(`Exported ${state.loadedMeshName}.obj`, 'success');
}

function exportJSON(state, showToastFn) {
    if (!state.currentModel) {
        showToastFn('No active 3D model to export', 'error');
        return;
    }
    const output = state.currentModel.toJSON();
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${state.loadedMeshName}.json`);
    showToastFn(`Exported ${state.loadedMeshName}.json`, 'success');
}

function exportCSV(state, showToastFn) {
    if (!state.currentModel) {
        showToastFn('No active 3D model to export', 'error');
        return;
    }
    let csvContent = "Mesh_Name,Vertex_Index,Position_X,Position_Y,Position_Z,Normal_X,Normal_Y,Normal_Z\n";
    let totalVertices = 0;

    state.currentModel.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const geo = child.geometry;
            const pos = geo.attributes.position;
            const norm = geo.attributes.normal;
            const meshName = child.name || "Mesh";

            if (pos) {
                for (let i = 0; i < pos.count; i++) {
                    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
                    const nx = norm ? norm.getX(i) : 0, ny = norm ? norm.getY(i) : 0, nz = norm ? norm.getZ(i) : 0;
                    csvContent += `"${meshName}",${i},${px.toFixed(6)},${py.toFixed(6)},${pz.toFixed(6)},${nx.toFixed(6)},${ny.toFixed(6)},${nz.toFixed(6)}\n`;
                    totalVertices++;
                }
            }
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${state.loadedMeshName}_vertices.csv`);
    showToastFn(`Exported ${totalVertices.toLocaleString()} vertices to .CSV`, 'success');
}

function downloadFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
