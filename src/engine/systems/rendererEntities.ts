import { mat4, quat, vec3, vec4 } from "gl-matrix";
import { createRenderer } from "../../renderer";
import { hashInt } from "../../utils/hash";
// import { spriteBoxes } from "../../worldRenderer/sprites";
import { World } from "../type";
import { spriteBoxes, SpriteName } from "../../scripts/generateTileSet";

export const updateEntities = (
  state: World,
  entities: ReturnType<typeof createRenderer>["entities"],
  viewMatrix: mat4,
) => {
  const t = state.date;

  // cylindrical billboard: extract Y angle from view matrix back-vector (col-major: [2], [10])
  quat.identity(qSprite);
  quat.rotateY(qSprite, qSprite, Math.atan2(viewMatrix[2], viewMatrix[10]));

  vec3.set(toEye, viewMatrix[2], viewMatrix[6], viewMatrix[10]);

  let i = 0;

  for (let k = 0; k < state.nodes.length; k++) {
    const node = state.nodes[k];
    const [ox, oz] = node.position;
    const oy = Math.sin(t / 100 + hashInt(k)) * 0.1;

    // raft
    vec4.copy(entities.items[i].spriteBox, spriteBoxes.raft);
    vec3.set(v, ox, oy, oz);
    mat4.fromRotationTranslationScale(entities.items[i].transform, qFloor, v, sRaft);
    i++;

    // character
    vec4.copy(
      entities.items[i].spriteBox,
      node.dead
        ? spriteBoxes.skeleton
        : spriteBoxes[pirateSprites[hashInt(k + 1) % pirateSprites.length]],
    );

    vec3.set(v, ox, oy * 1.1 + 0.5, oz);
    // vec3.set(0, ox, 1, oz);
    mat4.fromRotationTranslationScaleOrigin(entities.items[i].transform, qSprite, v, s1, o);
    i++;

    // hat
    // if (node.hasHat) {
    //   vec4.copy(entities.items[i].spriteBox, spriteBoxes.hat);

    //   const nudge = 0.02;
    //   vec3.set(
    //     v,
    //     ox + toEye[0] * nudge,
    //     oy * 1.15 + 1.25 + toEye[1] * nudge,
    //     oz + toEye[2] * nudge,
    //   );
    //   // vec3.set(0, ox, 1, oz);
    //   mat4.fromRotationTranslationScaleOrigin(entities.items[i].transform, qSprite, v, s1, o);
    //   i++;
    // }
  }

  // bottles (Vec3 [x, y, z]); colored per sender
  for (const bottle of state.bottles) {
    const [x, y, z] = bottle.position;
    vec4.copy(
      entities.items[i].spriteBox,
      spriteBoxes[bottleSprites[hashInt(bottle.sender + 123456) % bottleSprites.length]],
    );
    vec3.set(v, x, y, z);
    mat4.fromRotationTranslationScaleOrigin(entities.items[i].transform, qSprite, v, sBottle, o);
    i++;
  }

  entities.count = i;
};

const qFloor = new Float32Array(4) as quat;
quat.identity(qFloor);
quat.rotateX(qFloor, qFloor, Math.PI / 2);

const qSprite = new Float32Array(4) as quat;
quat.identity(qSprite);

const v = new Float16Array(3) as vec3;
const toEye = new Float32Array(3) as vec3;
const o = new Float16Array(3) as vec3;
const s1 = new Float16Array([1, 1, 1]) as vec3;
const sBottle = new Float16Array([0.4, 0.4, 0.4]) as vec3;
const sRaft = new Float16Array([1.5, 1.5, 1.5]) as vec3;

const pirateSprites = [
  //
  "pirate1",
  "pirate2",
  "pirate3",
  "pirate4",
  "pirate5",
  "pirate6",
  "pirate7",
  "pirate8",
  "pirate9",
  "pirate10",
  "pirate11",
  "pirate12",
  "pirate13",
  "pirate14",
] as const satisfies SpriteName[];

const bottleSprites = [
  //
  "bottle1",
  "bottle2",
  "bottle3",
  "bottle4",
  "bottle5",
] as const satisfies SpriteName[];
