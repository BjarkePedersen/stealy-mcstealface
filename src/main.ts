import "./entities/next"

import * as OBJLoader from "three-obj-loader"
import * as THREE from "three"
import * as scene2 from "./scenes/scene2"

import { Inputs } from "./inputs"
import { Renderable } from "./components"

OBJLoader(THREE)

localStorage.setItem("latest", Date.now().toString())

const createRenderer3d = () => {
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		1,
		5000,
	)

	const renderer = new THREE.WebGLRenderer({
		canvas:
			(document.querySelector("#gameCanvas") as HTMLCanvasElement) || void 0,
	})

	renderer.gammaInput = true
	renderer.gammaOutput = true
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.domElement.id = "gameCanvas"
	document.body.appendChild(renderer.domElement)

	return { renderer, camera }
}

const renderer3d = createRenderer3d()

const scene = new THREE.Scene()
scene.background = new THREE.Color().setHSL(0.6, 0, 1)
scene.fog = new THREE.Fog(scene.background, 1, 5000)

renderer3d.renderer.shadowMap.type = THREE.PCFSoftShadowMap

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

	//Set up shadow properties for the light
	dirLight.shadow.mapSize.width = 4096
	dirLight.shadow.mapSize.height = 4096
	dirLight.shadow.bias = -0.00001
	dirLight.shadow.radius = 1

	var d = 50

	dirLight.shadow.camera.left = -d
	dirLight.shadow.camera.right = d
	dirLight.shadow.camera.top = d
	dirLight.shadow.camera.bottom = -d

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
	ground.position.z = 0
	scene.add(ground)

	ground.receiveShadow = true
}

// SKYDOME
// {
// 	const vertexShader = document.getElementById("vertexShader")!.textContent!
// 	const fragmentShader = document.getElementById("fragmentShader")!.textContent!
// 	const uniforms = {
// 		topColor: { value: new THREE.Color(0x0077ff) },
// 		bottomColor: { value: new THREE.Color(0xffffff) },
// 		offset: { value: 33 },
// 		exponent: { value: 0.6 },
// 	}
// 	uniforms.topColor.value.copy(hemiLight.color)

// 	scene.fog.color.copy(uniforms.bottomColor.value)

// 	const skyGeo = new THREE.SphereGeometry(4000, 32, 15)
// 	const skyMat = new THREE.ShaderMaterial({
// 		vertexShader: vertexShader,
// 		fragmentShader: fragmentShader,
// 		uniforms: uniforms,
// 		side: THREE.BackSide,
// 	})

// 	const sky = new THREE.Mesh(skyGeo, skyMat)
// 	scene.add(sky)
// }

renderer3d.camera.position.z = 10
renderer3d.camera.rotation.x = 0.7

const main = async () => {
	const gameId = localStorage.getItem("latest")
	const inputs = new Inputs(window.document.body)
	const loadingManager = new THREE.LoadingManager()

	const debugCanvas = (document.querySelector("#debugCanvas") ||
		document.createElement("canvas")) as HTMLCanvasElement
	debugCanvas.id = "debugCanvas"
	const ctx = debugCanvas.getContext("2d")!
	document.body.appendChild(debugCanvas)
	debugCanvas.style.position = "fixed"
	debugCanvas.style.top = "0"
	debugCanvas.style.left = "0"
	debugCanvas.width = 500
	debugCanvas.height = 500
	debugCanvas.style.width = "500px"
	debugCanvas.style.height = "500px"

	ctx.fillRect(10, 10, 10, 10)

	const loader = new THREE.OBJLoader(loadingManager)
	const loadObj = async (path: string) =>
		new Promise<THREE.Group>(res =>
			loader.load(path, group => {
				const g = new THREE.Group()
				group.rotation.x = group.rotation.y = Math.PI / 2
				group.traverse(x => {
					x.castShadow = true
					x.receiveShadow = true
				})
				g.add(group)
				res(g)
			}),
		)

	const cubeMapLoader = new THREE.CubeTextureLoader(loadingManager)
	const loadCubeMap = async (files: string[]) =>
		new Promise<THREE.CubeTexture>(res =>
			cubeMapLoader.load(files, texture => res(texture)),
		)

	const system = await scene2.build({
		loadObj,
		loadCubeMap,
		camera: renderer3d.camera,
		scene,
	})

	system.queryByComponents([Renderable.key]).map(async ({ renderable }) => {
		const model = await renderable.getObject()
		model.castShadow = true
		model.receiveShadow = true
		scene.add(model)
	})

	renderer3d.renderer.gammaInput = true
	renderer3d.renderer.gammaOutput = true
	renderer3d.renderer.shadowMap.enabled = true

	const first = Date.now()
	let last = first
	const loop = () => {
		const now = Date.now()
		// const t = now - first
		const dt = (now - last) / 1000
		last = now

		system.update(inputs, dt)

		renderer3d.renderer.render(scene, renderer3d.camera)

		inputs.step()
		if (localStorage.getItem("latest") == gameId) requestAnimationFrame(loop)
	}

	loop()
}

main()
