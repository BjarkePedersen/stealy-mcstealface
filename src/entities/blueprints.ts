import * as THREE from "three"

import {
	BoundingBox,
	CollisionResponse,
	Position,
	Renderable,
	Steering,
	Velocity,
} from "../components"

const buildCarModel = async (ctx: {
	loadObj: (path: string) => Promise<THREE.Group>
	loadCubeMap: (files: string[]) => Promise<THREE.CubeTexture>
	envMap: THREE.CubeTexture
}) => {
	const dialectricParams = {
		metalness: 0.5,
		color: 0xed1c1c,
		clearCoat: 1, // Always keep on 1
		clearCoatRoughness: 0.01,
		reflectivity: 1.0, // Always keep on 1
		roughness: 0.4, // Always keep on 1
		envMap: ctx.envMap,
	}

	const carMaterial = new THREE.MeshPhysicalMaterial(dialectricParams)

	const carModel = await ctx.loadObj(
		await import("../assets/models/mazda787b.obj"),
	)
	carModel.receiveShadow = true
	carModel.castShadow = true
	let min = new THREE.Vector3(Infinity, Infinity, Infinity)
	let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
	carModel.traverse(x => {
		if (x instanceof THREE.Mesh) {
			x.material = carMaterial
			x.geometry.computeBoundingBox()
			min.min(x.geometry.boundingBox.min)
			max.max(x.geometry.boundingBox.max)
		}
	})
	const bb = max.sub(min)

	const carBB = new THREE.Mesh(
		new THREE.WireframeGeometry(new THREE.CubeGeometry(bb.z, bb.x, bb.y)),
		new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true,
		}),
	)

	const carContainer = new THREE.Group()
	carContainer.add(carModel, carBB)
	return carContainer
}

export const carBlueprint = async (ctx: {
	loadObj: (path: string) => Promise<THREE.Group>
	loadCubeMap: (files: string[]) => Promise<THREE.CubeTexture>
	envMap: THREE.CubeTexture
}) => [
	new Position(),
	new Velocity(),
	new Steering(),
	new BoundingBox(),
	new Renderable(await buildCarModel(ctx)),
	new CollisionResponse(),
]
