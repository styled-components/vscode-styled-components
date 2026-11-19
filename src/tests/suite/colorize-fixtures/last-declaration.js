// A last declaration without ";" leaves the closing backtick to the template
const A = styled.div`
  ${(p) => p.active && css`color: red`}
  margin: 0;
`;
const B = styled.div`
  margin: 0;
  color: red
`;
const C = styled.div`color: red`;
const sentinel = 1;
