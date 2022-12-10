import * as THREE from "three";
import { FullScreenQuad, Pass } from "Pass";
import {
  getSurfaceIdMaterial,
  getDebugSurfaceIdMaterial,
} from "FindSurfaces";

// Follows the structure of
// 		https://github.com/mrdoob/three.js/blob/master/examples/jsm/postprocessing/OutlinePass.js
class SurfaceOutlinePass extends Pass {
  constructor(resolution, scene, camera) {
    super();

    this.renderScene = scene;
    this.renderCamera = camera;
    this.resolution = new THREE.Vector2(resolution.x, resolution.y);

    this.fsQuad = new FullScreenQuad(null);
    this.fsQuad.material = this.createOutlinePostProcessMaterial();

    // Create a buffer to store the normals of the scene onto
    // or store the "surface IDs"
    const surfaceBuffer = new THREE.WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y
    );
    surfaceBuffer.texture.format = THREE.RGBAFormat;
    surfaceBuffer.texture.type = THREE.HalfFloatType;
    surfaceBuffer.texture.minFilter = THREE.NearestFilter;
    surfaceBuffer.texture.magFilter = THREE.NearestFilter;
    surfaceBuffer.texture.generateMipmaps = false;
    surfaceBuffer.stencilBuffer = false;

    // This stores the depth buffer containing 
		// only objects that will have outlines
    surfaceBuffer.depthBuffer = true;
		surfaceBuffer.depthTexture = new THREE.DepthTexture();
		surfaceBuffer.depthTexture.type = THREE.UnsignedShortType;

