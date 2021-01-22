function helper(cssRules) {
  return css`
    ${cssRules}
  `;
}

const Component1 = styled.div`
  ${helper(css`
    width: 100%;
  `)}
`;

const Component2 = styled.div`
  ${helper(css`
    width: 100%;
  `)}
`;

const Component3 = styled.div`
  ${helper(css`
    width: 100%;
  `)}
`;
