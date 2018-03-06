import { Vec2, add, dot, normalize, perpendicular, rotate, sub } from "./misc"

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
		const x = rotate([a.width / 2, 0], a.rotation)
		const y = rotate([0, a.height / 2], a.rotation)
		const edges: [Vec2, Vec2, Vec2, Vec2] = [
			add(add(center, x), y),
			add(sub(center, x), y),
			sub(sub(center, x), y),
			sub(add(center, x), y),
		]
		return edges
	}
}

const getAxes = (a: Shape): Vec2[] =>
	a.map((edge, i, edges) =>
		normalize(perpendicular(sub(edges[(i + 1) % edges.length], edge))),
	)

const project = (a: Shape, axis: Vec2): Vec2 => {
	let min = dot(axis, a[0])
	let max = min
	for (let i = 1; i < a.length; i++) {
		const p = dot(axis, a[i])
		if (p < min) {
			min = p
		} else if (p > max) {
			max = p
		}
	}
	return [min, max]
}

const overlaps = ([x0, y0]: Vec2, [x1, y1]: Vec2): boolean =>
	Math.max(x0, y0) > Math.min(x1, y1) || Math.min(x0, y0) > Math.max(x1, y1)

const getOverlap = ([x0, y0]: Vec2, [x1, y1]: Vec2): number => {
	const amin = Math.min(x0, y0)
	const amax = Math.max(x0, y0)
	const bmin = Math.min(x1, y1)
	const bmax = Math.max(x1, y1)
	return amax < bmax ? amax - bmin : bmax - amin
}

// Note(oeb25): Reference http://www.dyn4j.org/2010/01/sat/

export type SatResult = { direction: Vec2; t: number }

export const sat = (a: Shape, b: Shape): false | SatResult => {
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

	return { direction: smallest!, t: overlap }
}
