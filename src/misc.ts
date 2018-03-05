export const keys = <T>(a: T) => Object.keys(a) as (keyof T)[]
export const values = <T>(a: T) =>
	(Object.keys(a) as (keyof T)[]).map(key => a[key])

export type Vec2 = [number, number]

export const add = ([x0, y0]: Vec2, [x1, y1]: Vec2): Vec2 => [x0 + x1, y0 + y1]
export const sub = ([x0, y0]: Vec2, [x1, y1]: Vec2): Vec2 => [x0 - x1, y0 - y1]
export const scale = ([x0, y0]: Vec2, s: number): Vec2 => [x0 * s, y0 * s]
export const mul = ([x0, y0]: Vec2, [x1, y1]: Vec2): Vec2 => [x0 * x1, y0 * y1]
export const lerp = ([x0, y0]: Vec2, t: number, [x1, y1]: Vec2): Vec2 => [
	x0 + t * (x1 - x0),
	y0 + t * (y1 - y0),
]
export const len = ([x, y]: Vec2): number => Math.sqrt(x * x + y * y)
export const abs = ([x, y]: Vec2): Vec2 => [Math.abs(x), Math.abs(y)]
export const normalize = (a: Vec2): Vec2 => scale(a, 1 / len(a))
export const unit = (a: Vec2): Vec2 => scale(a, 1 / len(a))
export const setLen = (a: Vec2, length: number): Vec2 =>
	scale(a, length / len(a))
export const dot = ([x0, y0]: Vec2, [x1, y1]: Vec2): number => x0 * x1 + y0 * y1
export const dir = ([x, y]: Vec2): number => Math.atan2(y, x)
export const angle = (a: Vec2, b: Vec2): number =>
	Math.acos(dot(a, b) / (len(a) * len(b)))
export const polar = (radian: number, length: number): Vec2 => [
	Math.cos(radian) * length,
	Math.sin(radian) * length,
]
export const rotate = ([x, y]: Vec2, radian: number): Vec2 => {
	const cos = Math.cos(radian)
	const sin = Math.sin(radian)
	return [cos * x - sin * y, sin * x + cos * y]
}
export const perpendicular = ([x, y]: Vec2): Vec2 => [-y, x]
