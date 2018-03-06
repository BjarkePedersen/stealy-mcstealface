import * as juice from "./juice.png"

import { keys } from "../misc"

export const sources = { juice }

export const assets = Promise.all(
	keys(sources).map(
		name =>
			new Promise<{ img: HTMLImageElement; name: keyof typeof sources }>(
				res => {
					const img = new Image()
					img.src = sources[name]
					img.onload = () => res({ img, name })
				},
			),
	),
).then(a =>
	a.reduce(
		(acc, { img, name }) => {
			acc[name] = img
			return acc
		},
		{} as Record<keyof typeof sources, HTMLImageElement>,
	),
)

export interface Atlas {
	image: HTMLImageElement
	width: number
	height: number
}

export const createAtlas = (
	image: HTMLImageElement,
	width: number,
	height: number,
): Atlas => ({ image, width, height })

const getCoordsForIndex = (
	atlas: Atlas,
	index: number,
): { x: number; y: number; w: number; h: number } => {
	const numX = Math.floor(atlas.image.width / atlas.width)
	const x = (index % numX) * atlas.width
	const y = Math.floor(index / numX) * atlas.height
	return { x, y, w: atlas.width, h: atlas.height }
}

export const drawFromIndex = (atlas: Atlas, index: number) => (
	ctx: CanvasRenderingContext2D,
	dx: number,
	dy: number,
	dw: number,
	dh: number,
) => {
	const { x, y, w, h } = getCoordsForIndex(atlas, index)
	ctx.drawImage(atlas.image, x, y, w, h, dx, dy, dw, dh)
}
