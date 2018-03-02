// Facade interface
export interface EntityId {
	key: ["entity-id", number]
}

// Facade interface
export interface EntityReference<T> {
	itsa: "reference"
	imposible: T
	id: EntityId
}

export type EntityType<T> = { id: EntityId; inner: T }

export const ref = <T>(entity: EntityType<T>): EntityReference<T> =>
	({ id: entity.id } as EntityReference<T>)

type Omit<T, S> = Pick<T, Exclude<keyof T, S>>

export class EntitySystem<
	EntityMap extends { [key: string]: any },
	Entity extends EntityMap[keyof EntityMap] = EntityMap[keyof EntityMap]
> {
	entities: ({ id: EntityId; inner: Entity })[] = []

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

	registerEntity = <T extends Entity>(inner: T): EntityType<T> => {
		const id = this.allocId()
		const entity = { id, inner }
		this.entities[(id as any) as number] = entity
		return entity
	}

	lookUpEntity = <T>(id: EntityReference<T>): T =>
		(this.entities[(id.id as any) as number] as any).inner as T

	entitiesWithType = <T extends keyof EntityMap>(
		type: T,
	): EntityType<EntityMap[T]>[] =>
		this.entities.filter(e => e.inner.entityType == type) as EntityType<
			EntityMap[T]
		>[]
}
