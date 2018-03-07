import * as THREE from "three"

import {
	BoundingBox,
	InheritBoundingBoxFromRenderable,
	Position,
	Renderable,
} from "../components"
import { Rectangle, getEdges } from "../intersections"

import { System } from "."

export const InheritBoundingBoxSystem = new System(
	[
		InheritBoundingBoxFromRenderable.key,
		BoundingBox.key,
		Renderable.key,
		Position.key,
	],
	({ boundingbox, renderable, position }) => {
		const model = renderable.object
		model.position.x = position.position[0]
		model.position.y = -position.position[1]
		let min = new THREE.Vector3(Infinity, Infinity, Infinity)
		let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
		model.traverse(x => {
			if (x instanceof THREE.Mesh) {
				x.geometry.computeBoundingBox()
				min.min(x.geometry.boundingBox.min)
				max.max(x.geometry.boundingBox.max)
			}
		})
		const bb = max.sub(min)

		const rect: Rectangle = {
			x: position.position[0],
			y: position.position[1],
			width: bb.z,
			height: bb.y,
			rotation: 0,
		}

		boundingbox.shape = getEdges(rect)
		boundingbox.center = position.position
	},
)
