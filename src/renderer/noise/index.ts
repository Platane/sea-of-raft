import { createProgram } from "../utils";
import vertexShaderCode from "./shader.vert" with { type: "text" };
import fragmentShaderCode from "./shader.frag" with { type: "text" };
import psrdnoiseCode from "psrdnoise/src/psrdnoise2.glsl" with { type: "text" };

export const createNoiseRenderer = (gl: WebGL2RenderingContext) => {
  const program = createProgram(
    gl,
    vertexShaderCode,

    "#version 300 es\n" + "precision highp float;\n" + psrdnoiseCode + fragmentShaderCode,
  );

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

  // interleaved position and texCoord
  const quadData = new Float32Array([
    -1, 1, 0, 1,

    -1, -1, 0, 0,

    1, 1, 1, 1,

    1, -1, 1, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

  const a_position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0); // read interleaved data, each vertex have 16 bytes ( (2+2) * 4 bytes for float32 ), position offset is 0

  const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(a_texCoord);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);

  const u_resolution = gl.getUniformLocation(program, "u_resolution");
  const u_offset = gl.getUniformLocation(program, "u_offset");

  const draw = ({
    resolution,
    offset,
  }: {
    resolution: [number, number];
    offset: [number, number];
  }) => {
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(u_resolution, resolution[0], resolution[1]);
    gl.uniform2f(u_offset, offset[0], offset[1]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const dispose = () => {
    gl.deleteBuffer(quadBuffer);
    gl.deleteProgram(program);
  };

  return { draw, dispose };
};
