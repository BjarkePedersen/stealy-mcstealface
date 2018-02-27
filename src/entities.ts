import { Inputs } from "./inputs"

export interface EntityId {
	key: ["entity-id", number]
}

export interface ControlableEntity {
	id: EntityId
	entityType: "controlable-entity"
	speed: number
	position: [number, number]
	child: EntityId
}

export interface SpriteEntity {
	id: EntityId
	entityType: "sprite-entity"
	image: string
	offset?: [number, number]
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
	camera: [number, number]
	gridArray: Tile[][]
	children: EntityId[]
}

export type Entity = ControlableEntity | SpriteEntity | WorldEntity

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
		this.entities[(id as any) as number]
}

export interface UpdateContext {
	dt: number
	inputs: Inputs
	lookUpEntity: (id: EntityId) => Entity | void
}

export const updateEntity = (entity: Entity, ctx: UpdateContext) => {
	switch (entity.entityType) {
		case "world": {
			const toFollow = ctx.lookUpEntity(entity.idToFollow)!
			if ("position" in toFollow) {
				entity.camera[0] += (toFollow.position[0] - entity.camera[0]) * ctx.dt
				entity.camera[1] += (toFollow.position[1] - entity.camera[1]) * ctx.dt
			}
			return
		}
		case "controlable-entity": {
			entity.position[0] +=
				((ctx.inputs.isDown("A") ? -1 : 0) + (ctx.inputs.isDown("D") ? 1 : 0)) *
				entity.speed *
				ctx.dt
			entity.position[1] +=
				((ctx.inputs.isDown("W") ? -1 : 0) + (ctx.inputs.isDown("S") ? 1 : 0)) *
				entity.speed *
				ctx.dt
			return
		}
		case "sprite-entity": {
			// noop
			return
		}
	}
}
