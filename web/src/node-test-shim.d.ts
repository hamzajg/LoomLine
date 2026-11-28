// The test environment runs in Node (vitest), but @types/node is not a
// project dependency. Declare only what the token test reads.
declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
}
