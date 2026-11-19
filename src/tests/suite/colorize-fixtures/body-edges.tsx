const a = <div css={`color: red; ` + `x`}>x</div>;
const b = <div css={`
  color: red;
`}>x</div>;
const c = <style jsx>{`
  p { color: red } ` + `
  div { margin: 0 }
`}</style>;
const d = <style jsx>{`a{b:c}`}</style>;
const e = <style jsx global>{`` + ``}</style>;
const f = styled.div<{ a: boolean }>`
  color: ${(p) => (p.a ? "red" : "blue")};
`;
const sentinel = 1;
