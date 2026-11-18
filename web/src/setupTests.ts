import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia. Provide a default (wide viewport) so
// components that read it render; tests that need a narrow viewport override it.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
