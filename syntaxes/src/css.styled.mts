import type { Rule } from "./grammarTypes.ts";
import { ownCss } from "./ownCss.mts";

// A property value ends at ";" or before the character that closes the surrounding block, call, or template, so a last declaration without ";" leaves the closing backtick to the template rule.
const valueEnd = String.raw`\s*(;|(?=}|\)|${"`"}))`;

// One character of a class, id, or attribute name: a plain identifier character, an escape, or a "${...}" interpolation. Used under (?x).
const IDENTIFIER_UNIT = String.raw`[-a-zA-Z_0-9]|[^\x00-\x7F]       # Valid identifier characters
    | \\(?:[0-9a-fA-F]{1,6}|.)       # Escape sequence
    | \$\{[^{}]*\}                   # Interpolation`;

// What may follow a class, id, or parent-selector suffix name. Used under (?x).
const SELECTOR_END = String.raw`(?= $                                  # - End of the line
  | [\s,.\#)\[:{>+~|]               # - Another selector
  | /\*                               # - A block comment
)`;

// The ".foo", "#foo", and "&foo" selectors: a lead that names the selector kind, then a name that ends at the next selector.
const identifierSelector = (lead: string) => String.raw`(?x)
${lead}
(
  (?: ${IDENTIFIER_UNIT}
  )+
)                                      # Followed by either:
${SELECTOR_END}`;

// Sub-patterns of a name capture; "invalid" scopes a stray "$" or "}".
const nameParts = (invalid: string): Rule[] => [
  { include: "#interpolation" },
  {
    match: String.raw`\\([0-9a-fA-F]{1,6}|.)`,
    name: "constant.character.escape.scss",
  },
  { match: String.raw`\$|}`, name: invalid },
];

const nameCapture = (invalid: string) => ({ patterns: nameParts(invalid) });

// A quoted string; a "@keyframes" name opens after the at-rule and scopes its content as the animation name.
const quotedString = (
  quote: string,
  kind: "double" | "single",
  keyframesName = false,
): Rule => ({
  begin: keyframesName ? String.raw`(?<=@keyframes)\s+(${quote})` : quote,
  beginCaptures: {
    [keyframesName ? 1 : 0]: {
      name: "punctuation.definition.string.begin.scss",
    },
  },
  end: quote,
  endCaptures: { 0: { name: "punctuation.definition.string.end.scss" } },
  name: `string.quoted.${kind}.scss`,
  ...(keyframesName && { contentName: "entity.name.function.scss" }),
  patterns: [
    {
      match: String.raw`\\(\h{1,6}|.)`,
      name: "constant.character.escape.scss",
    },
    { include: "#interpolation" },
  ],
});

