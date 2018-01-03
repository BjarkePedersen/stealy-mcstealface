import * as juice from "./juice.png"

import { keys } from "../misc"

export const sources = { juice }

export const assets = Promise.all(
	keys(sources).map(
		name =>
			new Promise<{ img: HTMLImageElement; name: keyof typeof sources }>(
				(res, rej) => {
					const img = new Image()
					img.src = sources[name]
					img.onload = () => res({ img, name })
				}
			)
	)
).then(a =>
	a.reduce((acc, { img, name }) => ({ ...acc, [name]: img }), {} as Record<
		keyof typeof sources,
		HTMLImageElement
	>)
)

interface Atlas {
	src: HTMLImageElement
	width: number
	height: number
}

const createAtlas = (
	image: HTMLImageElement,
	width: number,
	height: number
): Atlas => {
	throw "unimplemented"
}

const drawFromIndex = (atlas: Atlas, index: number) => (
	ctx: CanvasRenderingContext2D,
	dx: number,
	dy: number,
	dw: number,
	dh: number
) => {
	const sx = ctx.drawImage
}

assets.then(wow => console.log({ wow }))
