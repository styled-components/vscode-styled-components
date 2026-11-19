// vscode-oniguruma's typings name these two types from TypeScript's DOM lib, which this repo does not load; Node's typings omit them.
declare namespace WebAssembly {
  type ImportValue = object | number;
  interface WebAssemblyInstantiatedSource {
    instance: object;
    module: object;
  }
}
