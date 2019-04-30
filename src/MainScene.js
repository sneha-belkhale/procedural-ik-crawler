import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import HeroMoverNN from './HeroMover';
import RatRig from './RatRig';
import SparseWorldGrid from './SparseWorldGrid';
import MazeEnvironment from './MazeEnvironment';
import Log from './Logger';
import { ORBIT_CONTROLS, DEBUG } from './Env';
import { DefaultCamera, MainRenderer } from './Utils';

class MainScene {
  init() {
    this.renderer = MainRenderer();

    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color();
    this.mainCam = DefaultCamera();

    if (ORBIT_CONTROLS) {
      const controls = new OrbitControls(
        this.mainCam,
        this.renderer.domElement,
      );

      this.mainCam.position.set(
        183.28854784443533,
        99.17413046911497,
        317.46507731208146,
      );

      controls.update();
    } else {
      this.sideCamera = DefaultCamera();
      this.mainCam.add(this.sideCamera);
      this.scene.add(this.mainCam);
    }

    const worldGrid = new SparseWorldGrid(20);

    const mazeEnv = new MazeEnvironment(this.scene, worldGrid);
    const ratRig = new RatRig(this.scene);

    const loadPromises = [ratRig.load()];

    Promise.all(loadPromises).then(([ratModel]) => {
      Log.debug('Rat is loaded', ratModel);

      this.heroMover = new HeroMoverNN(
        ratModel,
        ratRig.getIks(),
        ratRig.getBonePoints(),
        worldGrid,
        this.mainCam,
        this.scene,
        this.renderer.domElement
      );

      this._render();
    });
  }

  _render() {
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.mainCam);
      if (!ORBIT_CONTROLS) {
        this.heroMover.update();
      }
    });
  }
}

export default MainScene;
