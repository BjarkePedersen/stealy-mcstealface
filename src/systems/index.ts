import { Entity, EntityReference } from "../entities/next"

import { ComponentMap } from "../components"
import { Inputs } from "../inputs"

interface SystemContext<T extends keyof ComponentMap> {
	inputs: Inputs
	dt: number
	ref: <S extends T>(entity: Entity<S>) => EntityReference<ComponentMap[S]>
	queryByComponents: <S extends T>(
		components: S[],
	) => EntityReference<ComponentMap[S]>[]
}

export class System<
	T extends C,
	C extends keyof ComponentMap = keyof ComponentMap
> {
	components: T[]
	handler: (entity: Entity<T>, context: SystemContext<C>) => Promise<void>

	constructor(
		components: T[],
		handler: (entity: Entity<T>, context: SystemContext<C>) => Promise<void>,
	) {
		this.components = components
		this.handler = handler
	}
}
