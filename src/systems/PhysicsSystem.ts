import {
	BoundingBox,
	CollisionResponse,
	Position,
	Velocity,
} from "../components"
import { EntityReference, isReferenceToSame } from "../entities/next"
import { SatResult, sat } from "../intersections"
import { add, dot, scale, sub } from "../misc"

import { System } from "."

export const PhysicsSystem = new System(
	[Position.key, Velocity.key, BoundingBox.key, CollisionResponse.key],
	(self, { dt, queryByComponents, ref }) => {
		const { position, velocity, boundingbox, collisionResponse } = self
		position.position = add(position.position, scale(velocity.velocity, dt))
		boundingbox.translate(scale(velocity.velocity, dt))

		const others = queryByComponents([BoundingBox.key]).filter(
			x => !isReferenceToSame(x, ref(self)),
		)
		const result = others.reduce<
			false | { result: SatResult; boundingBox: EntityReference<BoundingBox> }
		>((smallest, other) => {
			const result = sat(boundingbox.shape, other.boundingbox.getShape())
			if (!result) return smallest
			if (!smallest) return { result, boundingBox: other }
			if (result.t < smallest.result.t) return { result, boundingBox: other }
			return smallest
		}, false)

		if (result) {
			const otherCenter = result.boundingBox.boundingbox.getCenter()
			const d = dot(
				sub(boundingbox.center, otherCenter),
				scale(result.result.direction, result.result.t),
			)
			const mat = scale(result.result.direction, result.result.t * Math.sign(d))
			position.position = add(position.position, mat)
			boundingbox.translate(mat)
			collisionResponse.collisions.push(mat)
		}
	},
)
