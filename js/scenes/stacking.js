import * as THREE from 'three';

export default class Stacking {
    scene;
    camera;
    renderer;
    originalBoxSize = 3;
    stack = []
    boxHeight = 2;
    gameStarted = false;
    originalColor;
 
    constructor() {
        this.scene = new THREE.Scene();
        this.originalBoxSize = 2;
        this.stack = []
        this.boxHeight = 3;
        this.gameStarted = false;
        this.originalColor = Math.random() * 360;

        this.addLayer(0, 0, this.originalBoxSize, this.originalBoxSize);
        this.addLayer(-10, 0, this.originalBoxSize * Math.random() * 1.5 + 0.5, 
          this.originalBoxSize * Math.random() * 1.5 + 0.5, "x");
      
        //add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
      
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 20, 0)
        this.scene.add(directionalLight);

        //add camera
        const width = 10;
        const height = width * (window.innerWidth/window.innerHeight);
        this.camera = new THREE.OrthographicCamera(
             width/-2, width/2, height/2, height/-2, 1, 100);
        this.camera.position.set(4, 4, 4);
        this.camera.lookAt(0, 0, 0)
    }
      
    addLayer(x, z, width, depth, direction) {
        const y = this.boxHeight * this.stack.length;
        const layer = this.generateBox(x, y, z, width, depth);
        layer.direction = direction;
        this.stack.push(layer);
    }
      
    generateBox(x, y, z, width, depth) {
        const geometry = new THREE.BoxGeometry(width, this.boxHeight, depth);
        const color = new THREE.Color(`hsl(${this.originalColor + this.stack.length * 10}, 100%, 50%)`);
        const material = new THREE.MeshLambertMaterial({ color });
      
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
      
        this.scene.add(mesh);
      
        return {
          threejs: mesh,
          width,
          depth,
        };
      }
      
    gameAnimation(composer, renderer) {
        if (!this.gameStarted) {
          renderer.setAnimationLoop(() => this.animation(composer));
          this.gameStarted = true;
        } else {
          const topLayer = this.stack[this.stack.length - 1];
          const direction = topLayer.direction;
      
          const nextX = direction == "x" ? 0 : -10;
          const nextZ = direction == "z" ? 0 : -10;
          const newWidth = this.originalBoxSize * Math.random() * 1.5 + 0.5;
          const newDepth = this.originalBoxSize  * Math.random() * 1.5 + 0.5;
          const nextDirection = direction == "x" ? "z" : "x";
      
          this.addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
        }
      }
 
    animation(composer) {
        const speed = 0.15;
        const topLayer = this.stack[this.stack.length - 1]; 
        topLayer.threejs.position[topLayer.direction] += speed;
        
        if (this.camera.position.y < this.boxHeight * (this.stack.length - 2) + 4) {
          this.camera.position.y += speed;
        }
        composer.render(this.scene, this.camera);
    }

    getScene() {
        return this.scene;
    }
    getCamera() {
        return this.camera;
    }
}

export {Stacking};