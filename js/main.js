import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import { GlitchPass } from 'GlitchPass';
import { UnrealBloomPass } from 'UnrealBloomPass';
import PixelatePass from 'pixelate';

import {GUI} from 'GUI';
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	let screenResolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
    let renderResolution = screenResolution.clone().divideScalar( 6 );
    renderResolution.x |= 0;
    renderResolution.y |= 0;

	// Lights
 
	var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5);
	scene.add( ambientLight );

	var pointLight = new THREE.PointLight( 0xffffff, 1 );
	pointLight.position.set( 25, 50, 25 );
	scene.add( pointLight );

	// Renderer and attaching

	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Shape

	const geometry = new THREE.BoxGeometry(0.2,0.2,0.2);
	const material = new THREE.MeshStandardMaterial({ color: 0x0808080 });

	const cube = new THREE.Mesh(geometry, material);
			
	scene.add(cube);

	camera.position.z = 1;
	camera.position.y = 0;

	// EffectComposer postprocessing

	const composer = new EffectComposer( renderer );
	const renderPass = new RenderPass( scene, camera );
	composer.addPass( renderPass );

	composer.addPass( new PixelatePass( renderResolution ) );


	var options = {
		velx: 0.03,
		vely: 0.03,
		camera: {
			speed: 0.0001
		},
		stop: function() {
			this.velx = 0;
			this.vely = 0;
		},
		reset: function() {
			this.velx = 0.03;
			this.vely = 0.03;
			camera.position.z = 1;
			cube.material.wireframe = true;
		}
	};

	var gui = new GUI();

	gui.add(options, 'stop');
	gui.add(options, 'reset');


function animate() {
	requestAnimationFrame(animate);

	cube.rotation.x += options.velx;
	cube.rotation.y += options.vely;
	composer.render(scene, camera);
};

animate();