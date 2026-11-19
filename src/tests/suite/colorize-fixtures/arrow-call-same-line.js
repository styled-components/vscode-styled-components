const A = styled.div(({ theme }) => `color: red;`);
const B = styled(Button)(({ theme }) => `color: red;`);
const C = styled.div.attrs({ a: 1 })(({ theme }) => `color: red;`);
const D = styled.div(($props) => `color: red;`);
const sentinel = 1;
