

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

		const renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		const geometry = new THREE.OctahedronGeometry(1, 2);
		const material = new THREE.MeshBasicMaterial({ color: 0x0808080 });
		const edges = new THREE.EdgesGeometry(geometry);
		const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
		scene.add(line);
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);


		camera.position.z = 5;
        camera.position.y = 2;

		function animate() {
			requestAnimationFrame(animate);

			cube.rotation.x += 0.03;
			cube.rotation.y += 0.03;

			line.rotation.x += 0.03;
			line.rotation.y += 0.03;

			renderer.render(scene, camera);
		};

		animate();