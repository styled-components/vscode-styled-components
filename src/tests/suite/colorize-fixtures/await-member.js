async function load() {
  const A = (await import("styled-components")).styled.div`
    color: red;
  `;
  const B = (await import("styled-components")).styled(Button).attrs({ b: 2 })`
    margin: 0;
  `;
  const C = items[0].styled.div`
    padding: 0;
  `;
}
const sentinel = 1;
