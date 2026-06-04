import { mat4, vec4 } from "gl-matrix";
import spriteFragmentShaderCode from "./sprite/shader.frag" with {
	type: "text",
};
import spriteVertexShaderCode from "./sprite/shader.vert" with { type: "text" };
import { createProgram } from "./utils";

const MAX_ENTITIES = 10_000;

const SPRITE_SHEET_TEXTURE_INDEX = 0;
const CAMERA_UBO_BINDING_POINT = 1;

/**
 * sprite renderer
 */
export const createRenderer = (
	canvas: HTMLCanvasElement,
	{ spriteSheet }: { spriteSheet: TexImageSource },
) => {
	const gl = canvas.getContext("webgl2")!;

	const cameraUBOArray = new Float32Array(16 + 16);
	const projectionMatrix = new Float32Array(cameraUBOArray.buffer, 0, 16);
	const viewMatrix = new Float32Array(
		cameraUBOArray.buffer,
		16 * 4,
		16,
	) as mat4;
	const cameraUBOBuffer = gl.createBuffer();

	gl.bindBufferBase(
		gl.UNIFORM_BUFFER,
		CAMERA_UBO_BINDING_POINT,
		cameraUBOBuffer,
	);
	gl.bufferData(gl.UNIFORM_BUFFER, cameraUBOArray, gl.DYNAMIC_DRAW);

	const resize = (width: number, height: number, dpr: number) => {
		canvas.width = width * dpr;
		canvas.height = height * dpr;

		gl.viewport(0, 0, canvas.width, canvas.height);

		const aspect = canvas.width / canvas.height;
		mat4.perspective(projectionMatrix, Math.PI / 4, aspect, 0.1, 2000);
	};

	const spriteProgram = createProgram(
		gl,
		spriteVertexShaderCode,
		spriteFragmentShaderCode,
	);

	gl.uniformBlockBinding(
		spriteProgram,
		gl.getUniformBlockIndex(spriteProgram, "Camera"),
		CAMERA_UBO_BINDING_POINT,
	);

	const spriteVao = gl.createVertexArray();
	gl.bindVertexArray(spriteVao);

	{
		const quadBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

		gl.bufferData(
			gl.ARRAY_BUFFER,
			// interleaved position and texCoord
			new Float32Array([
				-0.5, 0.5, -0, 0,

				-0.5, -0.5, 0, 1,

				0.5, 0.5, 1, 0,

				0.5, -0.5, 1, 1,
			]),
			gl.STATIC_DRAW,
		);

		const a_position = gl.getAttribLocation(spriteProgram, "a_position");
		const a_texCoord = gl.getAttribLocation(spriteProgram, "a_texCoord");

		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
		gl.enableVertexAttribArray(a_position);
		gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0); // read interleaved data, each vertex have 16 bytes ( (2+2) * 4 bytes for float32 ), position offset is 0

		gl.enableVertexAttribArray(a_texCoord);
		gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);
	}

	const spriteEntitiesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, spriteEntitiesBuffer);
	let byteOffset = 0;
	for (const attributeName of [
		"a_objectMatrix1",
		"a_objectMatrix2",
		"a_objectMatrix3",
		"a_objectMatrix4",
		"a_spriteBox",
	]) {
		const location = gl.getAttribLocation(spriteProgram, attributeName);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 16 * 5, byteOffset);
		gl.vertexAttribDivisor(location, 1);
		byteOffset += 16;
	}

	const spriteEntitiesData = new Float32Array(MAX_ENTITIES * 16 * 5);
	const entities = {
		items: Array.from({ length: MAX_ENTITIES }, (_, i) => ({
			transform: new Float32Array(
				spriteEntitiesData.buffer,
				i * 16 * 5,
				16,
			) as mat4,
			spriteBox: new Float32Array(
				spriteEntitiesData.buffer,
				i * 16 * 5 + 16 * 4,
				4,
			) as vec4,
		})),
		count: 0,
	};

	const spriteSheetLocation = gl.getUniformLocation(
		spriteProgram,
		"u_colorTexture",
	);
	{
		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + SPRITE_SHEET_TEXTURE_INDEX);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			spriteSheet,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}

	gl.disable(gl.CULL_FACE);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LESS);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	const draw = () => {
		gl.bindBufferBase(
			gl.UNIFORM_BUFFER,
			CAMERA_UBO_BINDING_POINT,
			cameraUBOBuffer,
		);
		gl.bufferData(gl.UNIFORM_BUFFER, cameraUBOArray, gl.DYNAMIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, spriteEntitiesBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			spriteEntitiesData,
			gl.DYNAMIC_DRAW,
			0,
			entities.count * 20,
		);

		gl.useProgram(spriteProgram);

		gl.uniform1i(spriteSheetLocation, SPRITE_SHEET_TEXTURE_INDEX);

		gl.bindVertexArray(spriteVao);
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, entities.count);
	};

	return { resize, viewMatrix, entities, draw };
};
