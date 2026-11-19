// vscode-css-languageservice ships no typings for this file, and its public entry does not export the color converters.
declare module "vscode-css-languageservice/lib/esm/languageFacts/colors" {
  import type { Color } from "vscode-css-languageservice";

  export const colors: Record<string, string>;
  export function colorFromHex(text: string): Color | null;
  export function colorFromHSL(
    hue: number,
    sat: number,
    light: number,
    alpha: number,
  ): Color;
  export function colorFromHWB(
    hue: number,
    white: number,
    black: number,
    alpha: number,
  ): Color;
  export function colorFromLAB(
    l: number,
    a: number,
    b: number,
    alpha: number,
  ): Color;
  export function colorFromLCH(
    l: number,
    c: number,
    h: number,
    alpha: number,
  ): Color;
  export function colorFromOKLAB(
    l: number,
    a: number,
    b: number,
    alpha: number,
  ): Color;
  export function colorFromOKLCH(
    l: number,
    c: number,
    h: number,
    alpha: number,
  ): Color;
  export function hslFromColor(color: Color): {
    h: number;
    s: number;
    l: number;
    a: number;
  };
  export function hwbFromColor(color: Color): {
    h: number;
    w: number;
    b: number;
    a: number;
  };
  export function labFromColor(color: Color): {
    l: number;
    a: number;
    b: number;
    alpha: number;
  };
  export function lchFromColor(color: Color): {
    l: number;
    c: number;
    h: number;
    alpha: number;
  };
  export function oklabFromColor(color: Color): {
    l: number;
    a: number;
    b: number;
    alpha: number;
  };
  export function oklchFromColor(color: Color): {
    l: number;
    c: number;
    h: number;
    alpha: number;
  };
}
