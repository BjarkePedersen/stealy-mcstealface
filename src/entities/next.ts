import { ComponentMap, Components } from "../components"

import { Inputs } from "../inputs"
import { System } from "../systems"
import { keys } from "../misc"

// Facade interface
export interface EntityId {
	key: ["entity-id", number]
}

const entityId = Symbol("entity id")

type FunctionPropertyNames<T> = T extends any
	? {
			[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
	  }[keyof T]
	: never

type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>

// type G = {[K in keyof ComponentMap]: FunctionProperties<ComponentMap[K]> }
type F<T extends Components> = {
	[K in T["key"]]: FunctionProperties<ComponentMap[K]>
}

// Facade interface
export type EntityReference<T extends Components> = {
	itsa: "reference"
	[entityId]: EntityId
} & F<T>

export const isReferenceToSame = <T extends Components, S extends Components>(
	a: EntityReference<T>,
	b: EntityReference<S>,
) => a[entityId] == b[entityId]

export type Entity<T extends keyof ComponentMap> = { id: EntityId } & {
	[K in T]: ComponentMap[K]
}

export type Arena<T extends keyof ComponentMap> = {
	[K in T]: T extends { key: K } ? Map<EntityId, T> : never
}

export class EntitySystem<T extends keyof ComponentMap> {
	components: T[]
	arena: Arena<T>
	systems: System<T, T>[] = []
	entities: EntityId[] = []

	private nextId = 0

	allocId = (): EntityId => {
		return (this.nextId++ as any) as EntityId
	}

	constructor(components: T[]) {
		this.components = components
		this.arena = components.reduce(
			(acc, compoent) => ({ ...acc, [compoent]: new Map() }),
			{},
		) as Arena<T>
	}

	extend = <S extends keyof ComponentMap>(components: S[]) => {
		return new EntitySystem((this.components as (T | S)[]).concat(components))
	}

	createEntity = <S extends ComponentMap[T]>(
		components: S[],
	): Entity<S["key"]> => {
		const id = this.allocId()

		for (const component of components) {
			const map: Map<EntityId, S> = (this.arena as any)[component.key]
			map.set(id, component)
		}

		this.entities.push(id)

		return this.buildEntity(id) as Entity<S["key"]>
	}

	registerSystem = <S extends T>(system: System<S>) => {
		this.systems.push((system as any) as System<T>)
	}

	ref = <S extends T>(entity: Entity<S>): EntityReference<ComponentMap[S]> => {
		return keys(entity).reduce<EntityReference<ComponentMap[S]>>(
			(acc: EntityReference<ComponentMap[S]>, key) => {
				if (key == "id") {
					acc[entityId] = entity.id
					return acc
				}
				acc[key] = entity[key]
				return acc
			},
			{} as EntityReference<ComponentMap[S]>,
		)
	}

	update = (inputs: Inputs, dt: number) => {
		for (const system of this.systems) {
			for (const entity of this.entities) {
				const hadAll = system.components.reduce(
					(hasAll, component) =>
						hasAll && (this.arena[component] as Map<EntityId, any>).has(entity),
					true,
				)
				if (hadAll)
					system.handler(this.buildEntity(entity), {
						inputs,
						dt,
						ref: this.ref as any,
						queryByComponents: this.queryByComponents,
					})
			}
		}
	}

	buildEntity = (id: EntityId): Entity<T> => {
		const entity = { id } as Entity<T>
		for (const component of this.components) {
			;(entity as any)[component] = ((this.arena as any)[component] as Map<
				EntityId,
				T
			>).get(id)
		}
		return entity
	}

	queryByComponents = <S extends T>(
		components: S[],
	): EntityReference<ComponentMap[S]>[] => {
		const result = this.entities
			.map(id => {
				const x = components
					.map(key => (this.arena[key] as Map<EntityId, Components>).has(id))
					.filter(x => x)
				if (x.length == components.length) {
					return this.ref(this.buildEntity(id))
				}
				return
			})
			.filter(x => x)

		return result as EntityReference<ComponentMap[S]>[]
	}
}
