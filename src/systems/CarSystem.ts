import {
	BoundingBox,
	CollisionResponse,
	Position,
	Renderable,
	Steering,
	Velocity,
} from "../components"
import { Rectangle, getEdges } from "../intersections"
import { add, dir, dot, len, lerp, normalize, polar, scale } from "../misc"

import { System } from "."

export const CarSystem = new System(
	[
		Velocity.key,
		Position.key,
		Steering.key,
		BoundingBox.key,
		Renderable.key,
		CollisionResponse.key,
	],
	(car, { dt }) => {
		const {
			position,
			steering,
			velocity,
			boundingbox,
			renderable,
			collisionResponse,
		} = car

		const TURN_SPEED = 0.03
		const TURN_DRAG = 0.99
		const ACCELERATION_SPEED = 10

		const face = dot(steering.direction, normalize(velocity.velocity))

		const angle =
			dir(steering.direction) + steering.steering * TURN_SPEED * Math.sign(face)

		const wheels = polar(angle, 1)

		steering.direction = normalize(
			lerp(steering.direction, len(velocity.velocity) * TURN_SPEED, wheels),
		)
		const straight = Math.abs(face)
		velocity.velocity = add(
			scale(
				add(
					scale(velocity.velocity, TURN_DRAG * (1 - straight)),
					scale(
						steering.direction,
						straight * len(velocity.velocity) * (face > 0 ? 1 : -1),
					),
				),
				0.99,
			),
			scale(wheels, steering.gas * ACCELERATION_SPEED * dt),
		)
		let collision
		while ((collision = collisionResponse.collisions.pop())) {
			velocity.velocity = scale(velocity.velocity, 0.9)
		}

		// Note(oeb25): Do bounding box update

		const rect: Rectangle = {
			x: position.position[0],
			y: position.position[1],
			height: 2,
			width: 4.7,
			rotation: dir(steering.direction),
		}
		boundingbox.shape = getEdges(rect)
		boundingbox.center = position.position

		renderable.object.position.x = position.position[0]
		renderable.object.position.y = 0.5
		renderable.object.position.z = position.position[1]
		renderable.object.rotation.y = -dir(steering.direction)
		return
	},
)
