import rawPatternFile from "../syntaxes/styled-components.json";
export const patterns = rawPatternFile.patterns;

/**
 * replaces POSIX regex with javascript compatible regex
 * @param regex POSIX regex to convert
 * @returns converted regex
 */
export const normalizeRegex = (regex: string) => {
  // alnum
  let out = regex.replace(/\[:alnum:\]/g, "a-zA-Z0-9");
  // alpha
  out = out.replace(/\[:alpha:\]/g, "a-zA-Z");
  // ascii
  out = out.replace(/\[:ascii:\]/g, "\\x00-\\x7F");
  // blank
  out = out.replace(/\[:blank:\]/g, " \\t");
  // cntrl
  out = out.replace(/\[:cntrl:\]/g, "\\x00-\\x1F\\x7F");
  // digit
  out = out.replace(/\[:digit:\]/g, "0-9");
  // graph
  out = out.replace(/\[:graph:\]/g, "\\x21-\\x7E");
  // lower
  out = out.replace(/\[:lower:\]/g, "a-z");
  // print
  out = out.replace(/\[:print:\]/g, "\\x20-\\x7E");
  // punct
  out = out.replace(
    /\[:punct:\]/g,
    "!\"\\#$%&'()*+,\\-./:;<=>?@\\[\\\\\\]^_‘{|}~"
  );
  // space
  out = out.replace(/\[:space:\]/g, " \\t\\r\\n\\v\\f");
  // upper
  out = out.replace(/\[:upper:\]/g, "A-Z");
  // word
  out = out.replace(/\[:word:\]/g, "a-zA-Z0-9_");
  // xdigit
  out = out.replace(/\[:xdigit:\]/g, "a-fA-F0-9");

  return out;
};
