import * as THREE from "three"

import { Entities, ref } from "../entities"

export const build = async (
	entities: Entities,
	camera: THREE.PerspectiveCamera,
	loadObj: (path: string) => Promise<THREE.Group>,
	material: THREE.Material,
) => {


	// const testMaterial = new THREE.MeshStandardMaterial({
	// 	color: 0xfafafa,
	// 	metalness: 0,
	// 	roughness: .2,
	// })

	// const loader = new THREE.JSONLoader();
	// const carMesh = loader.load("../assets/models/car.json", function (gemoetry1) {
	// 	return new THREE.Mesh(gemoetry1, testMaterial);
	// });

	const carModel = await loadObj(await import("../assets/models/mazda787b.obj"))
	carModel.receiveShadow = true
	carModel.castShadow = true

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
