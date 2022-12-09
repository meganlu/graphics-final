import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import PixelatePass from 'pixelate';
import { SurfaceOutlinePass } from 'SurfaceOutlinePass';
import { FindSurfaces } from 'FindSurfaces';


import {GUI} from 'GUI';
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	let screenResolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
    let renderResolution = screenResolution.clone().divideScalar( 1 );
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

	const cubeGeometry = new THREE.BoxGeometry(1,1,1);
	//const tetGeometry = new THREE.TetrahedronGeometry(2);

	const material = new THREE.MeshNormalMaterial();

	const cube = new THREE.Mesh(cubeGeometry, material);
	//const tetrahedron = new THREE.Mesh(tetGeometry, material);
			
	scene.add(cube);
	//scene.add(tetrahedron);

	cube.position.set(5,0,0);
	//tetrahedron.position.set(-3,0,0);

	camera.position.z = 10;
	camera.position.y = 0;

	// EffectComposer postprocessing

		const depthTexture = new THREE.DepthTexture();
		const renderTarget = new THREE.WebGLRenderTarget(
			window.innerWidth,
			window.innerHeight,
				{
					depthTexture: depthTexture,
					depthBuffer: true,
				}
		);

	const composer = new EffectComposer( renderer, renderTarget );
	const renderPass = new RenderPass( scene, camera );
	composer.addPass( renderPass );

	const surfaceOutline = new SurfaceOutlinePass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		scene,
		camera
	);
	composer.addPass(surfaceOutline);

	composer.addPass( new PixelatePass( renderResolution ) );


	

	const surfaceFinder = new FindSurfaces();	

	function addSurfaceIdAttributeToMesh(scene) {
  		surfaceFinder.surfaceId = 0;

		scene.traverse((node) => {
			if (node.type == "Mesh") {
			const colorsTypedArray = surfaceFinder.getSurfaceIdAttribute(node);
			node.geometry.setAttribute(
				"color",
				new THREE.BufferAttribute(colorsTypedArray, 4)
			);
			}
		});

  		surfaceOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);
	}

	addSurfaceIdAttributeToMesh(scene);

	// RAY TRACING WITH MOUSE

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	function onMouseClick( event ) {
		raycaster.setFromCamera( mouse, camera );
		const isIntersected = raycaster.intersectObject( cube );
		console.log(isIntersected);
		if (isIntersected.length > 0) {
			console.log('Cube clicked!')
		}
	}
	function onMouseMove( event ) {
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}
	window.addEventListener( 'click', onMouseClick, false );
	window.addEventListener( 'mousemove', onMouseMove, false );


	var options = {
		degree: 1,
		velx: 0.02,
		vely: 0.02,
		stop: function() {
			this.velx = 0;
			this.vely = 0;
		},
		reset: function() {
			this.velx = 0.02;
			this.vely = 0.02;
			camera.position.z = 10;
		}

	};

	var gui = new GUI();

	gui.add(options, 'stop');
	gui.add(options, 'reset');

	gui.add(options, 'degree', 1, 25).onChange( function() {
		composer.removePass(composer.passes[2]);
		renderResolution = screenResolution.clone().divideScalar( options.degree );
		composer.addPass(new PixelatePass( renderResolution ));
	});
	
	var velocity = gui.addFolder('Velocity');
	velocity.add(options, 'velx', -0.5, 0.5).name('X').listen();
	velocity.add(options, 'vely', -0.5, 0.5).name('Y').listen();
	velocity.open();

	const uniforms = surfaceOutline.fsQuad.material.uniforms;

	const params = {
		mode: { Mode: 0 },
	};

	gui.add(params.mode, "Mode", {
    "Outlines V2": 0,
    "Original scene": 2,
    "SurfaceID debug buffer": 5,
    "Outlines only V2": 6,
  })
  .onChange(function (value) {
    uniforms.debugVisualize.value = value;
  });

function animate() {
	requestAnimationFrame(animate);

	cube.rotation.x += options.velx;
	cube.rotation.y += options.vely;

	composer.render(scene, camera);
};

animate();