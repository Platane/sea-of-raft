import styles from "./timeline.module.css";

export const createTimeline = () => {
  let onChange: ((t: number) => void) | undefined;
  let onFinishSeek: ((t: number) => void) | undefined;
  let onPause: (() => void) | undefined;
  let onResume: (() => void) | undefined;
  let onPrev: (() => void) | undefined;
  let onNext: (() => void) | undefined;

  const domElement = document.createElement("div");
  domElement.className = styles.container;

  const datalist = document.createElement("datalist");
  datalist.id = "timeline-ticks";

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "1000";
  range.value = "0";
  range.className = styles.range;
  range.setAttribute("list", "timeline-ticks");
  range.addEventListener("input", () => onChange?.(Number(range.value)));
  range.addEventListener("change", () => onFinishSeek?.(Number(range.value)));

  const btnPrev = document.createElement("button");
  btnPrev.textContent = "⏮";
  btnPrev.className = styles.btn;
  btnPrev.addEventListener("click", () => onPrev?.());

  const btnPlayPause = document.createElement("button");
  btnPlayPause.textContent = "⏸";
  btnPlayPause.className = styles.btn;
  btnPlayPause.addEventListener("click", () => {
    if (btnPlayPause.dataset.status === "running") onPause?.();
    else onResume?.();
  });

  const btnNext = document.createElement("button");
  btnNext.textContent = "⏭";
  btnNext.className = styles.btn;
  btnNext.addEventListener("click", () => onNext?.());

  domElement.appendChild(datalist);
  domElement.appendChild(range);
  domElement.appendChild(btnPrev);
  domElement.appendChild(btnPlayPause);
  domElement.appendChild(btnNext);

  const update = (status: "running" | "paused", t: number, maxT: number, ticks: number[]) => {
    btnPlayPause.textContent = status === "running" ? "⏸" : "▶";
    btnPlayPause.dataset.status = status;
    range.max = String(maxT);
    range.value = String(t);
    datalist.innerHTML = ticks.map((v) => `<option value="${v}"></option>`).join("");
  };

  const out = {
    domElement,
    update,
    set onSeek(fn: (t: number) => void) {
      onChange = fn;
    },
    set onFinishSeek(fn: (t: number) => void) {
      onFinishSeek = fn;
    },
    set onPause(fn: () => void) {
      onPause = fn;
    },
    set onResume(fn: () => void) {
      onResume = fn;
    },
    set onPrev(fn: () => void) {
      onPrev = fn;
    },
    set onNext(fn: () => void) {
      onNext = fn;
    },
  };

  return out;
};
