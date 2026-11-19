// A tag after a closer of an earlier line: the tag rule must not consume what the host needs to close its frame
function g() {
  return [Comp.extend`color: red;`];
}

function f() {
  return foo({ a: keyframes`from { color: red; }` });
}

const X = cond ? (
  a
) : Comp.extend`color: red;`;

const anims = [
  1, 2 ].concat(keyframes`from { color: red; }`);

const y = cond ? (
  a
) : keyframes`from { color: red; }`;

const z = cond ? (
  a
) : styled.div`color: red;`;
const sentinel = 1;
