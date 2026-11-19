const A = styled.div<Props>(({ theme }) => `color: red;`);
const B = styled.div<{ a: number }>(({ theme }) => `color: red;`);
const C = styled.div<Props>(($props) => `color: red;`);
const sentinel = 1;
