import { EntityReference, referenceToSame } from "../entities/next"

import { Object3D } from "three"
import { Shape } from "../intersections"
import { Vec2 } from "../misc"

export interface Component<K> {
	readonly key: K
}

export class Position implements Component<"position"> {
	static key = "position" as "position"
	readonly key = Position.key
	getPosition = async () => this.position
	setPosition = async (position: Vec2) => {
		this.position = position
	}
	position: Vec2 = [0, 0]
}

export class Velocity implements Component<"velocity"> {
	static key = "velocity" as "velocity"
	readonly key = Velocity.key
	getVelocity = async () => this.velocity
	setVelocity = async (velocity: Vec2) => {
		this.velocity = velocity
	}
	velocity: Vec2 = [0, 0]
}

export class Passenger implements Component<"passenger"> {
	static key = "passenger" as "passenger"
	readonly key = Passenger.key
}

export class Steering implements Component<"steering"> {
	static key = "steering" as "steering"
	readonly key = Steering.key

	enter = async (passenger: NonNullable<Steering["passenger"]>) => {
		if (this.passenger) return false
		this.passenger = passenger
		return true
	}

	leave = async (passenger: NonNullable<Steering["passenger"]>) => {
		if (this.passenger && referenceToSame(this.passenger, passenger)) {
			this.passenger = void 0
			this.steering = 0
			this.gas = 0
			return true
		}
		return false
	}

	setGas = async (amount: number) => {
		this.gas = Math.max(-1, Math.min(1, amount))
	}

	steer = async (direction: number) => {
		this.steering = Math.max(-1, Math.min(1, direction))
	}

	getDirection = async () => this.direction

	steering = 0
	gas = 0
	direction: Vec2 = [1, 0]
	passenger?: EntityReference<Passenger>
}

export class BoundingBox implements Component<"boundingbox"> {
	static key = "boundingbox" as "boundingbox"
	readonly key = BoundingBox.key
	shape: Shape = []
	center: Vec2 = [0, 0]
}

export class Player implements Component<"player"> {
	static key = "player" as "player"
	readonly key = Player.key

	car?: EntityReference<Steering | Position | Velocity>
	child: EntityReference<Position | Velocity>

	getCar = async () => this.car
	getChild = async () => this.child

	enterCar = async (car: NonNullable<Player["car"]>) => {
		this.car = car
	}

	constructor(child: Player["child"]) {
		this.child = child
	}
}

export class Renderable implements Component<"renderable"> {
	static key = "renderable" as "renderable"
	readonly key = Renderable.key

	getObject = async () => this.object

	object: Object3D

	constructor(object: Object3D) {
		this.object = object
	}
}

export class Camera implements Component<"camera"> {
	static key = "camera" as "camera"
	readonly key = Camera.key

	camera: THREE.Camera
	track: EntityReference<Player>

	constructor(camera: THREE.Camera, track: EntityReference<Player>) {
		this.camera = camera
		this.track = track
	}
}

type x<T extends { key: string }> = { [K in T["key"]]: T }

export type ComponentMap = x<Position> &
	x<Velocity> &
	x<BoundingBox> &
	x<Steering> &
	x<Player> &
	x<Passenger> &
	x<Renderable> &
	x<Camera>
export type Components = ComponentMap[keyof ComponentMap]
