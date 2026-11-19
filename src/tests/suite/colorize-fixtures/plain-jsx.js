// A name that looks like a tag inside JSX stays plain
const el = <Foo as={styled.div} title={`color: red`} />;

const rows = styled.rules.map((r) => (
  <Row key={r.id} label={`${r.name}`} />
));

import * as Styled from "./styles";
const A = () => (
  <Styled.Wrapper title={`a`}>
    {Styled.items.map((i) => <Styled.Item key={`k${i}`} />)}
    {Styled.icons.map((i) => (
      <Styled.Icon key={i} />
    ))}
  </Styled.Wrapper>
);
const s = `color: red`;
function App() { return <div className="a">hi</div>; }
const sentinel = 1;
