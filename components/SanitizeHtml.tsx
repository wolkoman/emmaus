import sanitize from "sanitize-html";

export const sanitizeOptions = {
  allowedTags: [
    "u",
    "b",
    "strong",
    "em",
    "a",
    "br",
    "h1",
    "h2",
    "h3",
    "p",
    "strong",
    "div",
    "li",
    "ul",
    "ol",
    "img",
  ],
  allowedAttributes: {
    a: ["href"],
    img: ["alt", "src"],
    div: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "data"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
};
export const SanitizeHTML = ({
  html,
  textOnly,
  ...divProps
}: {
  html: string;
  textOnly?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const Element = textOnly ? "p" : "div";
  return (
    <Element
      {...(divProps as any)}
      dangerouslySetInnerHTML={{
        __html: sanitize(
          html,
          textOnly ? { allowedTags: [] } : sanitizeOptions,
        ),
      }}
      className={`custom-html ${divProps.className || ""}`}
    />
  );
};
