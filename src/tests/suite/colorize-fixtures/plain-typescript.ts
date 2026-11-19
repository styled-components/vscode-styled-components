// Annotations and object-style generics stay plain
const x: Styled<
  Props
> = make();
const t = `color: red;`;

const A = styled(Button)<{
  a: string;
}>(({ a }) => ({ color: a }));
const B = styled(Button)<
  Props
>(({ a }) => ({ color: a }));

foo(() => ({

}))``
interface FooBar {
}
const s = `color: red;`;
const sentinel = 1;
