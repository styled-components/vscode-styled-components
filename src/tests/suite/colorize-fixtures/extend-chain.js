const B = Button.extend.attrs({ a: 1 })`color: red;`;
const C = Button.extend.withConfig({ a: 1 })`color: red;`;
const D = Button.extend.attrs({
  a: 1,
})`
  color: red;
`;
const E = Button.extend
  .attrs({ a: 1 })`
  color: red;
`;
const sentinel = 1;
