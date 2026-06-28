import { vec3 } from "gl-matrix";

export type Handler = (touches: { pageX: number; pageY: number; button?: number }[]) => void;

export const createOrbitControl = (
  { canvas }: { canvas: HTMLCanvasElement },
  state: {
    eye: vec3;
    lookAt: vec3;
  },
  onChange?: () => void,
  {
    rotationSpeed = 3.5,
    minRadius = 1,
    maxRadius = 1400,
    minPhi = Math.PI * 0.0002,
    maxPhi = Math.PI * 0.45,
  }: {
    rotationSpeed?: number;
    minRadius?: number;
    maxRadius?: number;
    minPhi?: number;
    maxPhi?: number;
  } = {},
) => {
  const v = vec3.create();
  vec3.sub(v, state.eye, state.lookAt);

  let radius = vec3.length(v);
  let phi = Math.asin(v[1] / radius);
  let theta = Math.asin(v[0] / radius / Math.cos(phi));

  const update = () => {
    state.eye[0] = state.lookAt[0] + radius * Math.sin(theta) * Math.cos(phi);
    state.eye[1] = state.lookAt[1] + radius * Math.sin(phi);
    state.eye[2] = state.lookAt[2] + radius * Math.cos(theta) * Math.cos(phi);

    onChange?.();
  };

  let rotate_px: number | null = null;
  let rotate_py: number | null = null;

  const rotateStart: Handler = ([{ pageX: x, pageY: y }]) => {
    rotate_px = x;
    rotate_py = y;
  };
  const rotateMove: Handler = ([{ pageX: x, pageY: y }]) => {
    if (rotate_px !== null) {
      const dx = x - rotate_px!;
      const dy = y - rotate_py!;

      theta -= (dx / window.innerHeight) * rotationSpeed;
      phi += (dy / window.innerHeight) * rotationSpeed;

      phi = clamp(phi, minPhi, maxPhi);

      rotate_px = x;
      rotate_py = y;

      update();
    }
  };
  const rotateEnd: Handler = () => {
    rotate_px = null;
  };

  const touchStart: Handler = (touches) => {
    if (touches.length === 1) rotateStart(touches);
  };
  const touchMove: Handler = (touches) => {
    rotateMove(touches);
  };
  const touchEnd: Handler = (touches) => {
    rotateEnd(touches);
  };

  canvas.ontouchstart = (event) => touchStart(Array.from(event.touches));
  canvas.ontouchmove = (event) => touchMove(Array.from(event.touches));
  canvas.ontouchend = (event) => touchEnd(Array.from(event.touches));

  canvas.onmousedown = (event) => touchStart([event]);
  canvas.onmousemove = (event) => touchMove([event]);
  canvas.onmouseup = (event) => touchEnd([]);

  window.onblur = canvas.onmouseleave = () => {
    touchEnd([]);
  };

  canvas.oncontextmenu = (e) => e.preventDefault();

  canvas.addEventListener(
    "wheel",
    (event) => {
      const zoom = Math.sqrt(radius);

      const newZoom = zoom + event.deltaY * 0.02;

      radius = clamp(newZoom ** 2, minRadius, maxRadius);

      update();
    },
    { passive: true },
  );
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
