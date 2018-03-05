import { Vec2, add, dot, mul, perpendicular, rotate, sub } from "./misc"

export interface Rectangle {
	x: number
	y: number
	rotation: number
	width: number
	height: number
}

export type Shape = Vec2[]

export const getEdges = (a: Rectangle): Vec2[] => {
	if (true) {
		// Rectangle
		const center: Vec2 = [a.x, a.y]
		const m = rotate([a.width / 2, a.height / 2], a.rotation)
		const edges: [Vec2, Vec2, Vec2, Vec2] = [
			sub(center, m),
			add(center, mul(m, [1, -1])),
			add(center, mul(m, [-1, 1])),
			add(center, m),
		]
		return edges
	}
}

const getAxes = (a: Shape): Vec2[] =>
	a.map((edge, i, edges) =>
		perpendicular(sub(edge, edges[(i + 1) % edges.length])),
	)

const project = (a: Shape, axis: Vec2): Vec2 => {
	let min = dot(axis, a[0])
	let max = min
	for (const vert of a) {
		const p = dot(axis, vert)
		if (p < min) {
			min = p
		} else if (p > max) {
			max = p
		}
	}
	return [min, max]
}

const overlaps = ([x0, y0]: Vec2, [x1, y1]: Vec2): boolean =>
	Math.max(x0, y0) <= Math.min(x1, y1)

const getOverlap = ([x0, y0]: Vec2, [x1, y1]: Vec2): number => {
	const amin = Math.min(x0, y0)
	const amax = Math.max(x0, y0)
	const bmin = Math.min(x1, y1)
	const bmax = Math.max(x1, y1)
	return amax < bmax ? amax - bmin : bmax - amin
}

export const sat = (a: Shape, b: Shape) => {
	let overlap = Infinity
	let smallest: Vec2 | null = null

	const axes = getAxes(a).concat(getAxes(b))

	for (const axis of axes) {
		const p1 = project(a, axis)
		const p2 = project(b, axis)

		if (!overlaps(p1, p2)) {
			return false
		} else {
			const o = getOverlap(p1, p2)
			if (o < overlap) {
				overlap = o
				smallest = axis
			}
		}
	}

	return [smallest, overlap]
}
