const A = styled.div
  .attrs({ a: 1 })
  .withConfig({ displayName: "A" })`
  color: red;
`;
const B = styled(Button)
  .attrs({ b: 2 })`
  margin: 0;
`;
const C = styled.div.attrs({ c: 3 })
  .withConfig({ displayName: "C" })`
  padding: 0;
`;
const sentinel = 1;
