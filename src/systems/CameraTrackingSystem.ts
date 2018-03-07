import * as THREE from "three"

import { Camera, Position } from "../components"
import { add, lerp, normalize, scale, sub } from "../misc"

import { System } from "."

export const CameraTrackingSystem = new System(
	[Camera.key, Position.key],
	({ camera, position }, { dt }) => {
		const cam = camera.camera
		let toFollow = camera.track
		const car = toFollow.player.getCar()
		if (car) {
			const carV = car.velocity.getVelocity()
			const carP = car.position.getPosition()
			const unitVel = normalize(carV)
			position.position = lerp(
				position.position,
				dt * 10.0,
				sub(carP, scale(unitVel, 5)),
			)
			cam.up = new THREE.Vector3(0, 1, 0)
			cam.lookAt(new THREE.Vector3(carP[0], 0, carP[1]))
			cam.position.lerp(
				new THREE.Vector3(position.position[0], 3, position.position[1]),
				dt * 10,
			)
		} else {
			const child = toFollow.player.getChild()

			const childP = child.position.getPosition()

			const camP = add(childP, [0, 10])
			cam.position.lerp(new THREE.Vector3(camP[0], 10, camP[1]), dt * 10)

			const dum = new THREE.Camera()
			dum.position.x = cam.position.x
			dum.position.y = cam.position.y
			dum.position.z = cam.position.z

			dum.lookAt(new THREE.Vector3(childP[0], 0, childP[1]))

			cam.quaternion.slerp(dum.quaternion, dt * 10)
		}
		return
	},
)
