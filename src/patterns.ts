// TODO import directly from the grammar file?

export const patterns = [
  {
    begin:
      "([\\s\\S][sS][tT][yY][lL][eE][dD](?:<.+>(?=\\())?(?:\\…\\s*<.+>)?\\(?)\\s*(\\([\\{\\}\\w,\\:\\s]+?\\)\\s*=>\\s*)?(`)",
    end: "`",
  },
  {
    begin:
      "(css|keyframes|injectGlobal|createGlobalStyles?|stylesheet)(<.+>)?(`)",
    end: "`",
  },
  { begin: "(?:}>|\\)\\))(`)", end: "`" },
  { begin: "(.+)(\\.)(extend)(`)", end: "`" },
  {
    begin:
      "([_$[:alpha:]][_$[:alnum:]]*\\.withComponent\\((?:['…pha:]][_$\\.[:alnum:]]*)\\))\\s*(?:(\\.)(extend))?(`)",
    end: "`",
  },
  {
    begin:
      "([mM][eE][dD][iI][aA]\\.[[:alpha:]][[:alnum:]]*(?:\\(.*?\\))?)\\s*(`)",
    end: "`",
  },
  {
    begin:
      "(?:([\\s\\S][sS][tT][yY][lL][eE][dD](?:<[_$[:alpha:]…extend))(?=\\.(attrs|withConfig)\\s*(?:<.+>)?\\s*\\()",
    end: "(?<!\\G)(?<=`)",
  },
  { begin: "\\s*(css)(=)(\\{)(`)", end: "(`)(\\})\\s*" },
  { begin: "(.+)?(\\.)?(keyframes)(`)", end: "`" },
  {
    begin: "(?<=<style\\s(?:jsx|jsx\\s+global|global\\s+jsx)+\\>\\{)`",
    end: "`(?=\\}\\<\\/style\\>)",
  },
];
