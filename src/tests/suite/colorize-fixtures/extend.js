const Comp = styled.div`
  color: red;
`;

const NewComp = Comp.extend`
  color: green;
`;

const foo = {
  bar: NewComp.extend`
    max-width: 100%;
  `
}

const Half = getFull().extend`
  max-width: 100%;
`
