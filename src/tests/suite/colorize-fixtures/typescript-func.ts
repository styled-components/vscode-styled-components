const WithAttrsWithShortHandReturn = styled.div.attrs(() => ({ }))`
  /* styled here are still colored correctly */
  color: red;
  background-color: white;
  padding: ${(p) => p.color};
`;

const StyledButton = styled(({ color1, ...other }) => (
  <Button {...other} classes={{ label: 'label' }} />
))`
  border: 0;
  color: white;
`;

const Root = css<RootProps>`
  height: ${props => (props.label ? 72 : 48)}px;
`;
