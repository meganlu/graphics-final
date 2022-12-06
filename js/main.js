import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
 
	var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5);
	scene.add( ambientLight );

	var pointLight = new THREE.PointLight( 0xffffff, 1 );
	pointLight.position.set( 25, 50, 25 );
	scene.add( pointLight );


	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	


	const geometry = new THREE.BoxGeometry(0.2,0.2,0.2);
	const material = new THREE.MeshStandardMaterial({ color: 0x0808080 });

	const cube = new THREE.Mesh(geometry, material);
			
	scene.add(cube);

	camera.position.z = 1;
	camera.position.y = 0;

	const composer = new EffectComposer( renderer );
	const renderPass = new RenderPass( scene, camera );
	composer.addPass( renderPass );


function animate() {
	requestAnimationFrame(animate);

	cube.rotation.x += 0.03;
	cube.rotation.y += 0.03;
	composer.render(scene, camera);
};

animate();