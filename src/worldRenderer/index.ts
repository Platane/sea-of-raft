import { mat4, quat, vec3, vec4 } from "gl-matrix";
import { debug } from "util";
import { createRenderer } from "../renderer";
import { boxes } from "./sprites";
import { hashInt } from "./utils";

export const createWorldRenderer = (
  canvas: HTMLCanvasElement,
  assets: { spriteSheet: TexImageSource },
) => {
  const renderer = createRenderer(canvas, assets);

  const getHitEntity = (x: number, y: number) => {
    // TODO
    return null;
  };

  const qFloor = new Float32Array(4) as quat;
  quat.identity(qFloor);
  quat.rotateX(qFloor, qFloor, Math.PI / 2);

  const qSprite = new Float32Array(4) as quat;
  quat.identity(qSprite);

  const v = new Float16Array(3) as vec3;
  const o = new Float16Array(3) as vec3;
  const s = new Float16Array(3) as vec3;
  const s1 = new Float16Array([1, 1, 1]) as vec3;
  const sRaft = new Float16Array([1.5, 1.5, 1.5]) as vec3;

  const draw = (state: State, t: number) => {
    let i = 0;

    vec4.copy(renderer.entities.items[i].spriteBox, boxes.pirates[0]);
    mat4.identity(renderer.entities.items[i].transform);

    i++;

    for (let k = state.nodes.length; k--; ) {
      const a = (k / state.nodes.length) * Math.PI * 2;
      const A = 4;
      const ox = A * Math.sin(a);
      const oz = A * Math.cos(a);
      const oy = Math.sin(t / 100 + hashInt(k)) * 0.1;

      // raft
      vec4.copy(renderer.entities.items[i].spriteBox, boxes.raft);
      vec3.set(v, ox, oy, oz);
      mat4.fromRotationTranslationScale(renderer.entities.items[i].transform, qFloor, v, sRaft);
      i++;

      // character
      vec4.copy(
        renderer.entities.items[i].spriteBox,
        state.nodes[k].dead ? boxes.skeleton : boxes.pirates[hashInt(k + 1) % boxes.pirates.length],
      );

      vec3.set(v, ox, oy * 1.1 + 0.5, oz + 0.2);
      // vec3.set(0, ox, 1, oz);
      mat4.fromRotationTranslationScaleOrigin(
        renderer.entities.items[i].transform,
        qSprite,
        v,
        s1,
        o,
      );
      i++;

      // hat
      if (state.nodes[k].hat) {
        vec4.copy(renderer.entities.items[i].spriteBox, boxes.hat);

        vec3.set(v, ox, oy * 1.15 + 1.25, oz + 0.21);
        // vec3.set(0, ox, 1, oz);
        mat4.fromRotationTranslationScaleOrigin(
          renderer.entities.items[i].transform,
          qSprite,
          v,
          s1,
          o,
        );
        i++;
      }
    }

    renderer.entities.count = i;

    renderer.draw();
  };

  return {
    resize: renderer.resize,
    viewMatrix: renderer.viewMatrix,
    draw,
    getHitEntity,
  };
};

export type State<Message = unknown> = {
  nodes: { dead: boolean; hat: boolean; mailbox: Message[] }[];
  inbound: { message: Message; sender: number; receiver: number; k: number }[];
};
