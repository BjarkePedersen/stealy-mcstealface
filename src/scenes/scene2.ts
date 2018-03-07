import * as THREE from "three"
import * as blueprints from "../entities/blueprints"

import {
	BoundingBox,
	Camera,
	CollisionResponse,
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
import { PhysicsSystem } from "../systems/PhysicsSystem"
import { PlayerSystem } from "../systems/PlayerSystem"

export const build = async (ctx: {
	camera: THREE.Camera
	scene: THREE.Scene
	loadObj: (path: string) => Promise<THREE.Group>
	loadCubeMap: (files: string[]) => Promise<THREE.CubeTexture>
}) => {
	ctx.scene.background = await ctx.loadCubeMap([
		await import("../assets/textures/pisa/px.png"),
		await import("../assets/textures/pisa/nx.png"),
		await import("../assets/textures/pisa/py.png"),
		await import("../assets/textures/pisa/ny.png"),
		await import("../assets/textures/pisa/pz.png"),
		await import("../assets/textures/pisa/nz.png"),
	])

	const system = new EntitySystem([
		Velocity.key,
		Position.key,
		BoundingBox.key,
		Steering.key,
		Player.key,
		Passenger.key,
		Renderable.key,
		Camera.key,
		CollisionResponse.key,
	])

	system.registerSystem(CarSystem)
	system.registerSystem(PlayerSystem)
	system.registerSystem(PhysicsSystem)
	system.registerSystem(CameraTrackingSystem)

	system.createEntity(
		await blueprints.carBlueprint({
			loadCubeMap: ctx.loadCubeMap,
			loadObj: ctx.loadObj,
			envMap: ctx.scene.background,
		}),
	)
	const car2 = system.createEntity(
		await blueprints.carBlueprint({
			loadCubeMap: ctx.loadCubeMap,
			loadObj: ctx.loadObj,
			envMap: ctx.scene.background,
		}),
	)
	car2.position.position = [10, 2]

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

	const player = system.createEntity([
		new Player(system.ref(playerChild)),
		new Passenger(),
	])
	system.createEntity([
		new Camera(ctx.camera, system.ref(player)),
		new Position(),
	])

	return system
}
