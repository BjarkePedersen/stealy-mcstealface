import * as THREE from "three"
import * as assets from "./assets"

import {
	Entities,
	Entity,
	Tile,
	UpdateContext,
	ref,
	updateEntity,
} from "./entities"
import { add, unit } from "./misc"

import { Inputs } from "./inputs"
import { renderEntity } from "./renderer-3d"

const gridSize = 32
const width = window.innerWidth
const height = window.innerHeight

const createRenderer2d = () => {
	const canvas =
		document.querySelector("canvas") || document.createElement("canvas")
	const ctx = canvas.getContext("2d")!
	document.body.appendChild(canvas)

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

	return { canvas, ctx }
}

const createRenderer3d = () => {
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		1,
		5000,
	)

	const renderer = new THREE.WebGLRenderer()
	// renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	return { renderer, camera }
}

const renderer3d = createRenderer3d()

const scene = new THREE.Scene()
scene.background = new THREE.Color().setHSL(0.6, 0, 1)
scene.fog = new THREE.Fog(scene.background, 1, 5000)

const geometry = new THREE.BoxGeometry(2, 1, 1)
const material = new THREE.MeshPhongMaterial({
	color: 0xffffff,
	specular: 0xffffff,
	shininess: 20,
	morphTargets: true,
	vertexColors: THREE.FaceColors,
	flatShading: true,
})
// LIGHTS
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6)
{
	hemiLight.color.setHSL(0.6, 1, 0.6)
	hemiLight.groundColor.setHSL(0.095, 1, 0.75)
	hemiLight.position.set(0, 50, 0)
	scene.add(hemiLight)

	const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10)
	scene.add(hemiLightHelper)

	//

	const dirLight = new THREE.DirectionalLight(0xffffff, 1)
	dirLight.color.setHSL(0.1, 1, 0.95)
	dirLight.position.set(-1, 1.75, 1)
	dirLight.position.multiplyScalar(30)
	scene.add(dirLight)

	dirLight.castShadow = true

	dirLight.shadow.mapSize.width = 2048
	dirLight.shadow.mapSize.height = 2048

	var d = 50

	dirLight.shadow.camera.left = -d
	dirLight.shadow.camera.right = d
	dirLight.shadow.camera.top = d
	dirLight.shadow.camera.bottom = -d

	dirLight.shadow.camera.far = 3500
	dirLight.shadow.bias = -0.0001

	const dirLightHeper = new THREE.DirectionalLightHelper(dirLight, 10)
	scene.add(dirLightHeper)
}

// GROUND
{
	const groundGeo = new THREE.PlaneBufferGeometry(10000, 10000)
	const groundMat = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		specular: 0x050505,
	})
	groundMat.color.setHSL(0.095, 1, 0.75)

	const ground = new THREE.Mesh(groundGeo, groundMat)
	// ground.rotation.x = -Math.PI / 2
	ground.position.z = -0.7
	scene.add(ground)

	ground.receiveShadow = true
}

// SKYDOME
{
	const vertexShader = document.getElementById("vertexShader")!.textContent!
	const fragmentShader = document.getElementById("fragmentShader")!.textContent!
	const uniforms = {
		topColor: { value: new THREE.Color(0x0077ff) },
		bottomColor: { value: new THREE.Color(0xffffff) },
		offset: { value: 33 },
		exponent: { value: 0.6 },
	}
	uniforms.topColor.value.copy(hemiLight.color)

	scene.fog.color.copy(uniforms.bottomColor.value)

	const skyGeo = new THREE.SphereGeometry(4000, 32, 15)
	const skyMat = new THREE.ShaderMaterial({
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		uniforms: uniforms,
		side: THREE.BackSide,
	})

	const sky = new THREE.Mesh(skyGeo, skyMat)
	scene.add(sky)
}

