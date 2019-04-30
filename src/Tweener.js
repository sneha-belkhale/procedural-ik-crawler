
const THREE = require('three');

export default class ParabolicFootTweener {
  constructor(mover) {
    this.tweens = [];
    this.tmps = {
      v1: new THREE.Vector3(),
      v2: new THREE.Vector3(),
    };
    this.tweenKeys = {};
    this.mover = mover;
  }

  addTween(key, fromVector, toVector, upVector, totalTime) {
    // do not add tween if there is already a tween for this vector
    if (this.tweenKeys[key]) {
      return false;
    }

    this.tweenKeys[key] = 1;
    const dirVector = toVector.clone().sub(fromVector);
    const origVector = fromVector.clone();

    const startTime = Date.now();
    this.tweens.push({
      fromVector,
      origVector,
      dirVector,
      upVector,
      count: 0,
      totalTime,
      key,
      startTime,
    });
    return true;
  }

  update() {
    this.tweens.forEach((tweener, index, object) => {
      tweener.fromVector.add(tweener.dirVector);
      const msElapsed = Date.now() - tweener.startTime;
      const x = 2 * msElapsed / tweener.totalTime - 1;
      const parabolicIdx = -x * x + 1;
      if (x > 1.2) {
        object.splice(index, 1);
        delete this.tweenKeys[tweener.key];
      }
      this.tmps.v1.copy(tweener.upVector).multiplyScalar(4 * parabolicIdx);
      this.tmps.v2.copy(tweener.dirVector).multiplyScalar(x);
      tweener.fromVector.copy(tweener.origVector).add(this.tmps.v1.add(this.tmps.v2));
    });
  }
}
