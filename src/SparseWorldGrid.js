import * as THREE from 'three';
import { DEBUG } from './Env';


class Line {
  constructor(start, dir, length) {
    this.start = start;
    this.dir = dir.normalize();
    this.length = length;
  }

  intersect(line) {
    const nom = line.dir.dot(this.dir);
    const s = (this.start.clone()
      .sub(line.start)
      .dot(line.dir) + line.start.clone()
      .sub(this.start)
      .dot(this.dir) * nom) / (1 - nom * nom);
    const point = line.start.clone().add(line.dir.clone().multiplyScalar(s));

    return point;
  }
}

export default class SparseWorldGrid {
  constructor(cellSize) {
    this.grid = {};
    this.cellSize = cellSize;
    this.helperBbox = new THREE.Box3();
  }

  getHash(posX, posY, posZ) {
    return `${Math.round(posX / this.cellSize)}:${
      Math.round(posY / this.cellSize)}:${
      Math.round(posZ / this.cellSize)}`;
  }

  /* eslint-disable-next-line class-methods-use-this */
  getHashRaw(posX, posY, posZ) {
    return `${(posX)}:${
      (posY)}:${
      (posZ)}`;
  }

  valueAtWorldPos(posX, posY, posZ) {
    const idx = this.getHash(posX, posY, posZ);
    return this.grid[idx];
  }

  setValueAtWorldPos(posX, posY, posZ, mesh) {
    const idx = this.getHash(posX, posY, posZ);
    this.addForIdx(idx, mesh);
  }

  queryPointsInRadius(posX, posY, posZ, r) {
    const meshes = {};
    const meshesArray = [];
    for (let i = -r; i < r + 1; i += 1) {
      for (let j = -r; j < r + 1; j += 1) {
        for (let k = -r; k < r + 1; k += 1) {
          const value = this.valueAtWorldPos(
            posX + (i * this.cellSize),
            posY + (j * this.cellSize),
            posZ + (k * this.cellSize),
          );
          if (value) {
            Object.keys(value).forEach((key) => {
              const mesh = value[key];
              if (!meshes[mesh.id]) {
                meshesArray.push(mesh);
                meshes[mesh.id] = mesh;
              }
            });
          }
        }
      }
    }
    return meshesArray;
  }

  addForIdx(idx, mesh) {
    if (!this.grid[idx]) {
      this.grid[idx] = {};
    }
    this.grid[idx][mesh.id] = mesh;
  }

  // call this after setting world matrix.
  fillGridForBufferMesh(mesh, scene) {
    let starsGeometry = null;
    if (DEBUG) {
      starsGeometry = new THREE.Geometry();
    }
    const pos = mesh.geometry.attributes.position.array;
    const index = mesh.geometry.index.array;
    for (let i = 0; i < mesh.geometry.index.count; i += 3) {
      const vertexA = new THREE.Vector3(
        pos[3 * index[i]], pos[3 * index[i] + 1], pos[3 * index[i] + 2],
      )
        .applyMatrix4(mesh.matrixWorld);
      const vertexB = new THREE.Vector3(
        pos[3 * index[i + 1]], pos[3 * index[i + 1] + 1], pos[3 * index[i + 1] + 2],
      )
        .applyMatrix4(mesh.matrixWorld);
      const vertexC = new THREE.Vector3(
        pos[3 * index[i + 2]], pos[3 * index[i + 2] + 1], pos[3 * index[i + 2] + 2],
      )
        .applyMatrix4(mesh.matrixWorld);
      // fill all from A - B
      const lineAB = vertexB.clone().sub(vertexA);
      const lineCA = vertexA.clone().sub(vertexC);
      const lineBC = vertexC.clone().sub(vertexB);

      const lengthAB = lineAB.length();
      const lengthCA = lineCA.length();
      const lengthBC = lineBC.length();

      let baseLine; let sideLine1; let
        sideLine2;

      if (lengthAB > lengthCA && lengthAB > lengthBC) {
        baseLine = new Line(vertexA, lineAB, lengthAB);
        sideLine1 = new Line(vertexA, lineCA.multiplyScalar(-1), lengthCA);
        sideLine2 = new Line(vertexC, lineBC, lengthBC);
      } else if (lengthCA > lengthAB && lengthCA > lengthBC) {
        baseLine = new Line(vertexC, lineCA, lengthCA);
        sideLine1 = new Line(vertexC, lineBC.multiplyScalar(-1), lengthBC);
        sideLine2 = new Line(vertexB, lineAB, lengthAB);
      } else {
        baseLine = new Line(vertexB, lineBC, lengthBC);
        sideLine1 = new Line(vertexB, lineAB.multiplyScalar(-1), lengthAB);
        sideLine2 = new Line(vertexA, lineCA, lengthCA);
      }

      for (let j = 0; j < sideLine1.length; j += this.cellSize) {
        const nextPoint = sideLine1.start.clone().add(sideLine1.dir.normalize().clone()
          .multiplyScalar(j));
        const scanLine = new Line(nextPoint, baseLine.dir);
        const intersectionPoint = scanLine.intersect(sideLine2);

        // lenght is this intersection point - start point
        const length = nextPoint.clone().sub(intersectionPoint)
          .length();
        const stride = baseLine.dir.clone().multiplyScalar(this.cellSize);
        for (let k = 0; k < length; k += this.cellSize) {
          this.setValueAtWorldPos(nextPoint.x, nextPoint.y, nextPoint.z, mesh);
          if (DEBUG) {
            starsGeometry.vertices.push(nextPoint.clone());
          }
          nextPoint.add(stride);
        }
      }
    }
    if (DEBUG) {
      const starsMaterial = new THREE.PointsMaterial({ color: 0x888888 });
      const starField = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(starField);
    }
  }

  fillGridForMesh(mesh) {
    const bbox = this.helperBbox.setFromObject(mesh);
    const minX = Math.floor((bbox.min.x) / this.cellSize);
    const maxX = Math.ceil((bbox.max.x) / this.cellSize);
    const minZ = Math.floor((bbox.min.z) / this.cellSize);
    const maxZ = Math.ceil((bbox.max.z) / this.cellSize);
    const minY = Math.floor((bbox.min.y) / this.cellSize);
    const maxY = Math.ceil((bbox.max.y) / this.cellSize);
    // top bottom
    for (let i = minX; i <= maxX; i += 1) {
      for (let j = minZ; j <= maxZ; j += 1) {
        const idx = this.getHashRaw(i, minY, j);
        this.addForIdx(idx, mesh);
        const idx2 = this.getHashRaw(i, maxY, j);
        this.addForIdx(idx2, mesh);
      }
    }
    // left right
    for (let i = minX; i <= maxX; i += 1) {
      for (let j = minY; j <= maxY; j += 1) {
        const idx = this.getHashRaw(i, j, minZ);
        this.addForIdx(idx, mesh);
        const idx2 = this.getHashRaw(i, j, maxZ);
        this.addForIdx(idx2, mesh);
      }
    }
    // forward backward
    for (let i = minY; i <= maxY; i += 1) {
      for (let j = minZ; j <= maxZ; j += 1) {
        const idx = this.getHashRaw(minX, i, j);
        this.addForIdx(idx, mesh);
        const idx2 = this.getHashRaw(maxX, i, j);
        this.addForIdx(idx2, mesh);
      }
    }
  }
}
