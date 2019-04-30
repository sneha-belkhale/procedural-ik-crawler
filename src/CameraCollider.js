const THREE = require('three');
const TWEEN = require('tween');

const t1 = new THREE.Vector3();
const t2 = new THREE.Vector3();
const t3 = new THREE.Vector3();
const t4 = new THREE.Vector3();

const q = new THREE.Quaternion();
const FORWARD = new THREE.Vector3(0, 0, 1);

export default class CameraCollider {
  constructor(camera, subject, zoomInTime, zoomOutStep) {
    this.camera = camera;
    this.hero = subject;
    this.zoomInTime = zoomInTime;
    this.zoomOutStep = zoomOutStep;

    // helpers
    this.initialPos = new THREE.Vector3().copy(camera.position);
    this.lastHeroPos = new THREE.Vector3().copy(this.hero.position);
    this.raycaster = new THREE.Raycaster();
    this.sphere = new THREE.Sphere();
  }

  raycastHero() {
    if (!this.hero.children[0].geometry.boundingSphere) {
      this.hero.children[0].geometry.computeBoundingSphere();
    }
    this.sphere.copy(this.hero.children[0].geometry.boundingSphere);
    this.sphere.applyMatrix4(this.hero.children[0].matrixWorld);
    return this.raycaster.ray.intersectSphere(this.sphere, t2);
  }

  update(worldMeshes) {
    const camPos = this.camera.getWorldPosition(t1);
    const camQuat = this.camera.getWorldQuaternion(q);
    const heroPos = this.hero.getWorldPosition(t2);

    // return if the hero has not moved -- this is to avoid back and forth calculation
    if (this.lastHeroPos.distanceTo(heroPos) < 0.001) {
      this.lastHeroPos.copy(heroPos);
      return;
    }
    this.lastHeroPos.copy(heroPos);
    // get direction from camera to hero
    t3.copy(FORWARD).applyQuaternion(camQuat);
    heroPos.sub(camPos).normalize();

    this.raycaster.set(camPos, heroPos);

    // raycast onto hero's bounding sphere
    const heroIntersection = this.raycastHero();

    worldMeshes.forEach((mesh) => {
      mesh.material.side = THREE.DoubleSide;
    });

    // raycast colliding meshes
    const worldIntersections = this.raycaster.intersectObjects(worldMeshes);

    let cameraAdjusted = false;
    if (worldIntersections[0] && heroIntersection) {
      const worldObjDistance = camPos.distanceTo(worldIntersections[0].point);
      const heroDistance = camPos.distanceTo(heroIntersection);

      const local = this.camera.parent.worldToLocal(worldIntersections[0].point);
      // if the intersection point to the world object is before the
      // intersection point to the hero, it is obstructing the view.
      if (worldObjDistance < heroDistance && local.z > 0) {
        cameraAdjusted = true;
        // move the camera to the obstructing object intersection
        new TWEEN.Tween(this.camera.position)
          .to(local, this.zoomInTime).start();
      }
    }
    // if the camera was not adjusted in the above step,
    // move the camera backwards until it's initial position.
    // ideally the zoomOutStep parameter should be slower than the
    // hero movement diff.
    if (!cameraAdjusted) {
      const t = t4.copy(this.initialPos).sub(this.camera.position).multiplyScalar(this.zoomOutStep);
      this.camera.position.x += t.x;
      this.camera.position.y += t.y;
      this.camera.position.z += t.z;
    }
    worldMeshes.forEach((mesh) => {
      mesh.material.side = THREE.FrontSide;
    });
  }
}
