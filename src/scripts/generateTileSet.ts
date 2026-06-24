import { loadImage } from "../utils/image";

import pirateSheetUrl from "../assets/pirates.png";
import bottleSheetUrl from "../assets/blue-potions.png";

type Rgb = [number, number, number];

// draws the 16x16 source tile once per swap, laid out in columns, remapping
// originalColors[k] -> swap[k] in each. returns a (16*swaps.length)x16 canvas.
const colorSwap =
  ([sx, sy]: [number, number], originalColors: Rgb[], swaps: Rgb[][]) =>
  (image: CanvasImageSource) => {
    const canvas = document.createElement("canvas");
    canvas.width = 16 * swaps.length;
    canvas.height = 16;
    const ctx = canvas.getContext("2d")!;

    swaps.forEach((swap, i) => {
      const dx = i * 16;
      ctx.drawImage(image, sx * 16, sy * 16, 16, 16, dx, 0, 16, 16);

      const region = ctx.getImageData(dx, 0, 16, 16);
      const { data } = region;
      for (let p = 0; p < data.length; p += 4) {
        for (let k = 0; k < originalColors.length; k++) {
          const [r, g, b] = originalColors[k];
          if (data[p] === r && data[p + 1] === g && data[p + 2] === b) {
            [data[p], data[p + 1], data[p + 2]] = swap[k];
            break;
          }
        }
      }
      ctx.putImageData(region, dx, 0);
    });

    return canvas;
  };

const sources = [
  {
    image: await loadImage(pirateSheetUrl),

    hat: [0, 3 / 16],

    pirate1: [2, 1],
    pirate2: [3, 1],
    pirate3: [4, 1],
    pirate4: [5, 1],

    pirate5: [1, 4],
    pirate6: [2, 4],
    pirate7: [3, 4],
    pirate8: [4, 4],
    pirate9: [5, 4],

    pirate10: [1, 5],
    pirate11: [2, 5],
    pirate12: [3, 5],
    pirate13: [4, 5],
    pirate14: [5, 5],

    coin: [0, 2],
    skeleton: [1, 1],
    raft: [1, 10],
    // raft2: [7, 6],
    beer: [0, 4],
  },
  {
    image: await loadImage(bottleSheetUrl),
    bottle1: [3, 0],
  },
  {
    image: await loadImage(bottleSheetUrl).then(
      colorSwap(
        [3, 0],
        [
          [0xcc, 0xb1, 0x27],
          [0xe3, 0xd7, 0x3f],
          [0xe3, 0xc8, 0x3f],
        ],
        [
          // hue-shifted from the yellow-ish original
          [
            [0x27, 0x5e, 0xcc],
            [0x3f, 0x67, 0xe3],
            [0x3f, 0x76, 0xe3],
          ], // blue-ish
          [
            [0x32, 0x78, 0x32],
            [0x38, 0x93, 0x40],
            [0x38, 0x93, 0x38],
          ], // green-ish (darker, less saturated)
          [
            [0xcc, 0x27, 0x27],
            [0xe3, 0x4e, 0x3f],
            [0xe3, 0x3f, 0x3f],
          ], // red-ish
          [
            [0x80, 0x7e, 0x73],
            [0x97, 0x96, 0x8b],
            [0x97, 0x95, 0x8b],
          ], // desaturated grey
        ],
      ),
    ),
    bottle2: [0, 0], // blue
    bottle3: [1, 0], // green
    bottle4: [2, 0], // red
    bottle5: [3, 0], // grey
  },
] as const;

//
// determine final sprite sheet width / height
//

const spriteCount = sources.reduce(
  (sum: number, { image: _, ...boxes }) => sum + Object.keys(boxes).length,
  0,
);

// pack into a square-ish grid
const w = Math.ceil(Math.sqrt(spriteCount));
const h = Math.ceil(spriteCount / w);

const GAP = 2; // gap between tiles to prevent UV bleeding

const canvas = document.createElement("canvas");
canvas.width = w * 16 + (w - 1) * GAP;
canvas.height = h * 16 + (h - 1) * GAP;

const ctx = canvas.getContext("2d")!;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;
export type SpriteName = Exclude<KeysOfUnion<(typeof sources)[number]>, "image">;
export type Box = [number, number, number, number];
export const spriteBoxes: Record<SpriteName, Box> = {} as Record<SpriteName, Box>;

// second pass: draw every sprite into its grid cell and record its UV box
let i = 0;
for (const { image, ...box } of sources) {
  for (const [name, [sx, sy]] of Object.entries(box)) {
    const x = i % w;
    const y = Math.floor(i / w);

    const dx = x * (16 + GAP);
    const dy = y * (16 + GAP);

    ctx.drawImage(image, sx * 16, sy * 16, 16, 16, dx, dy, 16, 16);

    spriteBoxes[name as SpriteName] = [
      dx / canvas.width,
      dy / canvas.height,
      (dx + 16) / canvas.width,
      (dy + 16) / canvas.height,
    ];

    i++;
  }
}

const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r));

export const tileSetUrl = URL.createObjectURL(blob!);

// document.body.appendChild(canvas);
// canvas.style = `position:fixed;top:0;right:0;border:solid 5px red; width:400px;image-rendering:pixelated`;

if (false) {
  console.log("const boxes =", JSON.stringify(spriteBoxes, null, 2));

  // download the generated tileset
  const a = document.createElement("a");
  a.href = tileSetUrl;
  a.download = "tileset.png";
  a.click();
}
