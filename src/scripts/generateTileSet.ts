import spriteSheetUrl from "../assets/pirates.png";

const source = await new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = spriteSheetUrl;
});

const sourcesBoxes = {
  hat: [0, 3 / 16],
  pirates: [
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],

    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],

    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [5, 5],
  ],
  coin: [0, 2],
  skeleton: [1, 1],
  raft: [1, 10],
  raft2: [7, 6],
  beer: [0, 4],
};

const TILE_SIZE = 16;
const GAP = 1; // gap between tiles to prevent UV bleeding

// flatten all named tiles into a linear list, preserving name and array index
const flatSprites: Array<{
  name: string;
  index: number;
  col: number;
  row: number;
}> = [];

for (const [name, box] of Object.entries(sourcesBoxes)) {
  if (Array.isArray(box[0])) {
    for (let i = 0; i < (box as number[][]).length; i++) {
      const [col, row] = (box as number[][])[i];
      flatSprites.push({ name, index: i, col, row });
    }
  } else {
    const [col, row] = box as number[];
    flatSprites.push({ name, index: 0, col, row });
  }
}

// pack into a square-ish grid
const gridCols = Math.ceil(Math.sqrt(flatSprites.length));
const gridRows = Math.ceil(flatSprites.length / gridCols);

const CELL = TILE_SIZE + GAP;

const canvas = document.createElement("canvas");
canvas.width = gridCols * CELL - GAP;
canvas.height = gridRows * CELL - GAP;

const ctx = canvas.getContext("2d")!;

const destBoxes: Record<string, number[] | number[][]> = {};

for (let i = 0; i < flatSprites.length; i++) {
  const { name, index, col, row } = flatSprites[i];

  const destCol = i % gridCols;
  const destRow = Math.floor(i / gridCols);

  const px = destCol * CELL;
  const py = destRow * CELL;

  ctx.drawImage(
    source,
    col * TILE_SIZE,
    row * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
    px,
    py,
    TILE_SIZE,
    TILE_SIZE,
  );

  const u0 = px / canvas.width;
  const v0 = py / canvas.height;
  const u1 = (px + TILE_SIZE) / canvas.width;
  const v1 = (py + TILE_SIZE) / canvas.height;

  const original = sourcesBoxes[name as keyof typeof sourcesBoxes];
  if (Array.isArray(original[0])) {
    if (!destBoxes[name]) destBoxes[name] = [];
    (destBoxes[name] as number[][])[index] = [u0, v0, u1, v1];
  } else {
    destBoxes[name] = [u0, v0, u1, v1];
  }
}

console.log("destBoxes =", JSON.stringify(destBoxes, null, 2));

document.body.appendChild(canvas);
canvas.style = `position:fixed;top:0;right:0;border:solid 5px red; width:400px`;

// download the generated tileset
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob!);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tileset.png";
  a.click();
  URL.revokeObjectURL(url);
});
