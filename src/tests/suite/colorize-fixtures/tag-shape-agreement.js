const A = Button.extend
  .attrs({ a: 1 })
  .withConfig({ b: 2 })`
  color: red;
`;
const sentinel = 1;
const B = Button.extend.attrs({ a: 1 }).withConfig({ b: 2 })`color: red;`;
const sentinel = 1;
const B2 = Button.extend.attrs({ a: 1 }).attrs({ b: 2 }).withConfig({ c: 3 })`color: red;`;
const sentinel = 1;
const C = css /* why */`color: red;`;
const sentinel = 1;
const D = css `color: red;`;
const sentinel = 1;
const E = A.withComponent(getComp())`color: red;`;
const sentinel = 1;
const F = styled.div(p => `color: red;`);
const sentinel = 1;
const F2 = styled.div($p => `color: red;`);
const sentinel = 1;
const G = createGlobalStyles`body { color: red; }`;
const sentinel = 1;
const H = Media.desktop`color: red;`;
const sentinel = 1;
const I = keyframes /* x */`from { color: red; }`;
const sentinel = 1;
const J = styled.div`color: red;`.toString();
const sentinel = 1;