renderer3d.camera.position.z = 10
renderer3d.camera.rotation.x = 0.7
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

	const playerImage = entities.createEntity("sprite-entity", {
		model: new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 0.5, 1, 100),
			material,
		),
		image: "juice",
	})
	playerImage.inner.model.rotation.x = Math.PI / 2

	const playerEntity = entities.createEntity("controlable-entity", {
		speed: 10,
		child: ref(playerImage),
		position: [2, 2],
	})

	const car1 = entities.createEntity("car-entity", {
		model: new THREE.Mesh(geometry, material),
		acceleration: 0,
		steering: 0,
		direction: [1, 0],
		velocity: [0.01, 0],
		position: [2, 2],
	})

	const car2 = entities.createEntity("car-entity", {
		model: new THREE.Mesh(geometry, material),
		acceleration: 0,
		steering: 0,
		direction: [1, 0],
		velocity: [0.01, 0],
		position: [10, 14],
	})

	const car3 = entities.createEntity("car-entity", {
		model: new THREE.Mesh(geometry, material),
		acceleration: 0,
		steering: 0,
		direction: [1, 0],
		velocity: [0.01, -0.01],
		position: [-5, 12],
	})

	const player = entities.createEntity("player-entity", {
		state: {
			name: "initial",
			child: ref(playerEntity),
		},
	})

	const world = entities.createEntity("world", {
		idToFollow: ref(player),
		cameraObject: renderer3d.camera,
		gridArray: [],
		children: [ref(car1), ref(car2), ref(car3), ref(player)],
		camera: [0, 0],
	})
	;[
		car1.inner.model,
		car2.inner.model,
		car3.inner.model,
		playerImage.inner.model,
	].forEach(model => {
		model.castShadow = true
		model.receiveShadow = true
		scene.add(model)
	})

	renderer3d.renderer.gammaInput = true
	renderer3d.renderer.gammaOutput = true
	renderer3d.renderer.shadowMap.enabled = true

	grassEverywhere(world.inner.gridArray)

	for (let x of new Array(50).fill(0).map((_, i) => i)) {
		for (let y of new Array(7).fill(0).map((_, i) => i)) {
			setTile({ tileType: "concrete" }, world.inner.gridArray, x + 1, 5 + y)
		}
	}
	for (let x of new Array(50).fill(0).map((_, i) => i)) {
		for (let y of new Array(5).fill(0).map((_, i) => i)) {
			if (!(y == 2 && (x % 5 == 1 || x % 5 == 2)))
				setTile({ tileType: "asphalt" }, world.inner.gridArray, x + 1, 6 + y)
		}
	}

	let renderer2d: ReturnType<typeof createRenderer2d>

	const drawEntity = (entity: Entity, dt: number, offset: [number, number]) => {
		if (!renderer2d) renderer2d = createRenderer2d()
		const { ctx } = renderer2d
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
					drawEntity(entities.lookUpEntity(child), dt, [
						offset[0] - entity.camera[0] + width / (2 * gridSize),
						offset[1] - entity.camera[1] + height / (2 * gridSize),
					])
				}
				return
			}
			case "controlable-entity": {
				drawEntity(
					entities.lookUpEntity(entity.child),
					dt,
					add(offset, entity.position),
				)
				return
			}
			case "player-entity": {
				if (entity.state.name == "in-car") {
					const child = entities.lookUpEntity(entity.state.child)

					const sprite = entities.lookUpEntity(child.child)
					sprite.model.visible = false
					return
				}
				const child = entities.lookUpEntity(entity.state.child)
				const sprite = entities.lookUpEntity(child.child)
				sprite.model.visible = true

				drawEntity(entities.lookUpEntity(entity.state.child), dt, offset)
				return
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
			updateEntity(entity.inner, updateCtx)
		}

		// ctx.fillStyle = "#f4f4f4"
		// ctx.fillRect(0, 0, width, height)

		renderEntity(world.inner, entities, [0, 0])
		renderer3d.renderer.render(scene, renderer3d.camera)

		// ctx.fillText(`${Math.floor(1 / dt)}fps`, 10, 20)

		inputs.step()
		requestAnimationFrame(loop)
	}

	loop()
}

main()
