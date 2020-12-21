import styled, { css } from 'styled-components';

const myColor = '#333';

export const setMediaQuery = (breakpoint) => {
  switch (breakpoint) {
    case 'small':
      return (style) => `@media (max-width: 800px) { ${style} }`;
    case 'medium':
      return (style) => `@media (min-width: 801px) (max-width: 1200) { ${style} }`;

    default:
      return (style) => `@media (min-width: 1201px) { ${style} }`;
  }
};

const box1 = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-column: 6/11;
  color: ${myColor};
  color: red;
  ${
    setMediaQuery('big')(css`
      display: grid;
      color: ${myColor};
      color: red;
      grid-column: 6/11;
      grid-template-columns: repeat(9, 1fr);
    `)
  }

  ${
    setMediaQuery('medium')(css`
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-column: 6/11;
      color: red;
    `)
  }
`;

const box2 = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-column: 6/11;
  color: ${myColor};
`;

export default {
  box1,
  box2,
};