const Card = styled.div`
  color: oklch(62% 0.2 250);
  background: oklab(60% 0.1 -0.1);
  border-color: lab(50% 40 59.5);
  outline-color: lch(52% 58 340);
  fill: hwb(194 0% 0%);
  stroke: color(display-p3 1 0.5 0);
  accent-color: color-mix(in oklch, var(--brand) 40%, white);
  caret-color: light-dark(#111, #eee);
  width: clamp(10rem, 50%, 40rem);
  height: min(10px, 5vh);
  margin: max(1rem, 2vw);
  order: sibling-index();
  z-index: sibling-count();
  padding: calc(1px + sin(30deg) * 2);
  top: abs(-4px);
  left: round(up, 13px, 5px);
`;

const Mixed = styled.div`
  color: light-dark(rgb(0 0 0 / 80%), hsl(0 0% 100%));
  opacity: calc(sibling-index() / sibling-count());
  width: clamp(1px, light-dark(2px, 3px), 4px);
  margin: min(${(props) => props.gap}px, 1rem);
  background: light-dark(${lightColor}, ${darkColor});
`;
const sentinel = 1;
