const Link = styled.a.attrs({
  target: "_blank",
})`
  color: red;
`;

const SimpleOneLine = styled.a.attrs({ target: "_blank" })`
  color: red;
`;

const SimpleMultiLine = styled.a.attrs({
  target: "_blank",
})`
  color: red;
`;

const ExtraParens = styled.div.attrs({ target: "_blank" })`
  color: red;
`;

const Func = styled.div.attrs(() => ({}))`
  color: red;
`;

const FuncWithProps = styled.div.attrs((props) => ({
  style: props.style,
}))`
  color: red;
`;

const SimpleVar = styled.div.attrs(someVar)`
  color: red;
`;
const FuncCalled = styled.div.attrs(someFunc())`
  color: red;
`;
const FullFun = styled.div.attrs(() => {
  return {};
})`
  color: red;
`;

const VarExtraParens = styled.div.attrs(someVar)`
  color: red;
`;

const WithoutAttrs = styled.div`
  color: red;
  background-color: white;
  padding: ${(p) => p.color};
`;

const Roaot = styled.div.attrs((props) => ({
  "data-status": `${props.status}`,
}))`
  display: block;
  height: 100%;
`;

const WithoutAttrs2 = styled.div`
  padding: ${(p) => p.color};
`;

const WithAttrsWithReturnInCurly = styled.div.attrs(() => {
  return {};
})`
  color: red;
`;

const WithAttrsWithShortHandReturn = styled.div.attrs(() => ({}))`
  padding: ${(p) => p.color};
`;

const Rootr = styled.div`
  height: ${(props) => (props.label ? 72 : 48)}px;
`;

const StyledButton = styled(({ color1, ...other }) => (
  <Button {...other} classes={{ label: "label" }} />
))`
  border: 0;
  color: white;
`;

const Root = css`
  height: ${(props) => (props.label ? 72 : 48)}px;
`;
