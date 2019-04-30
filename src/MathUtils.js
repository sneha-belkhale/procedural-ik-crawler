const THREE = require('three');

const t = new THREE.Vector3();
const q = new THREE.Quaternion();
const p = new THREE.Plane();

export function getAlignmentQuaternion(fromDir, toDir) {
  const adjustAxis = t.crossVectors(fromDir, toDir).normalize();
  const adjustAngle = fromDir.angleTo(toDir);

  if (adjustAngle > 0.01 && adjustAngle < 3.14) {
    const adjustQuat = q.setFromAxisAngle(adjustAxis, adjustAngle);
    return adjustQuat;
  }
  return null;
}

export function addScalarMultiple(toVector, fromVector, scalar) {
  toVector.x += fromVector.x * scalar;
  toVector.y += fromVector.y * scalar;
  toVector.z += fromVector.z * scalar;
  return toVector;
}

export function getAlignmentQuaternionOnPlane(toVector, fromVector, normal) {
  p.normal = normal;
  const projectedVec = p.projectPoint(toVector, new THREE.Vector3()).normalize();
  const quat = getAlignmentQuaternion(fromVector, projectedVec);
  return quat;
}
