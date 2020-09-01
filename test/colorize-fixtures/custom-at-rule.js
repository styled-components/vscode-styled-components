const customAtRule = styled.div`
  display: flex;
  background-color: yellow;

  @apply flex-col justify-center items-center;

  @screen md {
    @apply bg-red-300;
  }

  @screen xl {
    background-color: red;
  }
`
