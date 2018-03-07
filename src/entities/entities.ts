import * as THREE from "three"
import * as asstes from "../assets"
import * as car from "./car"

import { EntityReference, EntitySystem, EntityType, ref } from "./entity-system"
import { Optional, Vec2, add, len, scale, setLen, sub, unit } from "../misc"
import { SatResult, Shape } from "../intersections"

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
				vehiecle: EntityReference<car.Car>
		  }
		| {
				name: "initial"
				child: EntityReference<Controlable>
		  }
}

export interface BoundingBox {
	entityType: "bounding-box"
	shape: Shape
	center: Vec2
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
	x<car.Car> &
	x<Player> &
	x<BoundingBox>

export type Entity = EntityMap[keyof EntityMap]

export class Entities extends EntitySystem<EntityMap, Entity> {}

export interface UpdateContext {
	dt: number
	inputs: Inputs
	sat: (
		bb: EntityType<BoundingBox>,
	) => false | { result: SatResult; boundingBox: EntityType<BoundingBox> }
	createEntity: <
		T extends keyof EntityMap,
		S extends EntityMap[T] = EntityMap[T]
	>(
		entityType: T,
		body: Optional<S, "entityType">,
	) => EntityType<S>
	lookUpEntity: <T>(reference: EntityReference<T>) => EntityType<T>
	entitiesWithType: <T extends keyof EntityMap>(
		type: T,
	) => EntityType<EntityMap[T]>[]
}

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
					const unitVel = unit(vehiecle.direction)
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
			const velocity = scale(
				[
					(ctx.inputs.isDown("A") ? -1 : 0) + (ctx.inputs.isDown("D") ? 1 : 0),
					(ctx.inputs.isDown("W") ? -1 : 0) + (ctx.inputs.isDown("S") ? 1 : 0),
				],
				child.speed * ctx.dt,
			)
			child.position = add(child.position, velocity)

			if (ctx.inputs.wasPressed("ENTER")) {
				const closestCar = ctx.entitiesWithType("car-entity").reduce(
					(closest, car) => {
						const dist = len(sub(car.position, child.position))
						if (!closest || closest.dist > dist) return { dist, car }
						return closest
					},
					void 0 as void | { car: EntityType<car.Car>; dist: number },
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
			car.update(entity, ctx)
			return
		}
	}
}

export type EntityType<T> = EntityType<T>
export { ref, EntitySystem }
