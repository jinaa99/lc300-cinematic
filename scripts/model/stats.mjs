/** Scene statistics for a glTF-Transform Document (shared by build and inspect). */

function primitiveTriangles(prim) {
  const indices = prim.getIndices();
  const count = indices ? indices.getCount() : prim.getAttribute("POSITION").getCount();
  return prim.getMode() === 4 ? count / 3 : 0;
}

export function sceneStats(doc) {
  const root = doc.getRoot();
  let triangles = 0;
  let drawCalls = 0;
  let nodes = 0;
  for (const scene of root.listScenes()) {
    scene.traverse((node) => {
      nodes++;
      const mesh = node.getMesh();
      if (!mesh) return;
      for (const prim of mesh.listPrimitives()) {
        drawCalls++;
        triangles += primitiveTriangles(prim);
      }
    });
  }
  const sizes = root.listTextures().map((t) => t.getSize() ?? [0, 0]);
  return {
    triangles,
    drawCalls,
    nodes,
    materials: root.listMaterials().length,
    textures: root.listTextures().length,
    maxTextureSize: Math.max(0, ...sizes.flat()),
  };
}

export { primitiveTriangles };
