import { BoundingBox, Position, Velocity } from "../components"
import { add, scale } from "../misc"

import { System } from "."

export const PhysicsSystem = new System(
	[Position.key, Velocity.key, BoundingBox.key],
	async ({ position, velocity }, { dt }) => {
		position.position = add(position.position, scale(velocity.velocity, dt))
	},
)
