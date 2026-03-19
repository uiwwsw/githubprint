export const PRODUCT_NAME = "GitHubPrint";
export const LEGACY_PRODUCT_NAME = "GitFolio";

export const PRODUCT_SLUG = "githubprint";
export const LEGACY_PRODUCT_SLUG = "gitfolio";

export const LOCALE_HEADER_NAME = "x-githubprint-locale";
export const LEGACY_LOCALE_HEADER_NAME = "x-gitfolio-locale";

export function buildProductStorageKey(suffix: string) {
  return `${PRODUCT_SLUG}-${suffix}`;
}

