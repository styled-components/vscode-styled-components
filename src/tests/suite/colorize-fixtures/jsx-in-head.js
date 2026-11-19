// A Material-UI wrapper: JSX inside the head keeps its JSX scopes
const StyledButton = styled(({ color, ...other }) => (
  <Button {...other} />
))`
  color: red;
`;
function App() { return <div className="a">hi</div>; }

const Q = styled(forwardRef((p, ref) => <div ref={ref} />))`
  color: red;
`;
const sentinel = 1;
