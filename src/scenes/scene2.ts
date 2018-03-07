import * as THREE from "three"
import * as blueprints from "../entities/blueprints"

import {
	BoundingBox,
	Camera,
	Passenger,
	Player,
	Position,
	Renderable,
	Steering,
	Velocity,
} from "../components"

import { CameraTrackingSystem } from "../systems/CameraTrackingSystem"
import { CarSystem } from "../systems/CarSystem"
import { EntitySystem } from "../entities/next"
import { Inputs } from "../inputs"
import { PhysicsSystem } from "../systems/PhysicsSystem"
import { PlayerSystem } from "../systems/PlayerSystem"

export const build = async (ctx: {
	camera: THREE.Camera
	loadObj: (path: string) => Promise<THREE.Group>
	loadCubeMap: (files: string[]) => Promise<THREE.CubeTexture>
}) => {
	const system = new EntitySystem([
		Velocity.key,
		Position.key,
		BoundingBox.key,
		Steering.key,
		Player.key,
		Passenger.key,
		Renderable.key,
		Camera.key,
	])

	system.registerSystem(CarSystem)
	system.registerSystem(PlayerSystem)
	system.registerSystem(PhysicsSystem)
	system.registerSystem(CameraTrackingSystem)

	const car = system.createEntity(await blueprints.carBlueprint(ctx))

	const playerChild = system.createEntity([
		new Position(),
		new Velocity(),
		new Renderable(
			new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 1, 100),
				new THREE.MeshPhongMaterial({
					color: 0xffffff,
					specular: 0xffffff,
					shininess: 20,
					morphTargets: true,
					vertexColors: THREE.FaceColors,
					flatShading: true,
				}),
			),
		),
	])

	const player = system.createEntity([new Player(playerChild), new Passenger()])
	const camera = system.createEntity([
		new Camera(ctx.camera, player),
		new Position(),
	])
	await car.steering.enter(player)
	await player.player.enterCar(car)
	// ;(async () => {
	// 	const inputs = new Inputs(document.body)
	// 	const dt = 0.16
	await car.steering.setGas(0.1)

	// 	// await system.update(inputs, dt)
	// 	// await system.update(inputs, dt)
	// 	// car.steering.enter(player)
	// 	// await system.update(inputs, dt)
	// 	// await system.update(inputs, dt)
	// })()

	return system
}