    this.surfaceBuffer = surfaceBuffer;
    // Create a buffer to store the depth of the scene 
		// we don't use the default depth buffer because
		// this one includes only objects that have the outline applied
    const depthTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y );
		depthTarget.texture.format = THREE.RGBFormat;
		depthTarget.texture.minFilter = THREE.NearestFilter;
		depthTarget.texture.magFilter = THREE.NearestFilter;
		depthTarget.texture.generateMipmaps = false;
		depthTarget.stencilBuffer = false;
		depthTarget.depthBuffer = true;
		depthTarget.depthTexture = new THREE.DepthTexture();
		depthTarget.depthTexture.type = THREE.UnsignedShortType;
		this.depthTarget = depthTarget;

    this.normalOverrideMaterial = new THREE.MeshNormalMaterial();

    this.surfaceIdOverrideMaterial = getSurfaceIdMaterial();
    this.surfaceIdDebugOverrideMaterial = getDebugSurfaceIdMaterial();
  }

  dispose() {
    this.surfaceBuffer.dispose();
    this.fsQuad.dispose();
  }

  updateMaxSurfaceId(maxSurfaceId) {
    this.surfaceIdOverrideMaterial.uniforms.maxSurfaceId.value = maxSurfaceId;
  }

  setSize(width, height) {
    this.surfaceBuffer.setSize(width, height);
    this.resolution.set(width, height);

    this.fsQuad.material.uniforms.screenSize.value.set(
      this.resolution.x,
      this.resolution.y,
      1 / this.resolution.x,
      1 / this.resolution.y
    );
  }

  getDebugVisualizeValue() {
    return this.fsQuad.material.uniforms.debugVisualize.value;
  }

  isUsingSurfaceIds() {
    const debugVisualize = this.getDebugVisualizeValue();

    return (
      debugVisualize == 0 || // Main outlines v2 mode
      debugVisualize == 6    // Render just outlines with surfaceId
    ); 
  }

  // Helper functions for hiding/showing objects based on whether they should have outlines applied 
	setOutlineObjectsVisibile(bVisible) {
		this.renderScene.traverse( function( node ) {
		    if (node.applyOutline == true && node.type == 'Mesh') {

		    	if (!bVisible) {
		    		node.oldVisibleValue = node.visible;
		    		node.visible = false;
		    	} else {
		    		// Restore original visible value. This way objects
		    		// that were originally hidden stay hidden
		    		if (node.oldVisibleValue != undefined) {
		    			node.visible = node.oldVisibleValue;
		    			delete node.oldVisibleValue;
		    		}
		    	}


		    }
		});
	}

	setNonOutlineObjectsVisible(bVisible) {
		this.renderScene.traverse( function( node ) {
		    if (node.applyOutline != true && node.type == 'Mesh') {

		    	if (!bVisible) {
		    		node.oldVisibleValue = node.visible;
		    		node.visible = false;
		    	} else {
		    		// Restore original visible value. This way objects
		    		// that were originally hidden stay hidden
		    		if (node.oldVisibleValue != undefined) {
		    			node.visible = node.oldVisibleValue;
		    			delete node.oldVisibleValue;
		    		}
		    	}


		    }
		});
	}

  render(renderer, writeBuffer, readBuffer) {
    // Turn off writing to the depth buffer
    // because we need to read from it in the subsequent passes.
    const depthBufferValue = writeBuffer.depthBuffer;
    writeBuffer.depthBuffer = false;

    // 1. Re-render the scene to capture all normals (or suface IDs) in a texture.
    renderer.setRenderTarget(this.surfaceBuffer);
    const overrideMaterialValue = this.renderScene.overrideMaterial;

    if (this.isUsingSurfaceIds()) {
      // Render the "surface ID buffer"
      if (this.getDebugVisualizeValue() == 5) {
        this.renderScene.overrideMaterial = this.surfaceIdDebugOverrideMaterial;
      } else {
        this.renderScene.overrideMaterial = this.surfaceIdOverrideMaterial;
      }
    } else {
      // Render normal buffer
      this.renderScene.overrideMaterial = this.normalOverrideMaterial;
    }

    // Only include objects that have the "applyOutline" property. 
		// We do this by hiding all other objects temporarily.
		this.setNonOutlineObjectsVisible(false);

    renderer.render(this.renderScene, this.renderCamera);
    this.setNonOutlineObjectsVisible(true);
    this.renderScene.overrideMaterial = overrideMaterialValue;

    
    // 2. Re-render the scene to capture depth of objects that do NOT have outlines
		renderer.setRenderTarget(this.depthTarget);

		this.setOutlineObjectsVisibile(false);
		renderer.render(this.renderScene, this.renderCamera);
		this.setOutlineObjectsVisibile(true);

		this.fsQuad.material.uniforms["depthBuffer"].value = this.surfaceBuffer.depthTexture;

    this.fsQuad.material.uniforms["surfaceBuffer"].value =
      this.surfaceBuffer.texture;
    this.fsQuad.material.uniforms["sceneColorBuffer"].value =
      readBuffer.texture;
    this.fsQuad.material.uniforms["nonOutlinesDepthBuffer"].value = this.depthTarget.depthTexture;

    // 3. Draw the outlines using the depth texture and normal texture
    if (this.renderToScreen) {
      // If this is the last effect, then renderToScreen is true.
      // So we should render to the screen by setting target null
      // Otherwise, just render into the writeBuffer that the next effect will use as its read buffer.
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      this.fsQuad.render(renderer);
    }

    // Reset the depthBuffer value so we continue writing to it in the next render.
    writeBuffer.depthBuffer = depthBufferValue;
  }

  get vertexShader() {
    return `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
			`;
  }
  get fragmentShader() {
    return `
			#include <packing>
			// The above include imports "perspectiveDepthToViewZ"
			// and other GLSL functions from ThreeJS we need for reading depth.
			uniform sampler2D sceneColorBuffer;
			uniform sampler2D depthBuffer;
			uniform sampler2D surfaceBuffer;
      uniform sampler2D nonOutlinesDepthBuffer;
			uniform float cameraNear;
			uniform float cameraFar;
			uniform vec4 screenSize;
			uniform vec3 outlineColor;
			uniform vec4 multiplierParameters;
			uniform int debugVisualize;
			varying vec2 vUv;
			// Helper functions for reading from depth buffer.
			float readDepth (sampler2D depthSampler, vec2 coord) {
				float fragCoordZ = texture2D(depthSampler, coord).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			}
			float getLinearDepth(vec3 pos) {
				return -(viewMatrix * vec4(pos, 1.0)).z;
			}
			float getLinearScreenDepth(sampler2D map) {
					vec2 uv = gl_FragCoord.xy * screenSize.zw;
					return readDepth(map,uv);
			}
			// Helper functions for reading normals and depth of neighboring pixels.
			float getPixelDepth(int x, int y) {
				// screenSize.zw is pixel size 
				// vUv is current position
				return readDepth(depthBuffer, vUv + screenSize.zw * vec2(x, y));
			}
			// "surface value" is either the normal or the "surfaceID"
			vec3 getSurfaceValue(int x, int y) {
				vec3 val = texture2D(surfaceBuffer, vUv + screenSize.zw * vec2(x, y)).rgb;
				return val;
			}
			float saturate(float num) {
				return clamp(num, 0.0, 1.0);
			}
			float getSufaceIdDiff(vec3 surfaceValue) {
				float surfaceIdDiff = 0.0;
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, 0));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, -1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, -1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-1, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-1, -1));
				return surfaceIdDiff;
			}
			void main() {
				vec4 sceneColor = texture2D(sceneColorBuffer, vUv);
				float depth = getPixelDepth(0, 0);
        float nonOutlinesDepth = readDepth(nonOutlinesDepthBuffer, vUv + screenSize.zw);
				// "surfaceValue" is either the normal or the surfaceId
				vec3 surfaceValue = getSurfaceValue(0, 0);
				// Get the difference between depth of neighboring pixels and current.
				float depthDiff = 0.0;
				depthDiff += abs(depth - getPixelDepth(1, 0));
				depthDiff += abs(depth - getPixelDepth(-1, 0));
				depthDiff += abs(depth - getPixelDepth(0, 1));
				depthDiff += abs(depth - getPixelDepth(0, -1));
				// Get the difference between surface values of neighboring pixels
				// and current
				float surfaceValueDiff = getSufaceIdDiff(surfaceValue);
				
				// Apply multiplier & bias to each 
				float depthBias = multiplierParameters.x;
				float depthMultiplier = multiplierParameters.y;
				float normalBias = multiplierParameters.z;
				float normalMultiplier = multiplierParameters.w;
				depthDiff = depthDiff * depthMultiplier;
				depthDiff = saturate(depthDiff);
				depthDiff = pow(depthDiff, depthBias);
				if (debugVisualize != 0 && debugVisualize != 6) {
					// Apply these params when using
					// normals instead of surfaceIds
					surfaceValueDiff = surfaceValueDiff * normalMultiplier;
					surfaceValueDiff = saturate(surfaceValueDiff);
					surfaceValueDiff = pow(surfaceValueDiff, normalBias);
				} else {
					if (surfaceValueDiff != 0.0) surfaceValueDiff = 1.0;
				}
				float outline = saturate(surfaceValueDiff + depthDiff);

        // Don't render outlines if they are behind something
				// in the original depth buffer 
				// we find this out by comparing the depth value of current pixel 
				if ( depth > nonOutlinesDepth && debugVisualize != 4) {
					outline = 0.0;
				}
			
				// Combine outline with scene color.
				vec4 outlineColor = vec4(outlineColor, 1.0);
				gl_FragColor = vec4(mix(sceneColor, outlineColor, outline));
				//// For debug visualization of the different inputs to this shader.

        if (debugVisualize == 1) {
					// Outlines only
					gl_FragColor = vec4(vec3(outline * outlineColor), 1.0);
				}		
				if (debugVisualize == 2) {
					gl_FragColor = sceneColor;
				}			
			}
			`;
  }

  createOutlinePostProcessMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        debugVisualize: { value: 0 },
        sceneColorBuffer: {},
        depthBuffer: {},
        surfaceBuffer: {},
        nonOutlinesDepthBuffer: {},
        outlineColor: { value: new THREE.Color(0xffffff) },
        //4 scalar values packed in one uniform: depth multiplier, depth bias, and same for normals.
        multiplierParameters: {
          value: new THREE.Vector4(0.9, 20, 1, 1),
        },
        cameraNear: { value: this.renderCamera.near },
        cameraFar: { value: this.renderCamera.far },
        screenSize: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
          ),
        },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
  }
}

export { SurfaceOutlinePass };