import * as THREE from 'three';
import Stats from 'Stats';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

export default class Cube {

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
        // Lights
        var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5);
        this.scene.add( ambientLight );

        var pointLight = new THREE.PointLight( 0xffffff, 1 );
        pointLight.position.set( 25, 50, 25 );
        this.scene.add( pointLight );

        // Shape
        const cubeGeometry = new THREE.BoxGeometry(1,1,1);
        const torusGeometry = new THREE.TorusGeometry();

        const material = new THREE.MeshNormalMaterial();

        this.cube = new THREE.Mesh(cubeGeometry, material);
        this.torus = new THREE.Mesh(torusGeometry, material);
                
        this.scene.add(this.cube);
        this.scene.add(this.torus);

        this.cube.position.set(3,0,0);
        this.torus.position.set(-2,0,0);

        this.camera.position.z = 5;
        this.camera.position.y = 0;
    }

    getScene() {
        return this.scene;
    }
    getCamera() {
        return this.camera;
    }
    getMesh() {
        return this.cube;
    }
    animate(composer, options) {
        requestAnimationFrame(() => this.animate(composer, options));
        stats.begin();
        this.cube.rotation.x += 0.03;
        this.cube.rotation.y += 0.03;
        this.torus.rotation.x += 0.03;
        this.torus.rotation.y += 0.03;
        composer.render(this.scene, this.camera);
        stats.end();
    };
}

export { Cube };