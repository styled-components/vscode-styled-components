const NewCompWithString = CompWithComponent.withComponent("span").extend`
  color: green;
`;

const NewCompWithString = CompWithComponent.withComponent("span")`
  color: green;
`;

const NewCompWithStringOneLine = CompWithComponent.withComponent(
  "span"
)`color: green;`;

const NewCompWithComponent = CompWithComponent.withComponent(OtherComp)`
  color: green;
`;
