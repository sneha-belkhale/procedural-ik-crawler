import * as THREE from 'three';
import { FBXLoader } from './Loaders';
import { setZForward } from './misc/AxisUtils';
import {
  IK,
  IKChain,
  IKJoint,
  IKBallConstraint,
  IKHingeConstraint,
  IKHelper,
} from './modules/THREE.IK/src';
import { DEBUG } from './Env';

class RatRig {
  constructor(scene) {
    this.scene = scene;
    this.ratModel = 'assets/rat/rat-03.fbx';
    this.iks = [];
    this.bonePoints = [];
  }

  load() {
    return FBXLoader()
      .load(this.ratModel)
      .then(this._handleModelLoad)
      .catch((err) => {
        throw err;
      });
  }

  getIks() {
    return this.iks;
  }

  getBonePoints() {
    return this.bonePoints;
  }

  _handleModelLoad = model => new Promise((resolve, reject) => {
    try {
      resolve(this._processModel(model));
    } catch (err) {
      reject(err);
    }
  });

  _processModel = (model) => {
    const { children } = model;

    model.updateMatrixWorld();
    model.position.set(30, 0, -30);
    model.scale.set(1, 1, 1);

    this.scene.add(model);

    const boneGeo = new THREE.BoxGeometry(1, 1, 1);
    const boneMat = new THREE.MeshBasicMaterial({
      color: '0xff00ff',
      wireframe: true,
    });
    if (!DEBUG) {
      boneMat.visible = false;
    }
    const numFeet = 2;

    // back feet
    for (let i = 0; i < numFeet; i += 1) {
      const mesh = new THREE.Mesh(boneGeo, boneMat);
      mesh.position.set(3 * (2 * i - 1), 0, 2);
      this.bonePoints.push(mesh);
      this.scene.add(mesh);
    }

    // front feet
    for (let i = 0; i < numFeet; i += 1) {
      const mesh = new THREE.Mesh(boneGeo, boneMat);
      mesh.position.set(3 * (2 * i - 1), 0, -10);
      this.bonePoints.push(mesh);
      this.scene.add(mesh);
    }

    const headPoint = new THREE.Mesh(boneGeo, boneMat);
    headPoint.position.set(0, 7, -12);
    this.bonePoints.push(headPoint);
    this.scene.add(headPoint);

    const tailPoint = new THREE.Mesh(boneGeo, boneMat);
    tailPoint.position.set(-1, 2, 11);
    this.bonePoints.push(tailPoint);
    this.scene.add(tailPoint);

    const rat = children[0];

    rat.material = new THREE.MeshBasicMaterial({
      skinning: true,
    });

    rat.material.onBeforeCompile = function (shader) {
      shader.vertexShader = 'varying float nn;\n' + shader.vertexShader;
      shader.fragmentShader = 'varying float nn;\n' + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        `      vec4 refractedColor = vec4( 0.0,0.0,0.0, 1.0 );
              vec4 reflectedColor = vec4( 1.0, 50.0/255.0, 50.0/255.0, 1.0 );
              float z = (nn < 0.5)? 0.0: 1.0;
              gl_FragColor = mix( reflectedColor, refractedColor, z );

              `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        vec3 worldNormal = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vec3 I = worldPosition.xyz - cameraPosition;
        vec3 vv    = normalize( normalMatrix * normal );
        vec3 vc  = -(modelViewMatrix * vec4( position, 1.0 )).xyz;
        nn = 0.2 + 1.0 * pow( dot( vv,normalize(vc) ), 2.0 );
        `
      );
    }

    let boneGroup = model.children[1];
    boneGroup.position.set(0, 0, 0);
    boneGroup.rotateY(Math.PI / 2);
    boneGroup.position.set(0, 6.33, 0);
    // boneGroup.updateMatrixWorld()
    setZForward(boneGroup.children[0], this.scene);
    setZForward(boneGroup.children[1], this.scene);
    setZForward(boneGroup.children[2], this.scene);
    setZForward(boneGroup.children[3], this.scene);

    rat.bind(rat.skeleton);

    if (DEBUG) {
      const helper = new THREE.SkeletonHelper(boneGroup);
      helper.material.linewidth = 5;
      this.scene.add(helper);
    }

    for (let j = 0; j < 2; j += 1) {
      this._addIKForBackFeet(
        boneGroup.children[j + 1],
        this.iks,
        4,
        this.bonePoints[j],
      );
    }

    /* eslint-disable-next-line prefer-destructuring */
    boneGroup = children[1].children[3].children[0].children[0];
    for (let j = 0; j < 2; j += 1) {
      this._addIKForBackFeet(
        boneGroup.children[j],
        this.iks,
        4,
        this.bonePoints[j + 2],
      );
    }
    // ad ik for the spine
    /* eslint-disable-next-line prefer-destructuring */
    this.backHip = model.children[1].children[3];
    this._addIKForSpine(this.backHip, this.iks);
    // ad ik for the tail
    /* eslint-disable-next-line prefer-destructuring */
    const tail = model.children[1].children[0];
    this._addIKForGroup(tail, this.iks, 7, this.bonePoints[5]);

    return model;
  };

  _addIKForBackFeet(boneGroup, iks, length, boneTarget) {
    const ik = new IK();
    const chain = new IKChain();
    let currentBone = boneGroup;

    const constraintBall = new IKBallConstraint(180);
    const constraintHinge = new IKHingeConstraint(360);
    for (let i = 0; i < length; i += 1) {
      /* eslint-disable-next-line prefer-destructuring */
      currentBone = currentBone.children[0];
      let constraints;
      if (i === 0) {
        constraints = [constraintBall];
      } else if (i === length - 2) {
        constraints = [new IKHingeConstraint(130)];
      } else {
        constraints = [constraintHinge];
      }
      // The last IKJoint must be added with a `target` as an end effector.
      const target = i === length - 1 ? boneTarget : null;
      chain.add(new IKJoint(currentBone, { constraints }), { target });
    }
    ik.add(chain);
    this.iks.push(ik);

    if (DEBUG) {
      const helper = new IKHelper(ik);
      this.scene.add(helper);
    }
  }

  _addIKForSpine(boneGroup) {
    const ik = new IK();
    const chain = new IKChain();
    let currentBone = boneGroup.children[0];
    for (let i = 0; i < 5; i += 1) {
      if (i === 1) {
        /* eslint-disable-next-line prefer-destructuring */
        currentBone = currentBone.children[2];
      } else {
        /* eslint-disable-next-line prefer-destructuring */
        currentBone = currentBone.children[0];
      }
      const constraints = [new IKBallConstraint(180)];
      // The last IKJoint must be added with a `target` as an end effector.
      const target = i === 4 ? this.bonePoints[4] : null;
      chain.add(new IKJoint(currentBone, { constraints }), { target });
    }
    ik.add(chain);
    this.iks.push(ik);
    if (DEBUG) {
      const helper = new IKHelper(ik);
      this.scene.add(helper);
    }
  }

  _addIKForGroup(boneGroup, iks, length, boneTarget) {
    const ik = new IK();
    const chain = new IKChain();
    let currentBone = boneGroup;
    for (let i = 0; i < length; i += 1) {
      /* eslint-disable-next-line prefer-destructuring */
      currentBone = currentBone.children[0];
      const constraints = [new IKBallConstraint(360, false)];
      // The last IKJoint must be added with a `target` as an end effector.
      const target = i === length - 1 ? boneTarget : null;
      chain.add(new IKJoint(currentBone, { constraints }), { target });
    }
    ik.add(chain);
    this.iks.push(ik);
    if (DEBUG) {
      const helper = new IKHelper(ik);
      this.scene.add(helper);
    }
  }

  update() {
    this.backHip.position.y = 0.5 + 0.5 * Math.sin(Date.now() * 0.001);
  }
}

export default RatRig;
