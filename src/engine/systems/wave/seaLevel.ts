import { WAVE_KERNEL_SIZE, WAVE_WORLD_SIZE } from "../../../renderer";

// CPU mirror of the vertex shader's getHeight (src/renderer/wave/shader.vert).
// the mesh maps a world position to the texcoord it samples the noise with:
//   texCoord = worldX / WAVE_KERNEL_SIZE + 0.5 * WAVE_WORLD_SIZE / WAVE_KERNEL_SIZE
// so we reproduce that mapping here, then sample the same noise the same way.
const TEX_OFFSET = (0.5 * WAVE_WORLD_SIZE) / WAVE_KERNEL_SIZE;

export const createGetSeaLevel =
  (imageData: { data: Uint8Array; width: number; height: number }) =>
  (time: number, x: number, y: number) => {
    const px = x / WAVE_KERNEL_SIZE + TEX_OFFSET;
    const py = y / WAVE_KERNEL_SIZE + TEX_OFFSET;

    const h1 = texture(imageData, px * 1.236 + 0.00131 * time, py * 1.236 + 0.00027 * time);
    const h2 = texture(imageData, px * 0.763 + -0.000424 * time, py * 0.763 + 0.00091 * time);

    return (h1 - 0.5) * 0.88 + (h2 - 0.5) * 0.37;
  };

const texture = (
  imageData: { data: Uint8Array; width: number; height: number },
  x: number,
  y: number,
): number => {
  const dx = wrap(Math.round(x * imageData.width), imageData.width);
  const dy = wrap(Math.round(y * imageData.height), imageData.height);
  return imageData.data[dx + dy * imageData.width] / 255;
};

// GL_REPEAT-style wrap (matches the noise texture in renderer/index.ts); JS %
// keeps the sign, so bring it back positive.
const wrap = (v: number, n: number): number => ((v % n) + n) % n;
