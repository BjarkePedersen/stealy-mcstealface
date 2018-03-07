import { Optional } from "../misc"

// Facade interface
export interface EntityId {
	key: ["entity-id", number]
}

const entityId = Symbol("entity id")

// Facade interface
export interface EntityReference<T> {
	itsa: "reference"
	imposible: T
	[entityId]: EntityId
}

export type EntityType<T> = T & { [entityId]: EntityId }

export const ref = <T>(entity: EntityType<T>): EntityReference<T> =>
	({ [entityId]: entity[entityId] } as EntityReference<T>)

export class EntitySystem<
	EntityMap extends { [key: string]: any },
	Entity extends EntityMap[keyof EntityMap] = EntityMap[keyof EntityMap]
> {
	entities: EntityType<Entity>[] = []

	private nextId = 0

	allocId = (): EntityId => {
		return (this.nextId++ as any) as EntityId
	}

	createEntity = <
		T extends keyof EntityMap,
		S extends EntityMap[T] = EntityMap[T]
	>(
		entityType: T,
		body: Optional<S, "entityType">,
	): EntityType<S> =>
		this.registerEntity({
			entityType,
			...(body as any),
		})

	registerEntity = <T extends Entity>(original: T): EntityType<T> => {
		const id = this.allocId()
		const entity = { [entityId]: id, ...(original as any) }
		this.entities[(id as any) as number] = entity
		return entity
	}

	lookUpEntity = <T>(id: EntityReference<T>): EntityType<T> =>
		this.entities[(id[entityId] as any) as number] as EntityType<T>

	entitiesWithType = <T extends keyof EntityMap>(
		type: T,
		other?: {
			not?: EntityReference<EntityMap[T]>
		},
	): EntityType<EntityMap[T]>[] =>
		this.entities.filter(e => {
			if (e.entityType !== type) return false
			if (other) {
				if (other.not && e[entityId] === other.not[entityId]) {
					return false
				}
			}
			return true
		}) as EntityType<EntityMap[T]>[]
}
