import * as THREE from "three"
import * as asstes from "../assets"

import { EntityReference, EntitySystem, EntityType, ref } from "./entity-system"
import {
	Omit,
	Vec2,
	add,
	dir,
	dot,
	len,
	lerp,
	normalize,
	polar,
	scale,
	sub,
	unit,
} from "../misc"
import { Rectangle, SatResult, Shape, getEdges } from "../intersections"

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

	boundingBox?: EntityReference<BoundingBox>
}

export const carBoundingBox = (car: Pick<Car, "position" | "direction">) => {
	const rect: Rectangle = {
		x: car.position[0],
		y: car.position[1],
		height: 2,
		width: 4.7,
		rotation: dir(car.direction),
	}
	return { shape: getEdges(rect), center: car.position }
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
	x<Car> &
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
	createEntity: <T extends keyof EntityMap, S = EntityMap[T]>(
		entityType: T,
		body: Omit<S, "entityType">,
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
			const TURN_SPEED = 0.3
			const TURN_DRAG = 0.99
			const ACCELERATION_SPEED = 0.2

			const angle = dir(entity.direction) + entity.steering * TURN_SPEED

			const wheels = polar(angle, 1)

			entity.direction = normalize(
				lerp(entity.direction, len(entity.velocity) * TURN_SPEED, wheels),
			)
			const face = dot(entity.direction, normalize(entity.velocity))
			const straight = Math.abs(face)
			entity.velocity = add(
				scale(
					add(
						scale(entity.velocity, TURN_DRAG * (1 - straight)),
						scale(
							entity.direction,
							straight * len(entity.velocity) * (face > 0 ? 1 : -1),
						),
					),
					0.99,
				),
				scale(wheels, entity.acceleration * ACCELERATION_SPEED * ctx.dt),
			)
			entity.position = add(entity.position, entity.velocity)
			if (!entity.boundingBox) {
				entity.boundingBox = ref(
					ctx.createEntity("bounding-box", carBoundingBox(entity)),
				)
			} else {
				ctx.lookUpEntity(entity.boundingBox).shape = carBoundingBox(
					entity,
				).shape
			}
			let result: ReturnType<typeof ctx.sat>
			if ((result = ctx.sat(ctx.lookUpEntity(entity.boundingBox)))) {
				const d = dot(
					sub(entity.position, result.boundingBox.center),
					scale(result.result.direction, result.result.t),
				)
				entity.position = add(
					entity.position,
					scale(result.result.direction, result.result.t * Math.sign(d)),
				)
				entity.velocity = scale(entity.velocity, 0.9)
				ctx.lookUpEntity(entity.boundingBox).shape = carBoundingBox(
					entity,
				).shape
			}
			return
		}
	}
}

export type EntityType<T> = EntityType<T>
export { ref, EntitySystem }
