declare module "*.css";
declare module "*.module.css" {
  const styles: Record<string, string>;
  export default styles;
}
declare module "*.png";
declare module "*.vert" {
  const src: string;
  export default src;
}
declare module "*.frag" {
  const src: string;
  export default src;
}
declare module "*.glsl" {
  const src: string;
  export default src;
}
