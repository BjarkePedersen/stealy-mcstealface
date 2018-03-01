import { keys } from "./misc"

const KEY_MAP = {
	ENTER: 13,
	W: 87,
	A: 65,
	S: 83,
	D: 68,
}

const KEYS = keys(KEY_MAP)

const REGISTERED_KEYS = KEYS.reduce(
	(acc, key) => {
		acc[KEY_MAP[key]] = key
		return acc
	},
	{} as { [e: number]: keyof typeof KEY_MAP },
)

export class Inputs {
	map = KEYS.reduce(
		(acc, key) => {
			acc[key] = 0
			return acc
		},
		{} as typeof KEY_MAP,
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
		KEYS.forEach(key => {
			this.map[key] = 0
		})
	}

	isDown = (key: keyof typeof KEY_MAP) => this.map[key] != 0
	upDown = (key: keyof typeof KEY_MAP) => this.map[key] == 0
	wasPressed = (key: keyof typeof KEY_MAP) =>
		this.map[key] == 1 || this.map[key] == -1

	step() {
		KEYS.forEach(key => {
			this.map[key] = this.map[key] > 0 ? this.map[key] + 1 : 0
		})
	}
}
