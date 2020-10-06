// Functional Media Queries - https://www.styled-components.com/docs/advanced#media-templates
const sizes = {
  desktop: 992,
  tablet: 768,
  phone: 376
};

const media = Object.keys(sizes).reduce((acc, label) => {
  acc[label] = (...args) => css`
    @media (max-width: ${sizes[label] / 16}em) {
      ${css(...args)};
    }
  `;
});
const Input = styled.input.attrs({
  // we can define static props
  type: "password",

  // or we can define dynamic ones
  margin: props => props.size || "1em",
  padding: props => props.size || "1em"
})`
  color: palevioletred;
  font-size: 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;

  /* here we use the dynamically computed props */
  margin: ${props => props.margin};
  padding: ${props => props.padding};
`;

const mediaQuery = styled.div`
  background: palevioletred;

  ${media.desktop`
    background: red;
  `};

  ${media.breakAt("300px")`
    background: palevioletred;
  `} ${media.desktop(400)`
    background: coral;
  `};
`;
const Input = styled.input.attrs({
  // we can define static props
  type: "password",

  // or we can define dynamic ones
  margin: props => props.size || "1em",
  padding: props => props.size || "1em"
})`
  color: palevioletred;
  font-size: 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;

  /* here we use the dynamically computed props */
  margin: ${props => props.margin};
  padding: ${props => props.padding};
`;

const Input = styled.input.attrs({
  // we can define static props
  type: "password",

  // or we can define dynamic ones
  margin: props => props.size || "1em",
  padding: props => props.size || "1em"
})`
  color: palevioletred;
  font-size: 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;

  ${media.desktop`
    background: red;
  `};

  ${media.breakAt("300px")`
    background: palevioletred;
  `} ${media.desktop(400)`
    background: coral;
  `};

  /* here we use the dynamically computed props */
  margin: ${props => props.margin};
  padding: ${props => props.padding};
`;
