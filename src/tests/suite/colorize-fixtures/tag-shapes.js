// #196: styled(...) passed as a function argument
export default React.memo(styled.div`
  color: red;
`);
styled.div`
  color: red;
`;
const H = memo(styled(Button)`
  color: red;
`);

const A = $styled.div`
  color: red;
`;
const B = theme.styled.div`
  color: red;
`;
const C = theme.css`
  color: red;
`;

const Comp = cond
  ? styled.div`color: red;`
  : styled.span`color: red;`;

class X {
  static Wrapper = styled.div`
    color: red;
  `;
  render() { return 1; }
}

function make() {
  return styled.div`
    color: red;
  `;
}

const P = styled(motion(Button))`
  color: red;
`;
const R = (styled.div`
  color: red;
`);
const sentinel = 1;
