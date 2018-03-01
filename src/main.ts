import * as assets from "./assets"

import {
	CarEntity,
	ControlableEntity,
	Entities,
	Entity,
	PlayerEntity,
	SpriteEntity,
	Tile,
	UpdateContext,
	WorldEntity,
	updateEntity,
} from "./entities"
import { add, mul, sub, unit } from "./misc"

import { Inputs } from "./inputs"

const canvas =
	document.querySelector("canvas") || document.createElement("canvas")
const ctx = canvas.getContext("2d")!
document.body.appendChild(canvas)

const gridSize = 32
const width = window.innerWidth
const height = window.innerHeight

canvas.width = width
canvas.height = height

if (window.devicePixelRatio > 1) {
	var canvasWidth = canvas.width
	var canvasHeight = canvas.height

	canvas.width = canvasWidth * window.devicePixelRatio
	canvas.height = canvasHeight * window.devicePixelRatio
	canvas.style.width = `${canvasWidth}px`
	canvas.style.height = `${canvasHeight}px`

	ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
}

const setTile = (tile: Tile, array: Tile[][], x: number, y: number) => {
	if (!array[x]) {
		array[x] = []
	}
	array[x][y] = tile
}

const grassEverywhere = (gridArray: Tile[][]) => {
	for (let x = 0; x < width / gridSize; x++) {
		for (let y = 0; y < height / gridSize; y++) {
			setTile({ tileType: "grass" }, gridArray, x, y)
		}
	}
}

const main = async () => {
	const images = await assets.assets
	const juices = assets.createAtlas(images.juice, 20, 20)

	const inputs = new Inputs(window.document.body)
	const entities = new Entities()

	const playerImage: SpriteEntity = {
		id: entities.allocId(),
		entityType: "sprite-entity",
		image: "juice",
	}
	entities.registerEntity(playerImage)

	const playerEntity: ControlableEntity = {
		id: entities.allocId(),
		entityType: "controlable-entity",
		speed: 10,
		child: playerImage.id,
		position: [2, 2],
	}
	entities.registerEntity(playerEntity)

	const car1: CarEntity = {
		id: entities.allocId(),
		entityType: "car-entity",
		child: playerImage.id,
		acceleration: 0,
		direction: 0,
		velocity: [0.01, 0],
		position: [2, 2],
	}
	entities.registerEntity(car1)

	const car2: CarEntity = {
		id: entities.allocId(),
		entityType: "car-entity",
		child: playerImage.id,
		acceleration: 0,
		direction: 0,
		velocity: [0.01, 0],
		position: [10, 14],
	}
	entities.registerEntity(car2)

	const player: PlayerEntity = {
		id: entities.allocId(),
		entityType: "player-entity",
		child: playerEntity.id,
		vehiecle: void 0,
	}
	entities.registerEntity(player)

	const world: WorldEntity = {
		id: entities.allocId(),
		idToFollow: player.id,
		entityType: "world",
		gridArray: [],
		children: [car1.id, car2.id, player.id],
		camera: [0, 0],
	}
	entities.registerEntity(world)

	grassEverywhere(world.gridArray)

	for (let x of new Array(50).fill(0).map((_, i) => i)) {
		for (let y of new Array(7).fill(0).map((_, i) => i)) {
			setTile({ tileType: "concrete" }, world.gridArray, x + 1, 5 + y)
		}
	}
	for (let x of new Array(50).fill(0).map((_, i) => i)) {
		for (let y of new Array(5).fill(0).map((_, i) => i)) {
			if (!(y == 2 && (x % 5 == 1 || x % 5 == 2)))
				setTile({ tileType: "asphalt" }, world.gridArray, x + 1, 6 + y)
		}
	}

	const drawEntity = (entity: Entity, dt: number, offset: [number, number]) => {
		switch (entity.entityType) {
			case "world": {
				entity.gridArray.forEach((n, x) => {
					n.forEach((tile, y) => {
						if (tile.tileType == "grass") {
							ctx.fillStyle = "#7ad155"
						}
						if (tile.tileType == "concrete") {
							ctx.fillStyle = "#b5b5b5"
						}
						if (tile.tileType == "asphalt") {
							ctx.fillStyle = "#494949"
						}

						ctx.fillRect(
							((x - offset[0] - entity.camera[0] + width / (2 * gridSize)) *
								gridSize) |
								0,
							((y - offset[1] - entity.camera[1] + height / (2 * gridSize)) *
								gridSize) |
								0,
							gridSize,
							gridSize,
						)
					})
				})
				for (const child of entity.children) {
					drawEntity(entities.lookUpEntity(child)!, dt, [
						offset[0] - entity.camera[0] + width / (2 * gridSize),
						offset[1] - entity.camera[1] + height / (2 * gridSize),
					])
				}
				return
			}
			case "controlable-entity": {
				drawEntity(
					entities.lookUpEntity(entity.child)!,
					dt,
					add(offset, entity.position),
				)
				return
			}
			case "player-entity": {
				if (entity.vehiecle) {
					return
				}

				drawEntity(entities.lookUpEntity(entity.child)!, dt, offset)
			}
			case "sprite-entity": {
				assets.drawFromIndex(juices, Math.floor((dt / 100) % 20))(
					ctx,
					(offset[0] - 0.5) * gridSize,
					(offset[1] - 0.5) * gridSize,
					gridSize,
					gridSize,
				)
				return
			}
			case "car-entity": {
				ctx.beginPath()
				ctx.fillStyle = "red"
				ctx.arc(
					(entity.position[0] + offset[0]) * gridSize,
					(entity.position[1] + offset[1]) * gridSize,
					gridSize / 2,
					0,
					Math.PI * 2,
				)
				ctx.moveTo(
					(entity.position[0] + offset[0]) * gridSize,
					(entity.position[1] + offset[1]) * gridSize,
				)
				ctx.lineTo(
					(entity.position[0] + offset[0] + unit(entity.velocity)[0] * 2) *
						gridSize,
					(entity.position[1] + offset[1] + unit(entity.velocity)[1] * 2) *
						gridSize,
				)
				ctx.stroke()
				ctx.fill()
				return
			}
		}
	}

	const updateCtx: UpdateContext = {
		dt: 0,
		inputs,
		lookUpEntity: entities.lookUpEntity,
		entitiesWithType: entities.entitiesWithType,
	}

	const first = Date.now()
	let last = first
	const loop = () => {
		const now = Date.now()
		const t = now - first
		const dt = (now - last) / 1000
		last = now

		updateCtx.dt = dt

		for (const entity of entities.entities) {
			updateEntity(entity, updateCtx)
		}

		ctx.fillStyle = "#f4f4f4"
		ctx.fillRect(0, 0, width, height)

		drawEntity(world, t, [0, 0])

		ctx.fillText(`${Math.floor(1 / dt)}fps`, 10, 20)

		inputs.step()
		requestAnimationFrame(loop)
	}

	loop()
}

main()
