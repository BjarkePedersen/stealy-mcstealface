// import { Vec2, add } from "../misc"

// import { Shape } from "../intersections"

// class Component {
// 	static key: string
// 	key: string = ""
// }

// class Position extends Component {
// 	static key = "position" as "position"
// 	key = Position.key
// 	position: Vec2 = [0, 0]
// }

// class Velocity extends Component {
// 	static key = "velocity" as "velocity"
// 	key = Velocity.key
// 	velocity: Vec2 = [0, 0]
// }

// class Steering extends Component {
// 	static key = "steering" as "steering"
// 	key = Steering.key

// 	steering = 0
// 	acceleration = 0
// 	direction: Vec2 = [1, 0]
// }

// class BoundingBox extends Component {
// 	static key = "boundingbox" as "boundingbox"
// 	readonly key = BoundingBox.key
// 	shape: Shape = []
// }

// type Components = typeof Position | typeof Velocity | typeof BoundingBox

// // Facade interface
// export interface EntityId {
// 	key: ["entity-id", number]
// }

// const entityId = Symbol("entity id")

// // Facade interface
// export interface EntityReference<T> {
// 	itsa: "reference"
// 	imposible: T
// 	[entityId]: EntityId
// }

// type Entity<T extends typeof Component> = { id: EntityId } & {
// 	[K in T["key"]]: T extends { key: K } ? InstanceType<T> : never
// }

// const createEntity = <S extends InstanceType<Components>>(
// 	components: S[],
// ): Entity<ComponentClass<S>> => {
// 	return extendEntity({} as any, components)
// }

// const extendEntity = <
// 	T extends InstanceType<Components>,
// 	S extends InstanceType<Components>
// >(
// 	entity: Entity<ComponentClass<T>>,
// 	components: S[],
// ): Entity<ComponentClass<T | S>> => {
// 	return components.reduce(
// 		(acc, component) => ({
// 			...(acc as any),
// 			[component.key]: component,
// 		}),
// 		entity,
// 	)
// }
// type ComponentClass<T> = T extends Position
// 	? typeof Position
// 	: T extends Velocity ? typeof Velocity : never

// type Arena<T extends typeof Component> = {
// 	[K in T["key"]]: T extends { key: K } ? Map<EntityId, InstanceType<T>> : never
// }

// class EntitySystem<T extends typeof Component> {
// 	components: T[]
// 	arena: Arena<T>
// 	systems: System<any>[] = []
// 	entities: EntityId[] = []

// 	private nextId = 0

// 	allocId = (): EntityId => {
// 		return (this.nextId++ as any) as EntityId
// 	}

// 	constructor(components: T[]) {
// 		this.components = components
// 		this.arena = components.reduce(
// 			(acc, compoent) => ({ ...acc, [compoent.key]: new Map() }),
// 			{},
// 		) as Arena<T>
// 	}

// 	extend = <S extends Components>(components: S[]) => {
// 		return new EntitySystem((this.components as (T | S)[]).concat(components))
// 	}

// 	createEntity = <S extends InstanceType<T>>(components: S[]) => {
// 		const id = this.allocId()

// 		for (const component of components) {
// 			const map: Map<EntityId, S> = (this.arena as any)[component.key]
// 			map.set(id, component)
// 		}

// 		this.entities.push(id)

// 		return id
// 	}

// 	registerSystem = <S extends T>(system: System<S>) => {
// 		this.systems.push(system)
// 	}

// 	update = () => {
// 		for (const system of this.systems) {
// 			for (const entity of this.entities) {
// 				const hadAll = system.components.reduce(
// 					(hasAll, component) =>
// 						hasAll && this.arena[component.key as T["key"]].has(entity),
// 					true,
// 				)
// 				if (hadAll) system.handler(this.buildEntity(entity, system.components))
// 			}
// 		}
// 	}

// 	buildEntity = <S extends T>(id: EntityId, components: S[]) => {
// 		const entity = { id } as Entity<S>
// 		for (const component of components) {
// 			;(entity as any)[component.key] = ((this.arena as any)[
// 				component.key
// 			] as Map<EntityId, S>).get(id)
// 		}
// 		return entity
// 	}
// }

// class System<T extends typeof Component> {
// 	components: T[]
// 	handler: (entity: Entity<T>) => void

// 	constructor(components: T[], handler: (entity: Entity<T>) => void) {
// 		this.components = components
// 		this.handler = handler
// 	}
// }

// const system = new EntitySystem([Velocity, Position, BoundingBox, Steering])
// const physicsSystem = new System(
// 	[Velocity, Position],
// 	({ position, velocity }) => {
// 		position.position = add(position.position, velocity.velocity)
// 	},
// )
// const carSystem = new System([Velocity, Position, Steering], car => {
// 	const TURN_SPEED = 0.3
// 	const TURN_DRAG = 0.99
// 	const ACCELERATION_SPEED = 0.2

// 	const face = dot(car.direction, normalize(car.velocity))

// 	const angle = dir(car.direction) + car.steering * TURN_SPEED * Math.sign(face)

// 	const wheels = polar(angle, 1)

// 	car.direction = normalize(
// 		lerp(car.direction, len(car.velocity) * TURN_SPEED, wheels),
// 	)
// 	const straight = Math.abs(face)
// 	car.velocity = add(
// 		scale(
// 			add(
// 				scale(car.velocity, TURN_DRAG * (1 - straight)),
// 				scale(
// 					car.direction,
// 					straight * len(car.velocity) * (face > 0 ? 1 : -1),
// 				),
// 			),
// 			0.99,
// 		),
// 		scale(wheels, car.acceleration * ACCELERATION_SPEED * ctx.dt),
// 	)
// 	car.position = add(car.position, car.velocity)

// 	// Note(oeb25): Do bounding box update and collision

// 	if (!car.boundingBox) {
// 		car.boundingBox = ref(ctx.createEntity("bounding-box", carBoundingBox(car)))
// 	} else {
// 		ctx.lookUpEntity(car.boundingBox).shape = carBoundingBox(car).shape
// 	}
// 	let result: ReturnType<typeof ctx.sat>
// 	if ((result = ctx.sat(ctx.lookUpEntity(car.boundingBox)))) {
// 		const d = dot(
// 			sub(car.position, result.boundingBox.center),
// 			scale(result.result.direction, result.result.t),
// 		)
// 		car.position = add(
// 			car.position,
// 			scale(result.result.direction, result.result.t * Math.sign(d)),
// 		)
// 		car.velocity = scale(car.velocity, 0.9)
// 		ctx.lookUpEntity(car.boundingBox).shape = carBoundingBox(car).shape
// 	}
// 	return
// })

// system.registerSystem(physicsSystem)
// system.registerSystem(carSystem)

// const player = system.createEntity([new Position(), new Velocity()])
// const car = system.createEntity([
// 	new Position(),
// 	new Velocity(),
// 	new Steering(),
// 	new BoundingBox(),
// ])

// const c = system.buildEntity(car, system.components)

// system.update()
