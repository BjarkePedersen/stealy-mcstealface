import * as THREE from "three"

import { Entities, Entity } from "./entities"
import { add, dir, lerp, mul, sub, unit } from "./misc"

export const renderEntity = (
	entity: Entity,
	entities: Entities,
	offset: [number, number],
) => {
	const dt = 0.016
	switch (entity.entityType) {
		case "world": {
			const cam = entity.cameraObject
			let toFollow = entities.lookUpEntity(entity.idToFollow)
			// Check if its a player
			if (!("position" in toFollow)) {
				if (toFollow.state.name == "in-car") {
					const car = entities.lookUpEntity(toFollow.state.vehiecle)

					const unitVel = unit(car.velocity)
					entity.camera = lerp(
						entity.camera,
						dt * 10.0,
						sub(car.position, mul([unitVel[0], unitVel[1]], 5)),
					)
					cam.up = new THREE.Vector3(0, 0, 1)
					cam.lookAt(new THREE.Vector3(car.position[0], -car.position[1], 0))
					cam.position.lerp(
						new THREE.Vector3(entity.camera[0], -entity.camera[1], 3),
						dt * 10,
					)
				} else {
					const obj = entities.lookUpEntity(toFollow.state.child)

					const camP = add(obj.position, [0, 10])
					cam.position.lerp(new THREE.Vector3(camP[0], -camP[1], 10), dt * 10)

					const dum = new THREE.Camera()
					dum.position.x = cam.position.x
					dum.position.y = cam.position.y
					dum.position.z = cam.position.z

					dum.lookAt(new THREE.Vector3(obj.position[0], -obj.position[1], 0))

					cam.quaternion.slerp(dum.quaternion, dt * 10)
				}
			} else {
				entity.camera = lerp(entity.camera, dt, add(toFollow.position, [0, 10]))
				cam.position.x = entity.camera[0]
				cam.position.y = -entity.camera[1]
			}
			for (const child of entity.children) {
				renderEntity(entities.lookUpEntity(child), entities, [0, 0])
			}
			return
		}
		case "controlable-entity": {
			renderEntity(
				entities.lookUpEntity(entity.child),
				entities,
				add(offset, entity.position),
			)
			return
		}
		case "player-entity": {
			if (entity.state.name == "in-car") {
				const child = entities.lookUpEntity(entity.state.child)
				const sprite = entities.lookUpEntity(child.child)
				sprite.model.visible = false
				return
			}
			const child = entities.lookUpEntity(entity.state.child)
			const sprite = entities.lookUpEntity(child.child)
			sprite.model.visible = true

			renderEntity(entities.lookUpEntity(entity.state.child), entities, offset)
			return
		}
		case "sprite-entity": {
			entity.model.position.x = offset[0]
			entity.model.position.y = -offset[1]
			return
		}
		case "car-entity": {
			entity.model.position.x = entity.position[0]
			entity.model.position.y = -entity.position[1]
			entity.model.rotation.z = -dir(entity.direction)
			return
		}
	}
}
