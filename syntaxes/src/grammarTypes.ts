// The TextMate grammar JSON shape (the keys these grammars use), shared by the generators and their tests.
// Partial: TypeScript infers the vendored CSS JSON's capture objects with optional undefined keys, which a plain Record rejects.
export type Captures = Partial<
  Record<string, { name?: string; patterns?: Rule[] }>
>;

export type Rule = {
  begin?: string;
  beginCaptures?: Captures;
  captures?: Captures;
  contentName?: string;
  end?: string;
  endCaptures?: Captures;
  include?: string;
  match?: string;
  name?: string;
  patterns?: Rule[];
  while?: string;
};

export type Grammar = {
  $schema?: string;
  fileTypes?: string[];
  injectionSelector?: string;
  name?: string;
  patterns: Rule[];
  repository: Record<string, Rule>;
  scopeName: string;
};
