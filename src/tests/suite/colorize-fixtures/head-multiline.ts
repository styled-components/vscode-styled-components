// #292: .attrs given a props value, and heads that span lines
const M1 = styled.div.attrs(({}))` color: red; `;
const M2 = styled.div.attrs(()=>({}))` color: red; `;
const M3 = styled.div.attrs((someVar))` color: red; `;
const M4 = styled.div.attrs(someFunc())` color: red; `;
const Root = styled.div.attrs(props=>({
  "data-status": `${props.status}`
}))`
  color: red;
`;

const B = styled.div.attrs((p) => ({
  className: `x-${p.a}`,
}))`
  color: red;
`;

const C = styled.div.withConfig({
  shouldForwardProp: (prop) => !["a"].includes(prop),
})`
  color: red;
`;

// #383: a call whose argument is an arrow function returning an object, before a tag's template
const D = styled("div")(({ theme }) => `
  color: red;
`);
const E = styled.div(({ theme }) => `
  color: red;
`);

const F = styled.div.attrs({
  // a comment with a ) paren
  a: 1, /* and ( one */
})`
  color: red;
`;

const G = styled.div.attrs({

  a: 1,
})`
  color: red;
`;

const H = styled.div.attrs((p) => ({
  a: 1,
}))`
  color: red;
  ${(p) => p.a && css`
    color: red;
  `}
`;
const S = { a: css`color: red;`, b: styled.p`color: red;` };

const I = styled(
  Button
)`
  color: red;
`;
const J = styled
  .div`
  color: red;
`;

const K = styled(Button, {
  shouldForwardProp: (p) => p.length < 3 && p !== "x",
})`
  color: red;
`;

const L = styled.div.attrs((p) => ({
  a: p?.b ?? 1,
  c: [1, 2].map((x) => x < 2),
}))`
  color: red;
`;

const M = styled.div.attrs({
  re: /[(`]/g,
})`
  color: red;
`;

const N = styled.div.attrs({
  s: "(",
  t: ")))",
})`
  color: red;
`;

const O = styled.div.attrs({
  title: `a ${b} (`,
})`
  color: red;
`;
const sentinel = 1;
