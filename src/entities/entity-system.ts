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

type Omit<T, S> = Pick<T, Exclude<keyof T, S>>

export class EntitySystem<
	EntityMap extends { [key: string]: any },
	Entity extends EntityMap[keyof EntityMap] = EntityMap[keyof EntityMap]
> {
	entities: EntityType<Entity>[] = []

	private nextId = 0

	allocId = (): EntityId => {
		return (this.nextId++ as any) as EntityId
	}

	createEntity = <T extends keyof EntityMap, S = EntityMap[T]>(
		entityType: T,
		body: Omit<S, "entityType">,
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

	lookUpEntity = <T>(id: EntityReference<T>): T =>
		this.entities[(id[entityId] as any) as number] as T

	entitiesWithType = <T extends keyof EntityMap>(
		type: T,
	): EntityType<EntityMap[T]>[] =>
		this.entities.filter(e => e.entityType == type) as EntityType<
			EntityMap[T]
		>[]
}
