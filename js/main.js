import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import PixelatePass from 'PixelatePass';
import { SurfaceOutlinePass } from 'SurfaceOutlinePass';
import { FindSurfaces } from 'FindSurfaces';
import {Cube} from './scenes/cube.js';
import {Stacking} from './scenes/stacking.js';
import { Spinning } from './scenes/spinning.js';
import {Checkers} from './scenes/checkers.js';
import {OrbitControls} from 'OrbitControls';
import {GUI} from 'GUI';

//UNCOMMENT FOR CUBE
 //const cubeScene = new Cube();
 //const scene = cubeScene.getScene();
 //const camera = cubeScene.getCamera();

// UNCOMMENT FOR STACKING
// const stackingScene = new Stacking();
// const scene = stackingScene.getScene();
// const camera = stackingScene.getCamera();

// UNCOMMENT FOR SPINNING
//const spinningScene = new Spinning();
//const scene = spinningScene.getScene();
//const camera = spinningScene.getCamera();

// UNCOMMENT FOR CHECKERS
const checkersScene = new Checkers();
const scene = checkersScene.getScene();
const camera = checkersScene.getCamera();


let screenResolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
let renderResolution = screenResolution.clone().divideScalar( 1 );
renderResolution.x |= 0;
renderResolution.y |= 0;

// Renderer and attaching

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera movement

const controls = new OrbitControls( camera, renderer.domElement );

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
	scene.traverse(node => node.applyOutline = false);

	addSurfaceIdAttributeToMesh(scene);

// Raycaster for mouse selection

var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	function onMouseClick() {
		raycaster.setFromCamera( mouse, camera );
		const intersected = raycaster.intersectObjects( scene.children );
		
		for ( let i = 0; i < intersected.length; i ++ ) {
			console.log(intersected[i].object);
			intersected[i].object.applyOutline = !(intersected[i].object.applyOutline);
		}
	}
	function onMouseMove( event ) {
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}
	window.addEventListener( 'click', onMouseClick, false );
	window.addEventListener( 'mousemove', onMouseMove, false );


// GUI with options for pixelation degree and outline mode

var options = {
	degree: 1
};

var gui = new GUI();


gui.add(options, 'degree', 1, 25).onChange( function() {
	composer.removePass(composer.passes[2]);
	renderResolution = screenResolution.clone().divideScalar( options.degree );
	composer.addPass(new PixelatePass( renderResolution ));
});

const uniforms = surfaceOutline.fsQuad.material.uniforms;

const params = {
	mode: { Mode: 0 },
};

gui.add(params.mode, "Mode", {
	"Enable outlines": 0,
	"See only outlines": 1,
    "Original scene": 2,
})
.onChange(function (value) {
	if (value == 1) {
		scene.traverse(node => node.applyOutline = true);
	}
    uniforms.debugVisualize.value = value;
});

function animate() {
	//UNCOMMENT FOR CUBE
	//cubeScene.animate(composer, options);
	//UNCOMMENT FOR STACKING
	//setInterval(() => stackingScene.gameAnimation(composer, renderer), 1000);  
	//UNCOMMENT FOR SPINNING
	//spinningScene.animate(composer, options)
	//UNCOMMENT FOR Checkers
	checkersScene.animate(composer, options);
}
animate();
