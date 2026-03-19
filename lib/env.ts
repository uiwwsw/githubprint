function readRawEnv(name: string) {
  return process.env[name]?.trim();
}

export function readEnv(name: string, legacyName?: string) {
  return readRawEnv(name) || (legacyName ? readRawEnv(legacyName) : "") || "";
}

export function isEnvEnabled(name: string, legacyName?: string) {
  return readEnv(name, legacyName) === "1";
}

