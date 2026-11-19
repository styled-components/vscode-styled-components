const A = styled.div`
  background: url(${img});
  background: url(${(p) => p.src}) no-repeat;
  background: url("${img}");
  background: url(img-${n}.png);
  background: url('${img}');
  font-family: var(--a, "${font}");
  content: attr(data-a "${text}");
`;
const sentinel = 1;
