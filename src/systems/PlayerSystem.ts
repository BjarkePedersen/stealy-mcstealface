import { Passenger, Player, Position, Steering, Velocity } from "../components"
import { add, len, normalize, scale, sub } from "../misc"

import { EntityReference } from "../entities/next"
import { System } from "."

export const PlayerSystem = new System(
	[Player.key, Passenger.key],
	async (entity, { inputs, ref, queryByComponents }) => {
		const { player } = entity
		const dt = 0.016

		if (player.car) {
			// ENTER WAS PRESSED
			if (inputs.wasPressed("ENTER")) {
				const r = ref(entity)
				player.car.steering.leave(r)
				player.car.steering.steer(0)
				player.car.steering.setGas(0)
				const carDirection = await player.car.steering.getDirection()
				const carPosition = await player.car.position.getPosition()
				await player.car.steering.leave(ref(entity))
				player.car = void 0
				// const child = ctx.lookUpEntity(entity.state.child)
				const unitVel = normalize(carDirection)
				await player.child.position.setPosition(add(carPosition, unitVel))
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

		const velocity = scale(
			[
				(inputs.isDown("A") ? -1 : 0) + (inputs.isDown("D") ? 1 : 0),
				(inputs.isDown("W") ? -1 : 0) + (inputs.isDown("S") ? 1 : 0),
			],
			10 * dt,
		)
		const childP = await player.child.position.getPosition()
		await player.child.position.setPosition(add(childP, velocity))

		if (inputs.wasPressed("ENTER")) {
			const closestCar = await queryByComponents([
				Position.key,
				Velocity.key,
				Steering.key,
			]).reduce(
				async (closestP, car) => {
					const closest = await closestP
					const dist = len(sub(await car.position.getPosition(), childP))
					if (!closest || closest.dist > dist) return { dist, car }
					return closest
				},
				Promise.resolve(void 0 as void | {
					car: EntityReference<Position | Steering | Velocity>
					dist: number
				}),
			)
			if (closestCar && closestCar.dist < 2) {
				if (await closestCar.car.steering.enter(ref(entity))) {
					player.enterCar(closestCar.car)
				}
			}
		}
		return
	},
)
