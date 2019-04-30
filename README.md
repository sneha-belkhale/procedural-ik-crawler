# *~*~*~<>~ cyborg rat in the city ~<>~*~*~* 

### inspired by the futuristic cyberpunk HK & made with three.js


### Getting started

```
git clone --recurse-submodules https://github.com/Kif11/hong-kong-rat
cd hong-kong-rat
yarn install
# To pull assets
yarn pull
```

Useful submodules commands:

```
# If you forgot to clone with recursive submodules, run
git submodule update --init --recursive

# To update submodules use at any point
git submodule foreach git pull
```

To get started look at `src/index.js`. And go deeper from there.

### Debugging

```
# To show extra logs and helpers
export DEBUG=true
```

#### While making this demo, we made some reusable utilities related to new advances in 3D Web Graphics.  
 #### [ + ] Box Projected Env Maps for realistic reflections
 #### [ + ] Procedural Animation with Inverse Kinematics 
 #### [ + ] Collision (yes I know it's been implemented 100 times.. but for some reason I could not find a usable example)
 #### [ + ] Collision camera for unobstructed views of the cyborg rat
 #### [ + ] Importing scenes from HoudiniFX into three.js



### Two Phase Collision Optimization
For this game, we find the next foot position of the rat by raycasting onto the nearby surfaces. We may need to do raycasts in a range of angles for complicated surface scenarios. So, since we forecast to have 200+ meshes in the scene, this could amount to around 800 raycast calculations per step! Even though the three.js raycaster has optimizations where it first checks for ray intersection with the bounding box of the mesh, this is still order (n) operation which is not optimal.

we decided to go with a two phase approach, first creating a sparse grid to segment the space, which we will use to query objects in a radius. We looked into octrees for this, but there wasn't a sufficient example for javascript, so ended up starting with a basic linear grid. This step should bring a subset of the objects in the scene, which you can then use the standard three.js raycaster to get the exact point of intersection. 

Here is an example of how to use it: 

#### 1. initialize sparse grid with a cell size that makes sense for your scene. 

`var worldGrid = new SparseWorldGrid(20);`

#### 2. add mesh to the sparse grid. This will fill the appropriate cells (w.r.t the mesh bbox) with a pointer to the mesh. Multiple meshes may occupy the same grid, and that is expected with larger cell sizes.

`worldGrid.fillGridForMesh(collisionMesh);`

#### 3. before raycasting, query meshes in a cell radius from the position. My cell size was 20 units, which was way 2 times the size of the character, so a radius of 1 (20 units) was more than enough. 

`var meshes = this.worldGrid.queryPointsInRadius(basePos.x, basePos.y, basePos.z, 1)`

#### 4. raycast the subset!
`var n = this.raycaster.intersectObjects(meshes);`


### Collision Camera
At first, we implemented a camera that just stays at a fixed distance from the rat, rotating smoothly as the rat climbs up surfaces. However, the rat was constantly obstructed by objects in the scene, so the next step was to make the camera collide with objects in the scene. 

To do this, we shoot a ray from the camera to the rat, and if this ray intersects with another object in the scene before it intersects the rat, there is an obstruction, and we move the camera to the point of intersection with the world object. If there is no obstruction, we move the camera slowly back to it's original position. 

Here is an example of how to use it:

#### 1. initialize camera collider, giving the camera ( which in our case was parented to another object following the hero ), the hero, zoom in speed, and zoom out step. The last two parameters need to be played with for optimal results, zoom out step ideally should be less than the speed of hero forward movement. 
`this.cameraCollider = new CameraCollider(this.camera, this.hero, 200, 0.05)`

#### 2. on update, we call the function below, which utilizes the sparse world grid to query meshes around the camera. If you don't have many objects in your scene, you could get away without the optimization and use all meshes in the scene. We then feed in the meshes to the camera collider, which updates the camera position~

``` 
cameraCollideCheck = () => {
    var camPos = this.camera.getWorldPosition(new THREE.Vector3());
    const meshes = this.worldGrid.queryPointsInRadius(camPos.x, camPos.y, camPos.z, 3);
    this.cameraCollider.update(meshes)
}
```






