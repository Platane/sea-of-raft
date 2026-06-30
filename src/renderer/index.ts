import { mat4, vec3, vec4 } from "gl-matrix";
import spriteFragmentShaderCode from "./sprite/shader.frag" with { type: "text" };
import spriteVertexShaderCode from "./sprite/shader.vert" with { type: "text" };
import waveFragmentShaderCode from "./wave/shader.frag" with { type: "text" };
import waveVertexShaderCode from "./wave/shader.vert" with { type: "text" };
import { createProgram } from "./utils";

const MAX_ENTITIES = 10_000;

const UBO_BINDING_POINT_CAMERA = 1;

const TEXTURE_INDEX_SPRITE_SHEET = 0;
const TEXTURE_INDEX_WAVE = 1;
const TEXTURE_INDEX_NOISE = 2;

/**
 * sprite renderer
 *
 * usage:
 *   - caller fill the entities attributes
 *   - caller mutate viewMatrix
 *   - draw
 */
export const createRenderer = (
  canvas: HTMLCanvasElement,
  textureSources: { spriteSheet: TexImageSource; wave: TexImageSource; noise: TexImageSource },
) => {
  const gl = canvas.getContext("webgl2")!;

  const cameraUBOArray = new Float32Array(16 + 16 + 4);
  const projectionMatrix = new Float32Array(cameraUBOArray.buffer, 0, 16);
  const viewMatrix = new Float32Array(cameraUBOArray.buffer, 16 * 4, 16) as mat4;
  const lightDirection = new Float32Array(cameraUBOArray.buffer, (16 + 16) * 4, 3) as vec3;
  vec3.set(lightDirection, 1, 2, 0.5);
  vec3.normalize(lightDirection, lightDirection);
  const cameraUBOBuffer = gl.createBuffer();

  gl.bindBufferBase(gl.UNIFORM_BUFFER, UBO_BINDING_POINT_CAMERA, cameraUBOBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, cameraUBOArray, gl.DYNAMIC_DRAW);

  const resize = (width: number, height: number, dpr: number) => {
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    gl.viewport(0, 0, canvas.width, canvas.height);

    const aspect = canvas.width / canvas.height;
    mat4.perspective(projectionMatrix, Math.PI / 4, aspect, 0.1, 2000);
  };

  const spriteProgram = createProgram(gl, spriteVertexShaderCode, spriteFragmentShaderCode);

  gl.uniformBlockBinding(
    spriteProgram,
    gl.getUniformBlockIndex(spriteProgram, "Camera"),
    UBO_BINDING_POINT_CAMERA,
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
        -0.5, 0.5, 0, 0,

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
      transform: new Float32Array(spriteEntitiesData.buffer, i * 16 * 5, 16) as mat4,
      spriteBox: new Float32Array(spriteEntitiesData.buffer, i * 16 * 5 + 16 * 4, 4) as vec4,
    })),
    count: 0,
  };

  const spriteSheetLocation = gl.getUniformLocation(spriteProgram, "u_colorTexture");
  {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX_SPRITE_SHEET);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSources.spriteSheet);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  //
  //
  //

  const waveProgram = createProgram(gl, waveVertexShaderCode, waveFragmentShaderCode);

  const waveLocation = gl.getUniformLocation(waveProgram, "u_waveTexture");
  const noiseLocation = gl.getUniformLocation(waveProgram, "u_noiseTexture");

  gl.uniformBlockBinding(
    waveProgram,
    gl.getUniformBlockIndex(waveProgram, "Camera"),
    UBO_BINDING_POINT_CAMERA,
  );

  const waveVao = gl.createVertexArray();
  gl.bindVertexArray(waveVao);
  const WAVE_L = 256;
  {
    const S = 140;

    const data = new Float32Array(
      Array.from({ length: WAVE_L * WAVE_L }, (_, i) => {
        const x = Math.floor(i / WAVE_L);
        const y = i % WAVE_L;

        // interleaved position and texCoord
        return [
          //
          ((x + 0) / WAVE_L - 0.5) * S,
          ((y + 0) / WAVE_L - 0.5) * S,
          ((x + 0) / WAVE_L) * (S / 10),
          ((y + 0) / WAVE_L) * (S / 10),

          ((x + 1) / WAVE_L - 0.5) * S,
          ((y + 0) / WAVE_L - 0.5) * S,
          ((x + 1) / WAVE_L) * (S / 10),
          ((y + 0) / WAVE_L) * (S / 10),

          ((x + 1) / WAVE_L - 0.5) * S,
          ((y + 1) / WAVE_L - 0.5) * S,
          ((x + 1) / WAVE_L) * (S / 10),
          ((y + 1) / WAVE_L) * (S / 10),

          //

          ((x + 0) / WAVE_L - 0.5) * S,
          ((y + 0) / WAVE_L - 0.5) * S,
          ((x + 0) / WAVE_L) * (S / 10),
          ((y + 0) / WAVE_L) * (S / 10),

          ((x + 1) / WAVE_L - 0.5) * S,
          ((y + 1) / WAVE_L - 0.5) * S,
          ((x + 1) / WAVE_L) * (S / 10),
          ((y + 1) / WAVE_L) * (S / 10),

          ((x + 0) / WAVE_L - 0.5) * S,
          ((y + 1) / WAVE_L - 0.5) * S,
          ((x + 0) / WAVE_L) * (S / 10),
          ((y + 1) / WAVE_L) * (S / 10),
        ];
      }).flat(),
    );

    const gridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const a_position = gl.getAttribLocation(waveProgram, "a_position");
    const a_texCoord = gl.getAttribLocation(waveProgram, "a_texCoord");

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0); // read interleaved data, each vertex have 16 bytes ( (2+2) * 4 bytes for float32 ), position offset is 0

    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);
  }

  {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX_WAVE);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSources.wave);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX_NOISE);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, textureSources.noise);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  //
  //
  //

  gl.disable(gl.CULL_FACE);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const updateTime = (t: number) => {
    cameraUBOArray[16 + 16 + 3] = t;
  };

  const draw = () => {
    gl.bindBufferBase(gl.UNIFORM_BUFFER, UBO_BINDING_POINT_CAMERA, cameraUBOBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, cameraUBOArray, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, spriteEntitiesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, spriteEntitiesData, gl.DYNAMIC_DRAW, 0, entities.count * 20);

    gl.useProgram(spriteProgram);
    gl.bindVertexArray(spriteVao);
    gl.uniform1i(spriteSheetLocation, TEXTURE_INDEX_SPRITE_SHEET);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, entities.count);

    gl.useProgram(waveProgram);
    gl.bindVertexArray(waveVao);
    gl.uniform1i(waveLocation, TEXTURE_INDEX_WAVE);
    gl.uniform1i(noiseLocation, TEXTURE_INDEX_NOISE);
    gl.drawArrays(gl.TRIANGLES, 0, WAVE_L * WAVE_L * 3 * 2);
    // gl.drawArrays(gl.LINES, 0, WAVE_L * WAVE_L * 3 * 2);
  };

  return { resize, viewMatrix, updateTime, entities, draw };
};
