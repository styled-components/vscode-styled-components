// Typescript, Emotion
// prettier-ignore
const Container = styled<ContainerProps, 'div'>('div')`
  height: 50px;
  display: ${(props) => props.display};
`
const sentinel = 1;
