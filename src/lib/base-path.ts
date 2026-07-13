// Next.js applies the configured basePath ("/sheetup") automatically to
// <Link> and router navigation, but NOT to raw fetch(), <a href>, or
// <img src>. Those must be prefixed manually so the app works both
// standalone (served under /sheetup) and behind the portal proxy.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBasePath = (path: string) => `${BASE_PATH}${path}`;
