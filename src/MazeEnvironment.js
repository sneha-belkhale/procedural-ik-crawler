import * as THREE from 'three';
var maze = require('amazejs');


export default class AlleyEnvironment {
  constructor(scene, worldGrid) {
    this.scene = scene;
    this.worldGrid = worldGrid;
    this.modelPath = 'assets/scene/scene.gltf';

    this.loadSyncScene();
  }

  loadSyncScene() {

    this.thickness = 35;
    var groundg = new THREE.BoxBufferGeometry(13*this.thickness,13*this.thickness,13*this.thickness);
    var groundm = new THREE.Mesh(groundg, new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9
    }))
    groundm.position.x = -this.thickness/2
    groundm.position.z = -this.thickness/2
    groundm.position.y = -14*this.thickness/2
    groundm.rotateX(-Math.PI/2)
    groundm.updateMatrixWorld()
    this.scene.add(groundm)
    this.worldGrid.fillGridForBufferMesh(groundm, this.scene);
    var m = new maze.Backtracker(15, 15);
    m.generate();

    console.log(m);
    this.fillCubesForMazeTest(m, false, this.zSideFunction)
    this.fillCubesForMazeTest(m, true, this.zSideFunction)
    this.fillCubesForMazeTest(m, false, this.xSideFunction)
    this.fillCubesForMazeTest(m, true, this.xSideFunction)
    this.fillCubesForMazeTest(m, true, this.topSideFunction)
    this.fillCubesForMazeTest(m, false, this.topSideFunction)

  }

  fillCubesForMazeTest(maze, left, sidefx){
    var t = 1;
    var offset = 0;
    if(left){
      t= -1;
      offset = 2;
    }
    var thickness = this.thickness;
    var boxGeo = new THREE.BoxGeometry(thickness,thickness,thickness);
    var boxMat = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('./assets/glowTex.png', (tex) => {
        tex.minFilter = THREE.NearestFilter;
      }),
    });

    for (var y = 0; y< maze.height; y++){
      for (var x =0; x < maze.width; x++){
        if(maze.grid[y*maze.width +x]==1){
          //add cube here
          var mesh = new THREE.Mesh(boxGeo, boxMat);
          sidefx(x,y,mesh,thickness,offset,t,maze.width,maze.height);
          this.scene.add(mesh)
          this.worldGrid.fillGridForMesh(mesh, this.scene);
        }
      }
    }
  }

  xSideFunction(x,y,mesh,thickness,offset,t,width,height) {
    mesh.position.set(t*(thickness)*(width-2+offset)/2,thickness*x-(width-1)*thickness,thickness*y-thickness*width/2);
  }

  zSideFunction(x,y,mesh,thickness,offset,t,width,height) {
    mesh.position.set(thickness*x-(width)*thickness/2,thickness*y-(width-1)*thickness, t*(thickness)*(width-2+offset)/2)
  }

  topSideFunction(x,y,mesh,thickness,offset,t,width,height) {
    mesh.position.set(thickness*x - thickness*width/2,0 + (t-1)*thickness*(width-1)/2,thickness*y-thickness*height/2)
  }

  load() {
  }
  update() {

  }
}
