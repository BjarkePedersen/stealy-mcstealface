import { keys } from "./misc"

const KEYS = {
	W: 87,
	A: 65,
	S: 83,
	D: 68,
}

const KEYSL = keys(KEYS)

const REGISTERED_KEYS = KEYSL.reduce(
	(acc, key) => {
		acc[KEYS[key]] = key
		return acc
	},
	{} as { [e: number]: keyof typeof KEYS },
)

export class Inputs {
	map = KEYSL.reduce(
		(acc, key) => {
			acc[key] = 0
			return acc
		},
		{} as typeof KEYS,
	)

	constructor(element: HTMLElement) {
		element.addEventListener("keydown", this.listener(true))
		element.addEventListener("keyup", this.listener(false))
		element.addEventListener("blur", this.onBlur)
	}

	listener = (down: boolean) => (e: KeyboardEvent) => {
		const key = REGISTERED_KEYS[e.which]
		if (key && !e.repeat) {
			this.map[REGISTERED_KEYS[e.which]] = down
				? 1
				: this.map[REGISTERED_KEYS[e.which]] == 1 ? -1 : 0
		}
	}

	onBlur = () => {
		KEYSL.forEach(key => {
			this.map[key] = 0
		})
	}

	isDown = (key: keyof typeof KEYS) => this.map[key] != 0
	upDown = (key: keyof typeof KEYS) => this.map[key] == 0
	wasPressed = (key: keyof typeof KEYS) =>
		this.map[key] == 1 || this.map[key] == -1

	step() {
		KEYSL.forEach(key => {
			this.map[key] = this.map[key] > 0 ? this.map[key] + 1 : 0
		})
	}
}
