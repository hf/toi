export function validate(
  email: string,
  options?: {
    errorLevel?: boolean;
    tldBlacklist?: string[];
    tldWhitelist?: string[];
    allowUnicode?: boolean;
    minDomainAtoms: number;
  }
): boolean | number;
