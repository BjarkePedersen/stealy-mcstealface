import * as THREE from "three"
import * as asstes from "../assets"

import { EntityReference, EntitySystem, EntityType, ref } from "./entity-system"
import {
	Vec2,
	add,
	dir,
	len,
	lerp,
	mul,
	polar,
	setLen,
	sub,
	unit,
} from "../misc"

import { Inputs } from "../inputs"

export interface Controlable {
	entityType: "controlable-entity"
	speed: number
	position: Vec2
	child: EntityReference<Sprite>
}

export interface Player {
	entityType: "player-entity"
	state:
		| {
				name: "in-car"
				child: EntityReference<Controlable>
				vehiecle: EntityReference<Car>
		  }
		| {
				name: "initial"
				child: EntityReference<Controlable>
		  }
}

export interface Car {
	entityType: "car-entity"
	model: THREE.Group

	// The force produces by the motor
	acceleration: number

	// The steering done by the steering wheel in absolute radians
	steering: number

	// The direction the cars trunk is facing
	direction: Vec2

	velocity: Vec2
	position: Vec2
}

export interface Sprite {
	entityType: "sprite-entity"
	model: THREE.Mesh
	image: keyof typeof asstes.sources
	offset?: Vec2
}

export interface GrassTile {
	tileType: "grass"
}

export interface ConcreteTile {
	tileType: "concrete"
}

export interface AsphaltTile {
	tileType: "asphalt"
}

export type Tile = GrassTile | ConcreteTile | AsphaltTile

type Locateable = { position: Vec2 } | Player

export interface World {
	entityType: "world"
	idToFollow: EntityReference<Locateable>
	camera: Vec2
	cameraObject: THREE.Camera
	gridArray: Tile[][]
	children: EntityReference<any>[]
}

type x<T extends { entityType: string }> = { [K in T["entityType"]]: T }

export type EntityMap = x<Controlable> &
	x<Sprite> &
	x<World> &
	x<Car> &
	x<Player>

export type Entity = EntityMap[keyof EntityMap]

export class Entities extends EntitySystem<EntityMap, Entity> {}

export interface UpdateContext {
	dt: number
	inputs: Inputs
	lookUpEntity: <T>(reference: EntityReference<T>) => T
	entitiesWithType: <T extends keyof EntityMap>(
		type: T,
	) => EntityType<EntityMap[T]>[]
}

const exec = <T>(fn: T | (() => T)): T => (typeof fn == "function" ? fn() : fn)

export const updateEntity = (entity: Entity, ctx: UpdateContext) => {
	switch (entity.entityType) {
		case "world": {
			return
		}
		case "player-entity": {
			if (entity.state.name == "in-car") {
				if (ctx.inputs.wasPressed("ENTER")) {
					const vehiecle = ctx.lookUpEntity(entity.state.vehiecle)
					vehiecle.steering = 0
					vehiecle.acceleration = 0
					entity.state = {
						name: "initial",
						child: entity.state.child,
					}
					const child = ctx.lookUpEntity(entity.state.child)
					const unitVel = unit(vehiecle.velocity)
					child.position = add(vehiecle.position, [unitVel[1], -unitVel[0]])
					return
				}

				const vehiecle = ctx.lookUpEntity(entity.state.vehiecle)
				vehiecle.steering =
					(ctx.inputs.isDown("A") ? -1 : 0) + (ctx.inputs.isDown("D") ? 1 : 0)

				vehiecle.acceleration =
					(ctx.inputs.isDown("W") ? 1 : 0) + (ctx.inputs.isDown("S") ? -1 : 0)

				return
			}

			const child = ctx.lookUpEntity(entity.state.child)
			child.position[0] +=
				((ctx.inputs.isDown("A") ? -1 : 0) + (ctx.inputs.isDown("D") ? 1 : 0)) *
				child.speed *
				ctx.dt
			child.position[1] +=
				((ctx.inputs.isDown("W") ? -1 : 0) + (ctx.inputs.isDown("S") ? 1 : 0)) *
				child.speed *
				ctx.dt

			if (ctx.inputs.wasPressed("ENTER")) {
				const closestCar = ctx.entitiesWithType("car-entity").reduce(
					(closest, car) => {
						const dist = len(sub(car.inner.position, child.position))
						if (!closest || closest.dist > dist) return { dist, car }
						return closest
					},
					void 0 as void | { car: EntityType<Car>; dist: number },
				)
				if (closestCar && closestCar.dist < 2) {
					entity.state = {
						name: "in-car",
						child: entity.state.child,
						vehiecle: ref(closestCar.car),
					}
				}
			}
			return
		}
		case "controlable-entity": {
			return
		}
		case "sprite-entity": {
			// noop
			return
		}
		case "car-entity": {
			const TURN_SPEED = 10
			const ACCELERATION_SPEED = 0.2

			const angle = dir(entity.velocity) + entity.steering * TURN_SPEED * ctx.dt

			const direction: Vec2 = polar(angle, 1)
			entity.velocity = add(
				mul(
					lerp(entity.velocity, 0.1, setLen(direction, len(entity.velocity))),
					0.99,
				),
				mul(direction, entity.acceleration * ACCELERATION_SPEED * ctx.dt),
			)
			entity.position = add(entity.position, entity.velocity)
			return
		}
	}
}

export type EntityType<T> = EntityType<T>
export { ref, EntitySystem }