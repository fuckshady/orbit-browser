export function resolveInput(input: string, engine = "Google"): string {
  const value = input.trim();
  if (!value || value.length > 8192)
    throw new Error("Dirección vacía o demasiado larga");
  if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^localhost:\d/i.test(value)) {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol))
      throw new Error("Solo se permiten direcciones HTTP y HTTPS");
    return u.href;
  }
  if (
    /^(localhost(:\d+)?|\[::1\](:\d+)?|[^\s/]+\.[^\s/]+)(\/[^\s]*)?$/.test(
      value,
    )
  )
    return new URL(
      `${/^localhost|^127\./.test(value) ? "http" : "https"}://${value}`,
    ).href;
  return (
    ({
      Google: "https://www.google.com/search?q=",
      DuckDuckGo: "https://duckduckgo.com/?q=",
      Bing: "https://www.bing.com/search?q=",
    }[engine] ?? "https://www.google.com/search?q=") + encodeURIComponent(value)
  );
}
