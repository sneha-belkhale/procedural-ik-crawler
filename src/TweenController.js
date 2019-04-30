const THREE = require('three');

export default class TweenController {
  constructor(tweenBase, scene) {
    this.tweenBase = tweenBase;
    this.tweenTarget = new THREE.Object3D();
    scene.add(this.tweenTarget);
    this.tweenTarget.quaternion.copy(this.tweenBase.quaternion);
  }

  setTargetQuaternion(targetQuat) {
    this.tweenTarget.quaternion.copy(targetQuat);
  }

  applyToTargetQuaternion(quat) {
    this.tweenTarget.quaternion.premultiply(quat);
  }

  rotateY(deg) {
    this.tweenTarget.rotateY(deg);
  }

  update() {
    this.tweenBase.quaternion.slerp(this.tweenTarget.quaternion, 0.1);
  }

  getTargetQuat() {
    return this.tweenTarget.quaternion;
  }
}
