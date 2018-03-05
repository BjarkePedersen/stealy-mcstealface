import * as THREE from "three"

import { Entities, ref } from "../entities"
import { CubeTexture } from "three";

export const build = async (
	scene: THREE.Scene,
	entities: Entities,
	camera: THREE.PerspectiveCamera,
	loadObj: (path: string) => Promise<THREE.Group>,
	loadCubeMap: (files: string[]) => Promise<CubeTexture>,
	material: THREE.Material,
) => {

	scene.background = await loadCubeMap(
		[await import('../assets/textures/pisa/px.png'),
		await import('../assets/textures/pisa/nx.png'),
		await import('../assets/textures/pisa/py.png'),
		await import('../assets/textures/pisa/ny.png'),
		await import('../assets/textures/pisa/pz.png'),
		await import('../assets/textures/pisa/nz.png')]
	)

	console.log(scene.background);


	const dialectricParams = {
		metalness: 0,
		color: 0xed1c1c,
		clearCoat: 1, // Always keep on 1
		clearCoatRoughness: 1,
		reflectivity: 1.0, // Always keep on 1
		roughness: 0.1, // Always keep on 1
		envMap: scene.background,
	};

	const carMaterial = new THREE.MeshPhysicalMaterial(dialectricParams)

	const carModel = await loadObj(await import("../assets/models/mazda787b.obj"))
	carModel.receiveShadow = true
	carModel.castShadow = true
	carModel.traverse(x => {
		if (x instanceof THREE.Mesh) {
			x.material = carMaterial
		}
	})

	const playerImage = entities.createEntity("sprite-entity", {
		model: new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 0.5, 1, 100),
			material,
		),
		image: "juice",
	})
	playerImage.model.rotation.x = Math.PI / 2

	const playerEntity = entities.createEntity("controlable-entity", {
		speed: 10,
		child: ref(playerImage),
		position: [2, 2],
	})

	const car1 = entities.createEntity("car-entity", {
		model: carModel.clone(),
		acceleration: 0,
		steering: 0,
		direction: [1, 0],
		velocity: [0.01, 0],
		position: [2, 2],
	})

	const car2 = entities.createEntity("car-entity", {
		model: carModel.clone(),
		acceleration: 0,
		steering: 0,
		direction: [1, 0],
		velocity: [0.01, 0],
		position: [10, 14],
	})

	const car3 = entities.createEntity("car-entity", {
		model: carModel.clone(),
		acceleration: 0,
		steering: 0,
		direction: [1, 0],
		velocity: [0.01, -0.01],
		position: [-5, 12],
	})

	const player = entities.createEntity("player-entity", {
		state: {
			name: "initial",
			child: ref(playerEntity),
		},
	})

	const world = entities.createEntity("world", {
		idToFollow: ref(player),
		cameraObject: camera,
		gridArray: [],
		children: [ref(car1), ref(car2), ref(car3), ref(player)],
		camera: [0, 0],
	})

	const models = [car1.model, car2.model, car3.model, playerImage.model]

	return { world, models }
}
