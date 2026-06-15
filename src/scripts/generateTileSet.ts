import { loadImage } from "../utils/image";

import pirateSheetUrl from "../assets/pirates.png";
import bottleSheetUrl from "../assets/blue-potions.png";

const spritesheet = [
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

    // coin: [0, 2],
    skeleton: [1, 1],
    raft: [1, 10],
    // raft2: [7, 6],
    // beer: [0, 4],
  },
  {
    image: await loadImage(bottleSheetUrl),

    bottle: [3, 0],
  },
] as const;

// first pass: count every sprite to derive the packed grid dimensions
const spriteCount = spritesheet.reduce(
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

const destBoxes: Record<string, number[]> = {};

// second pass: draw every sprite into its grid cell and record its UV box
let i = 0;
for (const { image, ...box } of spritesheet) {
  for (const [name, [sx, sy]] of Object.entries(box)) {
    const x = i % w;
    const y = Math.floor(i / w);

    const dx = x * (16 + GAP);
    const dy = y * (16 + GAP);

    ctx.drawImage(image, sx * 16, sy * 16, 16, 16, dx, dy, 16, 16);

    destBoxes[name] = [
      dx / canvas.width,
      dy / canvas.height,
      (dx + 16) / canvas.width,
      (dy + 16) / canvas.height,
    ];

    i++;
  }
}

(destBoxes as any).pirates = Array.from({ length: 13 }, (_, i) => {
  const a = destBoxes[`pirate${i + 1}`];
  delete destBoxes[`pirate${i + 1}`];
  return a;
});

console.log("destBoxes =", JSON.stringify(destBoxes, null, 2));

document.body.appendChild(canvas);
canvas.style = `position:fixed;top:0;right:0;border:solid 5px red; width:400px;image-rendering:pixelated`;

// download the generated tileset
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob!);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tileset.png";
  a.click();
  URL.revokeObjectURL(url);
});
