import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      letter: any;
    }
  }
}
