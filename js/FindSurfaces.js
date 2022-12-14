import * as THREE from "three";

/*
  Computes "surface IDs" for a given mesh.
*/
class FindSurfaces {
  constructor() {
    // This identifier will be globally unique for each surface across all geometry rendered on screen
    this.surfaceId = 0;
  }

  /*
   * Returns the surface IDs as an array that can be inserted as a vertex attribute
   */
  getSurfaceIdAttribute(mesh) {
    const bufferGeometry = mesh.geometry;
    const numVertices = bufferGeometry.attributes.position.count;
    const vertexIdToSurfaceId = this._generateSurfaceIds(mesh);

    const colors = [];
    for (let i = 0; i < numVertices; i++) {
      const vertexId = i;
      let surfaceId = vertexIdToSurfaceId[vertexId];

      colors.push(surfaceId, 0, 0, 1);
    }

    const colorsTypedArray = new Float32Array(colors);
    return colorsTypedArray;
  }

  /*
   * Returns a `vertexIdToSurfaceId` map
   * given a vertex, returns the surfaceId
   */
  _generateSurfaceIds(mesh) {
    const bufferGeometry = mesh.geometry;
    const numIndices = bufferGeometry.index.count;
    const indexBuffer = bufferGeometry.index.array;
    // For each vertex, search all its neighbors
    const vertexMap = {};
    for (let i = 0; i < numIndices; i += 3) {
      const i1 = indexBuffer[i + 0];
      const i2 = indexBuffer[i + 1];
      const i3 = indexBuffer[i + 2];

      add(i1, i2);
      add(i1, i3);
      add(i2, i3);
    }
    // Function for creating vertex map of neighbors
    function add(a, b) {
      if (vertexMap[a] == undefined) vertexMap[a] = [];
      if (vertexMap[b] == undefined) vertexMap[b] = [];

      if (vertexMap[a].indexOf(b) == -1) vertexMap[a].push(b);
      if (vertexMap[b].indexOf(a) == -1) vertexMap[b].push(a);
    }

    // Find cycles 
    const nodes = Object.keys(vertexMap).map((v) => Number(v));
    const explored = {};
    const vertexIdToSurfaceId = {};

    while (nodes.length > 0) {
      const node = nodes.pop();
      if (explored[node]) continue;

      // Get all neighbors recursively
      const surfaceNodes = getNeighborsNonRecursive(node);
      // Mark them as explored
      for (let v of surfaceNodes) {
        explored[v] = true;
        vertexIdToSurfaceId[v] = this.surfaceId;
      }

      this.surfaceId += 1;
    }

    function getNeighborsNonRecursive(node) {
      const nodes = [node];
      const explored = {};
      const result = [];

      while (nodes.length > 0) {
        const current = nodes.pop();
        if (explored[current]) continue;
        const neighbors = vertexMap[current];
        result.push(current);

        explored[current] = true;

        for (let n of neighbors) {
          if (!explored[n]) {
            nodes.push(n);
          }
        }
      }

      return result;
    }

    return vertexIdToSurfaceId;
  }
}

export default FindSurfaces;

export function getSurfaceIdMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      maxSurfaceId: { value: 1 },
    },
    vertexShader: getVertexShader(),
    fragmentShader: getFragmentShader(),
    vertexColors: true,
  });
}

function getVertexShader() {
  return `
  varying vec2 v_uv;
  varying vec4 vColor;
  void main() {
     v_uv = uv;
     vColor = color;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
}

function getFragmentShader() {
  return `
  varying vec2 v_uv;
  varying vec4 vColor;
  uniform float maxSurfaceId;
  void main() {
    float surfaceId = round(vColor.r) / maxSurfaceId;
    gl_FragColor = vec4(surfaceId, 0.0, 0.0, 1.0);
  }
  `;
}

export { FindSurfaces };