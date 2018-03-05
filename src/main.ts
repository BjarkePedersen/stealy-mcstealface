import * as OBJLoader from "three-obj-loader"
import * as THREE from "three"
import * as scene1 from "./scenes/scene1"

import { Entities, UpdateContext, updateEntity } from "./entities"

import { Inputs } from "./inputs"
import { renderEntity } from "./renderer-3d"

OBJLoader(THREE)

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

const material = new THREE.MeshPhongMaterial({
	color: 0xffffff,
	specular: 0xffffff,
	shininess: 20,
	morphTargets: true,
	vertexColors: THREE.FaceColors,
	flatShading: true,
})

const testMaterial = new THREE.MeshStandardMaterial({
	color: 0xfafafa,
	metalness: 0,
	roughness: .2,
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

const main = async () => {
	const inputs = new Inputs(window.document.body)
	const entities = new Entities()
	const loadingManager = new THREE.LoadingManager()

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

	const { world, models } = await scene1.build(
		entities,
		renderer3d.camera,
		loadObj,
		material,
	)

	models.forEach(model => {
		model.castShadow = true
		model.receiveShadow = true
		scene.add(model)
	})

	renderer3d.renderer.gammaInput = true
	renderer3d.renderer.gammaOutput = true
	renderer3d.renderer.shadowMap.enabled = true

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
		// const t = now - first
		const dt = (now - last) / 1000
		last = now

		updateCtx.dt = dt

		for (const entity of entities.entities) {
			updateEntity(entity, updateCtx)
		}

		renderEntity(world, entities, [0, 0])
		renderer3d.renderer.render(scene, renderer3d.camera)

		inputs.step()
		requestAnimationFrame(loop)
	}

	loop()
}

main()
