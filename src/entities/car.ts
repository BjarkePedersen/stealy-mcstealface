import { BoundingBox, UpdateContext } from "./entities"
import { EntityReference, ref } from "./entity-system"
import { Rectangle, getEdges } from "../intersections"
import {
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
} from "../misc"

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

export const update = (car: Car, ctx: UpdateContext) => {
	const TURN_SPEED = 0.3
	const TURN_DRAG = 0.99
	const ACCELERATION_SPEED = 0.2

	const face = dot(car.direction, normalize(car.velocity))

	const angle = dir(car.direction) + car.steering * TURN_SPEED * Math.sign(face)

	const wheels = polar(angle, 1)

	car.direction = normalize(
		lerp(car.direction, len(car.velocity) * TURN_SPEED, wheels),
	)
	const straight = Math.abs(face)
	car.velocity = add(
		scale(
			add(
				scale(car.velocity, TURN_DRAG * (1 - straight)),
				scale(
					car.direction,
					straight * len(car.velocity) * (face > 0 ? 1 : -1),
				),
			),
			0.99,
		),
		scale(wheels, car.acceleration * ACCELERATION_SPEED * ctx.dt),
	)
	car.position = add(car.position, car.velocity)

	// Note(oeb25): Do bounding box update and collision

	if (!car.boundingBox) {
		car.boundingBox = ref(ctx.createEntity("bounding-box", carBoundingBox(car)))
	} else {
		ctx.lookUpEntity(car.boundingBox).shape = carBoundingBox(car).shape
	}
	let result: ReturnType<typeof ctx.sat>
	if ((result = ctx.sat(ctx.lookUpEntity(car.boundingBox)))) {
		const d = dot(
			sub(car.position, result.boundingBox.center),
			scale(result.result.direction, result.result.t),
		)
		car.position = add(
			car.position,
			scale(result.result.direction, result.result.t * Math.sign(d)),
		)
		car.velocity = scale(car.velocity, 0.9)
		ctx.lookUpEntity(car.boundingBox).shape = carBoundingBox(car).shape
	}
	return
}
