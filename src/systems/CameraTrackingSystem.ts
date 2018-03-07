import * as THREE from "three"

import { Camera, Position } from "../components"
import { add, lerp, normalize, scale, sub } from "../misc"

import { System } from "."

export const CameraTrackingSystem = new System(
	[Camera.key, Position.key],
	async ({ camera, position }, { dt }) => {
		const cam = camera.camera
		let toFollow = camera.track
		const car = await toFollow.player.getCar()
		if (car) {
			const carV = await car.velocity.getVelocity()
			const carP = await car.position.getPosition()
			const unitVel = normalize(carV)
			position.position = lerp(
				position.position,
				dt * 10.0,
				sub(carP, scale(unitVel, 5)),
			)
			cam.up = new THREE.Vector3(0, 0, 1)
			cam.lookAt(new THREE.Vector3(carP[0], -carP[1], 0))
			cam.position.lerp(
				new THREE.Vector3(position.position[0], -position.position[1], 3),
				dt * 10,
			)
		} else {
			const child = await toFollow.player.getChild()

			const childP = await child.position.getPosition()

			const camP = add(childP, [0, 10])
			cam.position.lerp(new THREE.Vector3(camP[0], -camP[1], 10), dt * 10)

			const dum = new THREE.Camera()
			dum.position.x = cam.position.x
			dum.position.y = cam.position.y
			dum.position.z = cam.position.z

			dum.lookAt(new THREE.Vector3(childP[0], -childP[1], 0))

			cam.quaternion.slerp(dum.quaternion, dt * 10)
		}
		// } else {
		// 	entity.camera = lerp(entity.camera, dt, add(toFollow.position, [0, 10]))
		// 	cam.position.x = entity.camera[0]
		// 	cam.position.y = -entity.camera[1]
		// }
		// for (const child of entity.children) {
		// 	renderEntity(entities.lookUpEntity(child), entities, [0, 0])
		// }
		return
	},
)
