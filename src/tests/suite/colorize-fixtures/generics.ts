// #358 and #442: type arguments that span lines
const Container = styled.div<{
  fullWidth?: boolean;
  isMyMessage?: boolean | null;
}>`
  color: red;
`;

const B = styled.div<
  Props
>`
  color: red;
`;
const D = styled.div<Props &
  Other>`
  color: red;
`;

const A = styled(Button)<{
  a: string;
}>`
  color: red;
`;
const C = styled("div")<{
  a: string;
}>`
  color: red;
`;

const R = styled.div<{
  a: Record<string, number>;
  b: Array<string>;
}>`
  color: red;
  ${(p) => p.a && css`
    color: red;
  `}
`;

const Pick1 = styled.div<Pick<P, "a"> & {
  b: string
}>`
  color: red;
`;

const X = styled.div<{ a: string;
  b: number;
}>`
  color: red;
`;
const E = styled.div<{ onClick: () => void;
  b: string }>`
  color: red;
`;

// .attrs after and around a generic
const AG = styled.div<Props>.attrs((p) => ({
  a: 1,
}))`
  color: red;
`;
const ML = styled.div<
  Props
>.attrs((p) => ({
  title: `${p.s}`,
}))`
  color: red;
`;
const G = styled.div.attrs<Props>((p) => ({
  a: 1,
}))<{ b: string }>`
  color: red;
`;
const H = styled.div.attrs({ a: 1 })<{
  b: string
}>`
  color: red;
`;
const I = styled(Link).attrs<{ $a: boolean }>(({ $a }) => ({
  role: $a ? "x" : "y",
}))`
  color: red;
`;
const M6 = styled(Button).attrs({ type: "button" })<{
  a: string
}>`
  color: red;
`;
const M7 = styled.div<Props>.attrs(p => ({}))`
  color: red;
`;

// helper generics
const GS = createGlobalStyle<{
  dark: boolean;
}>`
  body { color: red; }
`;
const c = css<{
  a: string;
}>`
  color: red;
`;
const k = keyframes<{
  a: string;
}>`
  from { color: red; }
`;

const T3 = styled(Button)<{
  v: `a-${string}`
}>`
  color: red;
`;
const E1 = styled("div")<Props>`
  color: red;
`;
const E2 = styled.div<{ a: (x: number) => void }>`
  color: red;
`;
const E3 = styled.div<Props>`
  ${(p: Props) => p.a && css<Props>`color: red;`}
`;
const sentinel = 1;
