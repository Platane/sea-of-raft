import { mat4 } from "gl-matrix";
import { createWorldRenderer } from "./worldRenderer";
import { getSpriteSheet } from "./worldRenderer/sprites";

// import "./scripts/generateTileSet";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;

const renderer = createWorldRenderer(canvas, {
	spriteSheet: await getSpriteSheet(),
});

mat4.lookAt(renderer.viewMatrix, [1, 5, 10], [0, 0, 0], [0, 1, 0]);

window.onresize = () =>
	renderer.resize(
		window.innerWidth,
		window.innerHeight,
		Math.min(window.devicePixelRatio ?? 1, 2),
	);
(window as any).onresize();

let t = 0;

const state = {
	nodes: [
		{ dead: false, hat: false, mailbox: [] },
		{ dead: false, hat: false, mailbox: [] },
		{ dead: false, hat: false, mailbox: [] },
		{ dead: false, hat: false, mailbox: [] },
		{ dead: false, hat: false, mailbox: [] },
		{ dead: false, hat: false, mailbox: [] },
		{ dead: false, hat: true, mailbox: [] },
		{ dead: true, hat: true, mailbox: [] },
	],
	inbound: Array.from({ length: 100 }).map((_, i, { length }) => ({
		sender: 0,
		receiver: 1,
		message: 0,
		k: i / (length - 1),
	})),
};

const loop = () => {
	t++;

	renderer.draw(state, t);

	requestAnimationFrame(loop);
};
loop();
