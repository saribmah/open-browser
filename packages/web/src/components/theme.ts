import { registerCustomTheme } from "@pierre/precision-diffs"
import type { ThemeRegistrationResolved } from "@pierre/precision-diffs"

export function registerOpenCodeTheme() {
  registerCustomTheme("OpenCode", () => {
    return Promise.resolve({
      name: "OpenCode",
      colors: {
        "editor.background": "transparent",
        "editor.foreground": "#e4e4e7",
        "gitDecoration.addedResourceForeground": "#22c55e",
        "gitDecoration.deletedResourceForeground": "#ef4444",
      },
      tokenColors: [
        {
          scope: ["comment", "punctuation.definition.comment", "string.comment"],
          settings: {
            foreground: "#71717a",
          },
        },
        {
          scope: ["entity.other.attribute-name"],
          settings: {
            foreground: "#c084fc",
          },
        },
        {
          scope: ["constant", "entity.name.constant", "variable.other.constant", "variable.language", "entity"],
          settings: {
            foreground: "#f472b6",
          },
        },
        {
          scope: ["entity.name", "meta.export.default", "meta.definition.variable"],
          settings: {
            foreground: "#38bdf8",
          },
        },
        {
          scope: ["meta.object.member"],
          settings: {
            foreground: "#e4e4e7",
          },
        },
        {
          scope: [
            "variable.parameter.function",
            "meta.jsx.children",
            "meta.block",
            "meta.tag.attributes",
            "entity.name.constant",
            "meta.embedded.expression",
            "meta.template.expression",
          ],
          settings: {
            foreground: "#a1a1aa",
          },
        },
        {
          scope: ["entity.name.function", "support.type.primitive"],
          settings: {
            foreground: "#fbbf24",
          },
        },
        {
          scope: ["support.class.component"],
          settings: {
            foreground: "#38bdf8",
          },
        },
        {
          scope: "keyword",
          settings: {
            foreground: "#f472b6",
          },
        },
        {
          scope: [
            "keyword.operator",
            "storage.type.function.arrow",
            "punctuation.separator.key-value.css",
          ],
          settings: {
            foreground: "#a1a1aa",
          },
        },
        {
          scope: ["storage", "storage.type"],
          settings: {
            foreground: "#f472b6",
          },
        },
        {
          scope: [
            "string",
            "punctuation.definition.string",
            "string punctuation.section.embedded source",
            "entity.name.tag",
          ],
          settings: {
            foreground: "#4ade80",
          },
        },
        {
          scope: "support",
          settings: {
            foreground: "#e4e4e7",
          },
        },
        {
          scope: ["support.type.object.module", "variable.other.object", "support.type.property-name.css"],
          settings: {
            foreground: "#38bdf8",
          },
        },
        {
          scope: "meta.property-name",
          settings: {
            foreground: "#c084fc",
          },
        },
        {
          scope: "variable",
          settings: {
            foreground: "#e4e4e7",
          },
        },
        {
          scope: "variable.other",
          settings: {
            foreground: "#e4e4e7",
          },
        },
        {
          scope: [
            "invalid.broken",
            "invalid.illegal",
            "invalid.unimplemented",
            "invalid.deprecated",
          ],
          settings: {
            foreground: "#ef4444",
          },
        },
        {
          scope: "string source",
          settings: {
            foreground: "#e4e4e7",
          },
        },
        {
          scope: "string variable",
          settings: {
            foreground: "#f472b6",
          },
        },
        {
          scope: [
            "source.regexp",
            "string.regexp",
          ],
          settings: {
            foreground: "#fb923c",
          },
        },
        {
          scope: "support.constant",
          settings: {
            foreground: "#e4e4e7",
          },
        },
        {
          scope: "support.variable",
          settings: {
            foreground: "#e4e4e7",
          },
        },
      ],
      semanticTokenColors: {
        comment: "#71717a",
        string: "#4ade80",
        number: "#f472b6",
        regexp: "#fb923c",
        keyword: "#f472b6",
        variable: "#e4e4e7",
        parameter: "#e4e4e7",
        property: "#c084fc",
        function: "#fbbf24",
        method: "#fbbf24",
        type: "#38bdf8",
        class: "#38bdf8",
        namespace: "#38bdf8",
        enumMember: "#e4e4e7",
      },
    } as unknown as ThemeRegistrationResolved)
  })
}
