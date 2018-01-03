

const canvas = document.querySelector("canvas") || document.createElement("canvas")
const ctx = canvas.getContext("2d")
document.body.appendChild(canvas)


const gridSize = 32
const width = 500
const height = 500

canvas.width = width
canvas.height = height

interface GrassBlock {
	blockType: "grass"
}

interface ConcreteBlock {
	blockType: "concrete"
}

interface AsphaltBlock {
	blockType: "asphalt"
}

type Block = GrassBlock | ConcreteBlock | AsphaltBlock

const gridArray: Block[][] = []

const setBlock = (block: Block, array: Block[][], x: number, y: number) => {
	if (!array[x]) {
		array[x] = []
	}
	array[x][y] = block
}


const grassEverywhere = () => {
	for (let x = 0; x < width / gridSize; x++) {
		for (let y = 0; y < height / gridSize; y++) {
			setBlock({ blockType: "grass" }, gridArray, x, y)
		}
	}
}

grassEverywhere()
setBlock({ blockType: "concrete" }, gridArray, 5, 5)
setBlock({ blockType: "asphalt" }, gridArray, 6, 4)

const loop = () => {

	// Background
	ctx.fillStyle = "#f4f4f4"
	ctx.fillRect(0, 0, width, height)

	ctx.fillStyle = "#000000"
	gridArray.map((n, x) => {
		n.map((block, y) => {

			if (block.blockType == "grass") { ctx.fillStyle = "#7ad155" }
			if (block.blockType == "concrete") { ctx.fillStyle = "#b5b5b5" }
			if (block.blockType == "asphalt") { ctx.fillStyle = "#494949" }

			ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize)
		})

	})



	requestAnimationFrame(loop)
}

loop()
