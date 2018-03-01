import * as asstes from "./assets"

import { Vec2, add, len, lerp, mul, setLen, sub } from "./misc"

import { Inputs } from "./inputs"

export interface EntityId {
	key: ["entity-id", number]
}

export interface ControlableEntity {
	id: EntityId
	entityType: "controlable-entity"
	speed: number
	position: Vec2
	child: EntityId
}

export interface PlayerEntity {
	id: EntityId
	entityType: "player-entity"
	child: EntityId
	vehiecle?: EntityId
}

export interface CarEntity {
	id: EntityId
	entityType: "car-entity"
	acceleration: number
	direction: number
	velocity: Vec2
	position: Vec2
	child: EntityId
}

export interface SpriteEntity {
	id: EntityId
	entityType: "sprite-entity"
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

export interface WorldEntity {
	id: EntityId
	idToFollow: EntityId
	entityType: "world"
	camera: Vec2
	gridArray: Tile[][]
	children: EntityId[]
}

type x<T extends { entityType: string }> = { [K in T["entityType"]]: T }
type y = x<ControlableEntity>

export type EntityMap = Readonly<
	x<ControlableEntity> &
		x<SpriteEntity> &
		x<WorldEntity> &
		x<CarEntity> &
		x<PlayerEntity>
>

export type Entity = EntityMap[keyof EntityMap]

export class Entities {
	entities: Entity[] = []

	private nextId = 0

	allocId = (): EntityId => {
		return (this.nextId++ as any) as EntityId
	}

	registerEntity = (entity: Entity) => {
		this.entities[(entity.id as any) as number] = entity
	}

	lookUpEntity = (id: EntityId): Entity | void =>
		this.entities[(id as any) as number] as Entity

	entitiesWithType = <T extends keyof EntityMap>(type: T): EntityMap[T][] =>
		this.entities.filter(e => e.entityType == type) as EntityMap[T][]
}

export interface UpdateContext {
	dt: number
	inputs: Inputs
	lookUpEntity: (id: EntityId) => Entity | void
	entitiesWithType: <T extends keyof EntityMap>(type: T) => EntityMap[T][]
}

export const updateEntity = (entity: Entity, ctx: UpdateContext) => {
	switch (entity.entityType) {
		case "world": {
			let toFollow = ctx.lookUpEntity(entity.idToFollow)!
			if (toFollow.entityType == "player-entity") {
				toFollow = toFollow.vehiecle
					? ctx.lookUpEntity(toFollow.vehiecle)!
					: ctx.lookUpEntity(toFollow.child)!
			}
			if ("position" in toFollow) {
				entity.camera = lerp(entity.camera, ctx.dt, toFollow.position)
			}
			return
		}
		case "player-entity": {
			if (entity.vehiecle) {
				if (ctx.inputs.wasPressed("ENTER")) {
					const vehiecle = ctx.lookUpEntity(entity.vehiecle)!
					entity.vehiecle = void 0
					const child = ctx.lookUpEntity(entity.child)!
					if ("position" in child && "position" in vehiecle) {
						child.position = vehiecle.position
					}
					return
				}

				const vehiecle = ctx.lookUpEntity(entity.vehiecle)!
				if ("acceleration" in vehiecle) {
					vehiecle.direction =
						(ctx.inputs.isDown("A") ? -1 : 0) + (ctx.inputs.isDown("D") ? 1 : 0)

					vehiecle.acceleration =
						(ctx.inputs.isDown("W") ? 1 : 0) + (ctx.inputs.isDown("S") ? -1 : 0)

					return
				}
			}

			const child = ctx.lookUpEntity(entity.child)!
			if ("position" in child && "speed" in child) {
				child.position[0] +=
					((ctx.inputs.isDown("A") ? -1 : 0) +
						(ctx.inputs.isDown("D") ? 1 : 0)) *
					child.speed *
					ctx.dt
				child.position[1] +=
					((ctx.inputs.isDown("W") ? -1 : 0) +
						(ctx.inputs.isDown("S") ? 1 : 0)) *
					child.speed *
					ctx.dt

				if (ctx.inputs.wasPressed("ENTER")) {
					const closestCar = ctx.entitiesWithType("car-entity").reduce(
						(closest, car) => {
							const dist = len(sub(car.position, child.position))
							if (!closest || closest.dist > dist) return { dist, car }
							return closest
						},
						void 0 as void | { car: CarEntity; dist: number },
					)
					if (closestCar && closestCar.dist < 2) {
						entity.vehiecle = closestCar.car.id
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

			const dir =
				Math.atan2(entity.velocity[1], entity.velocity[0]) +
				entity.direction * TURN_SPEED * ctx.dt

			const direction: Vec2 = [Math.cos(dir), Math.sin(dir)]
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