export const cssStyledGrammar = ownCss({
  $schema:
    "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  name: "CSS (Styled Components)",
  patterns: [
    {
      include: "#general",
    },
    {
      include: "#rules",
    },
    {
      include: "#property_list",
    },
    {
      include: "#at_rule_media",
    },
    {
      include: "#at_rule_import",
    },
    {
      include: "#at_rule_fontface",
    },
    {
      include: "#at_rule_page",
    },
    {
      include: "#at_rule_keyframes",
    },
    {
      include: "#at_rule_supports",
    },
    {
      include: "#at_rule_custom_single",
    },
    {
      include: "#at_rule_custom",
    },
    {
      match: ";",
      name: "punctuation.terminator.rule.css",
    },
    {
      include: "#properties",
    },
  ],
  repository: {
    at_rule_fontface: {
      patterns: [
        {
          begin: String.raw`^\s*((@)font-face\b)`,
          beginCaptures: {
            1: {
              name: "keyword.control.at-rule.fontface.scss",
            },
            2: {
              name: "punctuation.definition.keyword.scss",
            },
          },
          end: String.raw`\s*(?={)`,
          name: "meta.at-rule.fontface.scss",
          patterns: [
            {
              include: "#function_attributes",
            },
          ],
        },
      ],
    },
    at_rule_import: {
      begin: String.raw`\s*((@)import\b)\s*`,
      captures: {
        1: {
          name: "keyword.control.at-rule.import.scss",
        },
        2: {
          name: "punctuation.definition.keyword.scss",
        },
      },
      end: String.raw`\s*((?=;)|(?=}))`,
      name: "meta.at-rule.import.scss",
      patterns: [
        {
          include: "#interpolation",
        },
        {
          include: "#string_single",
        },
        {
          include: "#string_double",
        },
        {
          include: "source.css#functions",
        },
      ],
    },
    at_rule_keyframes: {
      begin: String.raw`(?<=^|\s)(@)(?:-(?:webkit|moz)-)?keyframes\b`,
      beginCaptures: {
        0: {
          name: "keyword.control.at-rule.keyframes.scss",
        },
        1: {
          name: "punctuation.definition.keyword.scss",
        },
      },
      end: "(?<=})",
      name: "meta.at-rule.keyframes.scss",
      patterns: [
        {
          match: String.raw`(?<=@keyframes)\s+((?:[_A-Za-z][-\w]|-[_A-Za-z])[-\w]*)`,
          captures: {
            1: {
              name: "entity.name.function.scss",
            },
          },
        },
        quotedString('"', "double", true),
        quotedString("'", "single", true),
        {
          begin: "{",
          beginCaptures: {
            0: {
              name: "punctuation.section.keyframes.begin.scss",
            },
          },
          end: "}",
          endCaptures: {
            0: {
              name: "punctuation.section.keyframes.end.scss",
            },
          },
          patterns: [
            {
              include: "#keyframes_body",
            },
          ],
        },
      ],
    },
    // The keyframe selectors and nested rules between the braces of "@keyframes"; the single-line keyframes template includes it too.
    keyframes_body: {
      patterns: [
        {
          captures: {
            1: { name: "entity.other.attribute-name.scss" },
            2: { name: "entity.other.attribute-name.scss" },
          },
          match: String.raw`(?xi)
(?<![\w-]) (from|to) (?![\w-])         # Keywords for 0% | 100%
|
([-+]?(?:\d+(?:\.\d+)?|\.\d+)%)     # Percentile value`,
        },
        {
          include: "#interpolation",
        },
        {
          include: "#property_list",
        },
        {
          include: "#rules",
        },
      ],
    },
    at_rule_media: {
      patterns: [
        {
          begin: String.raw`^\s*((@)media)\b`,
          beginCaptures: {
            1: {
              name: "keyword.control.at-rule.media.scss",
            },
            2: {
              name: "punctuation.definition.keyword.scss",
            },
          },
          end: String.raw`\s*(?={)`,
          name: "meta.at-rule.media.scss",
          patterns: [
            {
              include: "#comment_block",
            },
            {
              include: "#comment_line",
            },
            {
              match: String.raw`\b(only)\b`,
              name: "keyword.control.operator.css.scss",
            },
            {
              begin: String.raw`\(`,
              beginCaptures: {
                0: {
                  name: "punctuation.definition.media-query.begin.bracket.round.scss",
                },
              },
              end: String.raw`\)`,
              endCaptures: {
                0: {
                  name: "punctuation.definition.media-query.end.bracket.round.scss",
                },
              },
              name: "meta.property-list.media-query.scss",
              patterns: [
                {
                  begin: "(?<![-a-z])(?=[-a-z])",
                  end: "$|(?![-a-z])",
                  name: "meta.property-name.media-query.scss",
                  patterns: [
                    {
                      include: "source.css#media-features",
                    },
                    {
                      include: "source.css#property-names",
                    },
                  ],
                },
                {
                  begin: String.raw`(:)\s*(?!(\s*{))`,
                  beginCaptures: {
                    1: {
                      name: "punctuation.separator.key-value.scss",
                    },
                  },
                  end: valueEnd,
                  endCaptures: {
                    1: {
                      name: "punctuation.terminator.rule.scss",
                    },
                  },
                  contentName: "meta.property-value.media-query.scss",
                  patterns: [
                    {
                      include: "#general",
                    },
                    {
                      include: "#property_values",
                    },
                  ],
                },
              ],
            },
            {
              include: "#interpolation",
            },
            {
              include: "#conditional_operators",
            },
            {
              include: "source.css#media-types",
            },
          ],
        },
      ],
    },
    at_rule_page: {
      patterns: [
        {
          begin: String.raw`^\s*((@)page)(?=:|\s)\s*([-:\w]*)`,
          captures: {
            1: {
              name: "keyword.control.at-rule.page.scss",
            },
            2: {
              name: "punctuation.definition.keyword.scss",
            },
            3: {
              name: "entity.name.function.scss",
            },
          },
          end: String.raw`\s*(?={)`,
          name: "meta.at-rule.page.scss",
        },
      ],
    },
    at_rule_supports: {
      begin: String.raw`(?<=^|\s)(@)supports\b`,
      captures: {
        0: {
          name: "keyword.control.at-rule.supports.scss",
        },
        1: {
          name: "punctuation.definition.keyword.scss",
        },
      },
      end: "(?={)|$",
      name: "meta.at-rule.supports.scss",
      patterns: [
        {
          include: "#logical_operators",
        },
        {
          include: "#properties",
        },
        {
          match: String.raw`\(`,
          name: "punctuation.definition.condition.begin.bracket.round.scss",
        },
        {
          match: String.raw`\)`,
          name: "punctuation.definition.condition.end.bracket.round.scss",
        },
      ],
    },
    at_rule_custom_single: {
      begin: String.raw`(?i)(?=@[\w-]+[^;]+;s*$)`,
      end: String.raw`(?<=;)(?!\G)`,
      patterns: [
        {
          begin: String.raw`(?i)\G(@)[\w-]+`,
          beginCaptures: {
            0: {
              name: "keyword.control.at-rule.css",
            },
            1: {
              name: "punctuation.definition.keyword.css",
            },
          },
          end: ";",
          endCaptures: {
            0: {
              name: "punctuation.terminator.rule.css",
            },
          },
          name: "meta.at-rule.header.css",
        },
      ],
    },
    at_rule_custom: {
      begin: String.raw`(?i)(?=@[\w-]+(\s|\(|{|/\*|$))`,
      end: String.raw`(?<=})(?!\G)`,
      patterns: [
        {
          begin: String.raw`(?i)\G(@)[\w-]+`,
          beginCaptures: {
            0: {
              name: "keyword.control.at-rule.css",
            },
            1: {
              name: "punctuation.definition.keyword.css",
            },
          },
          end: String.raw`(?=\s*[{;])`,
          name: "meta.at-rule.header.css",
        },
        {
          begin: "{",
          beginCaptures: {
            0: {
              name: "punctuation.section.begin.bracket.curly.css",
            },
          },
          end: "}",
          endCaptures: {
            0: {
              name: "punctuation.section.end.bracket.curly.css",
            },
          },
          name: "meta.at-rule.body.css",
          patterns: [
            {
              include: "$self",
            },
          ],
        },
      ],
    },
    comment_block: {
      begin: String.raw`/\*`,
      beginCaptures: {
        0: {
          name: "punctuation.definition.comment.scss",
        },
      },
      end: String.raw`\*/`,
      endCaptures: {
        0: {
          name: "punctuation.definition.comment.scss",
        },
      },
      name: "comment.block.scss",
    },
    comment_line: {
      begin: "//",
      beginCaptures: {
        0: {
          name: "punctuation.definition.comment.scss",
        },
      },
      end: String.raw`\n`,
      name: "comment.line.scss",
    },
    constant_important: {
      match: "!important",
      name: "keyword.other.important.scss",
    },
    constant_mathematical_symbols: {
      match: String.raw`\b(\+|-|\*|/)\b`,
      name: "support.constant.mathematical-symbols.scss",
    },
    function_attributes: {
      patterns: [
        {
          match: ":",
          name: "punctuation.separator.key-value.scss",
        },
        {
          include: "#general",
        },
        {
          include: "#property_values",
        },
        {
          match: String.raw`[={}\?;@]`,
          name: "invalid.illegal.scss",
        },
      ],
    },
    general: {
      patterns: [
        {
          include: "#interpolation",
        },
        {
          include: "#comment_block",
        },
        {
          include: "#comment_line",
        },
      ],
    },
    interpolation: {
      contentName: "meta.embedded.line.ts",
      begin: "\\${",
      beginCaptures: {
        0: {
          name: "punctuation.definition.interpolation.begin.bracket.curly.scss punctuation.definition.template-expression.begin.js",
        },
      },
      end: "}",
      endCaptures: {
        0: {
          name: "punctuation.definition.interpolation.end.bracket.curly.scss punctuation.definition.template-expression.end.js",
        },
      },
      name: "variable.interpolation.scss",
      patterns: [
        {
          include: "source.ts#expression",
        },
      ],
    },
    conditional_operators: {
      patterns: [
        {
          include: "#comparison_operators",
        },
        {
          include: "#logical_operators",
        },
      ],
    },
    comparison_operators: {
      match: "==|!=|<=|>=|<|>",
      name: "keyword.operator.comparison.scss",
    },
    logical_operators: {
      match: String.raw`\b(not|or|and)\b`,
      name: "keyword.operator.logical.scss",
    },
    properties: {
      patterns: [
        {
          begin: "(?<![-a-z])(?=[-a-z])",
          end: "$|(?![-a-z])",
          name: "meta.property-name.scss",
          patterns: [
            {
              include: "source.css#property-names",
            },
            {
              include: "source.css#media-features",
            },
          ],
        },
        {
          include: "#interpolation",
        },
        {
          begin: String.raw`(:)\s*(?!(\s*{))`,
          beginCaptures: {
            1: {
              name: "punctuation.separator.key-value.scss",
            },
          },
          end: valueEnd,
          endCaptures: {
            1: {
              name: "punctuation.terminator.rule.scss",
            },
          },
          contentName: "meta.property-value.scss",
          patterns: [
            {
              include: "#general",
            },
            {
              include: "#property_values",
            },
          ],
        },
      ],
    },
    property_list: {
      begin: "{",
      beginCaptures: {
        0: {
          name: "punctuation.section.property-list.begin.bracket.curly.scss",
        },
      },
      end: "}",
      endCaptures: {
        0: {
          name: "punctuation.section.property-list.end.bracket.curly.scss",
        },
      },
      name: "meta.property-list.scss",
      patterns: [
        {
          include: "#rules",
        },
        {
          include: "#properties",
        },
        {
          include: "$self",
        },
      ],
    },
    property_values: {
      patterns: [
        {
          include: "#string_single",
        },
        {
          include: "#string_double",
        },
        {
          include: "source.css#functions",
        },
        {
          include: "#constant_important",
        },
        {
          include: "source.css#numeric-values",
        },
        {
          include: "source.css#property-keywords",
        },
        {
          include: "source.css#color-keywords",
        },
        {
          include: "source.css#property-names",
        },
        {
          include: "#constant_mathematical_symbols",
        },
        {
          begin: String.raw`\(`,
          beginCaptures: {
            0: {
              name: "punctuation.definition.begin.bracket.round.scss",
            },
          },
          end: String.raw`\)`,
          endCaptures: {
            0: {
              name: "punctuation.definition.end.bracket.round.scss",
            },
          },
          patterns: [
            {
              include: "#general",
            },
            {
              include: "#property_values",
            },
          ],
        },
      ],
    },
    rules: {
      patterns: [
        {
          include: "#general",
        },
        {
          include: "#at_rule_media",
        },
        {
          include: "#selectors",
        },
      ],
    },
    selector_attribute: {
      match: String.raw`(?xi)
(\[)
\s*
(
  (?: ${IDENTIFIER_UNIT}
  )+?
)
(?:
  \s*([~|^$*]?=)\s*
  (?:
    (
      (?: ${IDENTIFIER_UNIT}
      )+
    )
    |
    ((")(.*?)("))
    |
    ((')(.*?)('))
  )
)?
\s*
(\])`,
      name: "meta.attribute-selector.scss",
      captures: {
        1: {
          name: "punctuation.definition.attribute-selector.begin.bracket.square.scss",
        },
        2: {
          name: "entity.other.attribute-name.attribute.scss",
          ...nameCapture("invalid.illegal.scss"),
        },
        3: {
          name: "keyword.operator.scss",
        },
        4: {
          name: "string.unquoted.attribute-value.scss",
          ...nameCapture("invalid.illegal.scss"),
        },
        5: {
          name: "string.quoted.double.attribute-value.scss",
        },
        6: {
          name: "punctuation.definition.string.begin.scss",
        },
        7: nameCapture("invalid.illegal.scss"),
        8: {
          name: "punctuation.definition.string.end.scss",
        },
        9: {
          name: "string.quoted.single.attribute-value.scss",
        },
        10: {
          name: "punctuation.definition.string.begin.scss",
        },
        11: nameCapture("invalid.illegal.scss"),
        12: {
          name: "punctuation.definition.string.end.scss",
        },
        13: {
          name: "punctuation.definition.attribute-selector.end.bracket.square.scss",
        },
      },
    },
    selector_class: {
      match: identifierSelector(String.raw`(\.)`),
      name: "entity.other.attribute-name.class.css",
      captures: {
        1: {
          name: "punctuation.definition.entity.css",
        },
        2: nameCapture("invalid.illegal.scss"),
      },
    },
    selector_custom: {
      match: String.raw`\b([a-zA-Z0-9]+(-[a-zA-Z0-9]+)+)(?=\.|\s++[^:]|\s*[,\[{]|:(link|visited|hover|active|focus|focus-visible|target|lang|disabled|enabled|checked|indeterminate|root|nth-(child|last-child|of-type|last-of-type)|first-child|last-child|first-of-type|last-of-type|only-child|only-of-type|empty|not|valid|invalid|user-invalid)(\([0-9A-Za-z]*\))?)`,
      name: "entity.name.tag.custom.scss",
    },
    selector_id: {
      match: identifierSelector(String.raw`(\#)`),
      name: "entity.other.attribute-name.id.css",
      captures: {
        1: {
          name: "punctuation.definition.entity.css",
        },
        2: nameCapture("invalid.illegal.identifier.scss"),
      },
    },
    parent_selector_suffix: {
      match: identifierSelector("(?<=&)"),
      name: "entity.other.attribute-name.parent-selector-suffix.css",
      captures: {
        1: {
          name: "punctuation.definition.entity.css",
        },
        2: nameCapture("invalid.illegal.identifier.scss"),
      },
    },
    selector_pseudo_class: {
      patterns: [
        {
          begin: String.raw`((:)\bnth-(?:child|last-child|of-type|last-of-type))(\()`,
          beginCaptures: {
            1: {
              name: "entity.other.attribute-name.pseudo-class.css",
            },
            2: {
              name: "punctuation.definition.entity.css",
            },
            3: {
              name: "punctuation.definition.pseudo-class.begin.bracket.round.css",
            },
          },
          end: String.raw`\)`,
          endCaptures: {
            0: {
              name: "punctuation.definition.pseudo-class.end.bracket.round.css",
            },
          },
          patterns: [
            {
              include: "#interpolation",
            },
            {
              match: String.raw`(?i)[+-]?(\d+n?|n)(\s*[+-]\s*\d+)?`,
              name: "constant.numeric.css",
            },
            {
              match: "(?i)even|odd",
              name: "support.constant.parity.css",
            },
            {
              match: String.raw`(?<=\d)n\b|\b(n|even|odd)\b`,
              name: "constant.other.scss",
            },
            {
              match: String.raw`\w+`,
              name: "invalid.illegal.scss",
            },
          ],
        },
        {
          include: "source.css#pseudo-classes",
        },
        {
          include: "source.css#pseudo-elements",
        },
        {
          include: "source.css#functional-pseudo-classes",
        },
      ],
    },
    selectors: {
      patterns: [
        {
          include: "#interpolation",
        },
        {
          include: "source.css#tag-names",
        },
        {
          include: "#selector_custom",
        },
        {
          include: "#selector_class",
        },
        {
          include: "#selector_id",
        },
        {
          include: "#selector_pseudo_class",
        },
        {
          include: "#tag_wildcard",
        },
        {
          include: "#tag_parent_reference",
        },
        {
          include: "source.css#pseudo-elements",
        },
        {
          include: "#selector_attribute",
        },
        {
          include: "#parent_selector_suffix",
        },
      ],
    },
    string_double: quotedString('"', "double"),
    string_single: quotedString("'", "single"),
    tag_parent_reference: {
      match: "&",
      name: "entity.name.tag.reference.scss",
    },
    tag_wildcard: {
      match: String.raw`\*`,
      name: "entity.name.tag.wildcard.scss",
    },
  },
  scopeName: "source.css.styled",
});
