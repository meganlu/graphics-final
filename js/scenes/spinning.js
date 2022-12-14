import * as THREE from 'three';
import Stats from 'Stats';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

export default class Spinning {

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
         // Lights

        var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5);
        this.scene.add( ambientLight );

        var pointLight = new THREE.PointLight( 0xffffff, 1 );
        pointLight.position.set( 25, 50, 25 );
        this.scene.add( pointLight );
        var pointLight1 = new THREE.PointLight( 0xffffff, 1 );
        pointLight1.position.set( -25, -10, 20 );
        this.scene.add( pointLight1 );

        // Shape
        const ring1Geometry = new THREE.TorusGeometry( 7, 0.3, 16, 100);
        const material = new THREE.MeshStandardMaterial( { color: 0xA4883A, metalness: 0.8, roughness: 0.4 } );
        this.ring1 = new THREE.Mesh(ring1Geometry, material);  
        this.scene.add(this.ring1); 
        this.ring1.position.set(0,0,0);

        const ring2Geometry = new THREE.TorusGeometry( 6, 0.3, 16, 100);
        this.ring2 = new THREE.Mesh(ring2Geometry, material);  
        this.scene.add(this.ring2); 
        this.ring2.position.set(0,0,0);

        const ring3Geometry = new THREE.TorusGeometry( 5, 0.3, 16, 100);
        this.ring3 = new THREE.Mesh(ring3Geometry, material);  
        this.scene.add(this.ring3); 
        this.ring3.position.set(0,0,0);
    
        const geometry = new THREE.TorusKnotGeometry( 1.5, 0.5, 100, 64 );
        this.torusKnot = new THREE.Mesh( geometry, material );
        this.scene.add( this.torusKnot );

        this.camera.position.z = 15;
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
        this.ring1.rotation.y += 0.015;
        this.ring2.rotation.x += 0.015;
        this.ring3.rotation.y -= 0.015;
        this.torusKnot.rotation.x += 0.01;
        this.torusKnot.rotation.y += 0.01;
        
        composer.render(this.scene, this.camera);
        stats.end();
    };
}

export { Spinning };