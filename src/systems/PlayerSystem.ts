import { Passenger, Player, Position, Steering, Velocity } from "../components"
import { add, len, normalize, perpendicular2, scale, sub } from "../misc"

import { EntityReference } from "../entities/next"
import { System } from "."

export const PlayerSystem = new System(
	[Player.key, Passenger.key],
	(entity, { inputs, ref, queryByComponents }) => {
		const { player } = entity
		const dt = 0.016

		if (player.car) {
			if (inputs.wasPressed("ENTER")) {
				const r = ref(entity)
				player.car.steering.leave(r)
				player.car.steering.steer(0)
				player.car.steering.setGas(0)
				const carDirection = player.car.steering.getDirection()
				const carPosition = player.car.position.getPosition()
				player.car.steering.leave(ref(entity))
				player.car = void 0
				const unitVel = perpendicular2(scale(normalize(carDirection), 2))
				player.child.position.setPosition(add(carPosition, unitVel))
				return
			}

			player.car.steering.steer(
				(inputs.isDown("A") ? -1 : 0) + (inputs.isDown("D") ? 1 : 0),
			)
			player.car.steering.setGas(
				(inputs.isDown("W") ? 1 : 0) + (inputs.isDown("S") ? -1 : 0),
			)

			return
		}

		let velocity = scale(
			normalize([
				(inputs.isDown("A") ? -1 : 0) + (inputs.isDown("D") ? 1 : 0),
				(inputs.isDown("W") ? -1 : 0) + (inputs.isDown("S") ? 1 : 0),
			]),
			1000 * dt,
		)
		player.child.velocity.setVelocity(velocity)

		if (inputs.wasPressed("ENTER")) {
			const childP = player.child.position.getPosition()
			const closestCar = queryByComponents([
				Position.key,
				Velocity.key,
				Steering.key,
			]).reduce(
				(closest, car) => {
					const dist = len(sub(car.position.getPosition(), childP))
					if (!closest || closest.dist > dist) return { dist, car }
					return closest
				},
				void 0 as void | {
					car: EntityReference<Position | Steering | Velocity>
					dist: number
				},
			)
			if (closestCar && closestCar.dist < 2) {
				if (closestCar.car.steering.enter(ref(entity))) {
					player.enterCar(closestCar.car)
				}
			}
		}
		return
	},
)
