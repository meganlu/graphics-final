import * as THREE from 'three'

export default class Checkers {
    scene = null;
    camera = null;
    raycaster = null;
    draggable;
    clickMouse;
    moveMouse;
    constructor() {
        // CAMERA
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
        this.camera.position.set(-50, 90, 160);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // SCENE
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0xE9E9E9);

        // ambient light
        let hemiLight = new THREE.AmbientLight(0xffffff, 0.20);
        this.scene.add(hemiLight);

        var pointLight1 = new THREE.PointLight( 0xF9F0FF, 1 );
        pointLight1.position.set( -70, 70, -70 );
        this.scene.add( pointLight1 ); 

        var pointLight2 = new THREE.PointLight( 0x13FFDC, 1 );
        pointLight2.position.set( 20, -10, 60 );
        this.scene.add( pointLight2 ); 
        
        var pointLight3 = new THREE.PointLight( 0xD45DB2, 1 );
        pointLight3.position.set( -40, -10, 60 );
        this.scene.add( pointLight3 );

        var pointLight4 = new THREE.PointLight( 0xDC8FAB, 1 );
        pointLight4.position.set( 0, 40, 0 );
        this.scene.add( pointLight4 );

        this.raycaster = new THREE.Raycaster(); // create once
        this.clickMouse = new THREE.Vector2();  // create once
        this.moveMouse = new THREE.Vector2();   // create once
        //var draggable;

        window.addEventListener('click', event => {
            if (this.draggable != null) {
                console.log(`dropping draggable ${this.draggable.userData.name}`)
                this.draggable = null
                return;
            }

            // THREE RAYCASTER
            this.clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const found = this.intersect(this.clickMouse);
            if (found.length > 0) {
                if (found[0].object.userData.draggable) {
                this.draggable = found[0].object
                console.log(`found draggable ${this.draggable.userData.name}`)
                }
            }
        })

        window.addEventListener('mousemove', event => {
            this.moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });


        this.createFloor()
        this.createPieces(0)
        this.createPieces(62)
    }

    animate(composer, options) {
        this.dragObject();
        requestAnimationFrame(() => this.animate(composer, options));
        composer.render(this.scene, this.camera);
    };

    createFloor() {
        let pos = { x: 0, y: -1, z: 3 };
        let scale = { x: 100, y: 2, z: 100 };
        const loader = new THREE.TextureLoader();
        let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(),
        new THREE.MeshPhysicalMaterial({  
            roughness: 0,  
            transmission: 1, thickness: 0.1,
            map: loader.load('js/scenes/checkerboard.png'),
          }));
        blockPlane.position.set(pos.x, pos.y, pos.z);
        blockPlane.scale.set(scale.x, scale.y, scale.z);
        blockPlane.castShadow = true;
        blockPlane.receiveShadow = true;
        this.scene.add(blockPlane);
      
        blockPlane.userData.ground = true
    }

    createPieces(side) {
        var material =  new THREE.MeshStandardMaterial( { color: 0x302D5A, metalness: 0.5, roughness: 0.5 } );
        if (side != 0) {
            material = new THREE.MeshStandardMaterial( { color: 0xffffff, metalness: 0.5, roughness: 0.2 } );
        }
        for (let i = -44; i < 45; i+=25) {
            let radius = 4;
            let height = 3
            let pos = { x: i, y: height / 2, z: 46-side };
        
            // threejs
            let cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 32), 
            material)
            cylinder.position.set(pos.x, pos.y, pos.z)
            cylinder.castShadow = true
            cylinder.receiveShadow = true
            this.scene.add(cylinder)
        
            cylinder.userData.draggable = true
            cylinder.userData.name = 'CYLINDER'
        }
        for (let i = -31; i < 45; i+=25) {
            let radius = 4;
            let height = 3
            let pos = { x: i, y: height / 2, z: 34-side };
        
            // threejs
            let cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 32), 
                material)
            cylinder.position.set(pos.x, pos.y, pos.z)
            cylinder.castShadow = true
            cylinder.receiveShadow = true
            this.scene.add(cylinder)
        
            cylinder.userData.draggable = true
            cylinder.userData.name = 'CYLINDER'
        }
        for (let i = -44; i < 45; i+=25) {
            let radius = 4;
            let height = 3
            let pos = { x: i, y: height / 2, z: 22-side };
        
            // threejs
            let cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 32), 
                material)
            cylinder.position.set(pos.x, pos.y, pos.z)
            cylinder.castShadow = true
            cylinder.receiveShadow = true
            this.scene.add(cylinder)
        
            cylinder.userData.draggable = true
            cylinder.userData.name = 'CYLINDER'
        }
    }

    intersect(pos) {
        this.raycaster.setFromCamera(pos, this.camera);
        return this.raycaster.intersectObjects(this.scene.children);
    }

    dragObject() {
        if (this.draggable != null) {
          const found = this.intersect(this.moveMouse);
          if (found.length > 0) {
            for (let i = 0; i < found.length; i++) {
              if (!found[i].object.userData.ground)
                continue
              
              let target = found[i].point;
              this.draggable.position.x = target.x
              this.draggable.position.z = target.z
            }
          }
        }
    }

    getScene() {
        return this.scene;
    }
    getCamera() {
        return this.camera;
    }
}

export { Checkers };

