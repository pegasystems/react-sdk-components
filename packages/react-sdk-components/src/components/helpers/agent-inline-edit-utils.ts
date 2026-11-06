export type CoachPConnectGetter = () => typeof PConnect;

export interface ParsedCaseLink {
  appName: string;
  caseTypeID: string;
  caseReferenceID: string;
  pegaServerUrl: string;
}

export interface ResolvedCaseLink extends ParsedCaseLink {
  insKey?: string;
  assignmentID?: string;
  className?: string;
}

export type CaseOpenStrategy = 'native' | 'webembed';

export const parseCaseLink = (href: string): ParsedCaseLink | undefined => {
  try {
    const parsedUrl = new URL(href, window.location.origin);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const appIndex = pathParts.indexOf('app');

    if (appIndex < 0 || pathParts.length <= appIndex + 3) {
      return undefined;
    }

    const appName = pathParts[appIndex + 1];
    const caseTypeID = pathParts[appIndex + 2];
    const caseReferenceID = decodeURIComponent(pathParts[appIndex + 3]);
    const basePath = pathParts.slice(0, appIndex).join('/');
    const pegaServerUrl = `${parsedUrl.origin}/${basePath ? `${basePath}/` : ''}`;

    return {
      appName,
      caseTypeID,
      caseReferenceID,
      pegaServerUrl
    };
  } catch {
    return undefined;
  }
};

export interface CaseKeysResult {
  pzInsKey?: string;
  className?: string;
}

const resolveCaseKeysFromUrl = (href: string): CaseKeysResult => {
  try {
    const url = new URL(href, window.location.origin);

    return {
      pzInsKey: url.searchParams.get('caseKey') ?? undefined,
      className: url.searchParams.get('caseTypeID') ?? undefined
    };
  } catch {
    return {};
  }
};

export const hasCaseIdentifierQueryParams = (href: string): boolean => {
  const { pzInsKey, className } = resolveCaseKeysFromUrl(href);

  return Boolean(pzInsKey || className);
};

export const resolveCaseKeysFromLink = (parsed: ParsedCaseLink, originalHref: string): ResolvedCaseLink => {
  try {
    const { pzInsKey, className } = resolveCaseKeysFromUrl(originalHref);
    const resolvedInsKey = pzInsKey ?? parsed.caseReferenceID;
    const normalizedInsKey = resolvedInsKey.trim();
    const classNameFromInsKey = normalizedInsKey.includes(' ') ? normalizedInsKey.split(/\s+/)[0] : undefined;
    // Fall back to path-derived values when explicit query params are absent.
    // For URLs like `.../app/<app>/cases/<className workID>`, the route segment
    // (`caseTypeID`) is only a bucket label (`cases`), so derive className from
    // the pzInsKey shape `<className> <workID>` before using `caseTypeID`.
    return {
      ...parsed,
      insKey: resolvedInsKey,
      className: className ?? classNameFromInsKey ?? parsed.caseTypeID
    };
  } catch {
    return parsed;
  }
};

export const resolveCaseOpenStrategy = (resolved: ResolvedCaseLink): CaseOpenStrategy => {
  if (!resolved.insKey || !resolved.className) {
    return 'webembed';
  }

  const resolvedClassName = PCore.getRemoteCaseUtils().getRemoteCaseClassBySourceClass(resolved.className) ?? resolved.className;
  // isRemoteCaseVersionDifferent is not in the 4.1 typings, and older servers do not provide it.
  const caseUtils: { isRemoteCaseVersionDifferent?: (className: string) => boolean } = PCore.getCaseUtils() as any;
  if (caseUtils.isRemoteCaseVersionDifferent?.(resolvedClassName)) {
    return 'webembed';
  }

  return 'native';
};
