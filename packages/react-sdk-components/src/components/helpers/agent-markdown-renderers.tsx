import { type ComponentType, type MouseEvent, type ReactNode, useContext } from 'react';
import type { Tokens } from 'marked';
import { Link } from '@mui/material';
import { SdkConfigAccess } from '@pega/auth/lib/sdk-auth-manager';

import { StreamingContext } from './StreamingContext';
import {
  type CoachPConnectGetter,
  hasCaseIdentifierQueryParams,
  parseCaseLink,
  resolveCaseKeysFromLink,
  resolveCaseOpenStrategy
} from './agent-inline-edit-utils';

/**
 * Wrapper component that checks the streaming context and decides whether to hide the JSON marker token.
 * Returns null for JSON marker tokens, falls back to default rendering for everything else.
 */
const CoachTextRenderer = ({ token }: { token: Tokens.Text }) => {
  const streamingContext = useContext(StreamingContext);

  if (
    token?.text.startsWith('###') &&
    ((streamingContext?.isStreamingMessage && streamingContext.isStreamingInProgress) ||
      (token.text.includes('followUpQuestions') && token.text.endsWith('###JSON_ENDS_HERE')))
  ) {
    return null;
  }

  // Return undefined signals to the parent that default rendering should be used,
  // but since this is a component, we need to return the text as-is.
  // The parent markdownMap function handles the fallback.
  return <>{token?.text}</>;
};

const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

const isSafeHref = (href: string): boolean => {
  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(href, window.location.origin).protocol);
  } catch {
    return false;
  }
};

// The agent links cases to the Pega portal of the Infinity server the application uses. The host name is compared, as
// the protocol and port can differ behind a proxy; a relative link can only point to that server.
const isInfinityServerLink = (href: string): boolean => {
  if (!/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith('//')) {
    return true;
  }

  try {
    const { infinityRestServerUrl } = SdkConfigAccess.getSdkConfigServer();

    return new URL(href, window.location.origin).hostname.toLowerCase() === new URL(infinityRestServerUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
};

const getLastPathSegments = (url: string, count: number): string[] => {
  try {
    return new URL(url, window.location.origin).pathname
      .split('/')
      .filter(Boolean)
      .slice(-count)
      .map(segment => decodeURIComponent(segment));
  } catch {
    return [];
  }
};

type LinkedCase = { insKey: string; className: string };

// The work ID with which routes are resolved: only a route with a work ID token returns it, unlike the application's
// root URL, to which a payload that matches no route resolves.
const PROBE_WORK_ID = 'sdk-probe-work-id';

/** The class group of a case type class, by the App Studio convention `<Org>-<App>-Work-<Case type>`. */
const getClassGroup = (className: string): string | undefined => {
  const segments = className.split('-');
  const workIndex = segments.map(segment => segment.toLowerCase()).lastIndexOf('work');
  return workIndex > 0 ? segments.slice(0, workIndex + 1).join('-') : undefined;
};

/** The possible case key prefixes of a case type class: its parent classes, as named and in upper case. */
const getKeyPrefixCandidates = (className: string): string[] => {
  const segments = className.split('-');
  const candidates: string[] = [];
  for (let length = segments.length - 1; length > 0; length -= 1) {
    const classGroup = segments.slice(0, length).join('-');
    candidates.push(classGroup, classGroup.toUpperCase());
  }
  return candidates;
};

type CaseType = { name: string; className: string };

/**
 * The case types of the application: those of the environment info and, as the Quick Create widget reads them when the
 * environment info has none, those the portal offers to create.
 */
const getCaseTypes = (): CaseType[] => {
  const caseTypes: CaseType[] = [];
  const addCaseType = (name: string | undefined, className: string | undefined) => {
    if (className && !caseTypes.some(caseType => caseType.className === className)) {
      caseTypes.push({ name: name ?? '', className });
    }
  };

  try {
    PCore.getEnvironmentInfo()
      .getCaseTypeList()
      .forEach(caseType => addCaseType(caseType.pyWorkTypeName, caseType.pyWorkTypeImplementationClassName));
  } catch {
    // The environment info has no case types.
  }

  try {
    const portal: { pyCaseTypesAvailableToCreate?: { pyLabel?: string; pyClassName?: string }[] } | undefined = PCore.createPConnect({
      options: { context: PCore.getConstants().APP.APP }
    })
      .getPConnect()
      .getValue('pyPortal');
    portal?.pyCaseTypesAvailableToCreate?.forEach(caseType => addCaseType(caseType.pyLabel, caseType.pyClassName));
  } catch {
    // The portal has no case types.
  }

  return caseTypes;
};

// The platform names a case type's route after the case type, in the plural ("New Service": `new-services`).
const isRouteOfCaseTypeName = (routeName: string, caseTypeName: string): boolean => {
  const toToken = (value: string) => value.toLowerCase().replace(/[^a-z\d]/g, '');
  const name = toToken(caseTypeName);
  return !!name && [name, `${name}s`, `${name}es`, `${name.replace(/y$/, 'i')}es`].includes(toToken(routeName));
};

/**
 * Whether the class of a case key (its first word) is one of the application's case types or a parent class of one,
 * such as their class group. Other keys in links (of assignments or attachments, for example) are not cases.
 */
const isApplicationCaseKey = (insKey: string): boolean => {
  const keyClass = insKey.trim().split(/\s+/)[0].toLowerCase();
  return getCaseTypes().some(({ className }) => `${className.toLowerCase()}-`.startsWith(`${keyClass}-`));
};

/**
 * Resolves a case's semantic URL (`…/<route>/<work ID>`), the form in which the application's routing table links a
 * case. The engine does not expose that lookup, so candidate route payloads are resolved with the public semantic URL
 * utilities and compared with the link:
 * - a route per case type names the case type class and the case key template (`<class group> {workID}`);
 * - a generic case route (such as `cases/{workID}`) names only the case key template;
 * - a single case route resolves for any payload, so the key prefix is the class group of the application's case types.
 * When the routing table has no route for the link, the case type the route is named after is used.
 */
const resolveCaseFromSemanticURL = (routePath: string, workID: string): LinkedCase | undefined => {
  // Work IDs are numbered; other paths (such as `…/create`) are not cases.
  if (!/\d/.test(workID)) {
    return undefined;
  }

  const linkRoute = routePath.toLowerCase();

  // The path segment of the case route a payload resolves to, if any.
  const getCaseRoute = (payload: Record<string, string>): string | undefined => {
    try {
      const semanticUrlUtils = PCore.getSemanticUrlUtils();
      const { ACTION_OPENWORKBYHANDLE } = semanticUrlUtils.getActions();
      const url = semanticUrlUtils.getResolvedSemanticURL(ACTION_OPENWORKBYHANDLE, payload, { workID: PROBE_WORK_ID });
      const [route, id] = getLastPathSegments(url, 2);
      return route && id === PROBE_WORK_ID ? route.toLowerCase() : undefined;
    } catch {
      return undefined;
    }
  };
  const isLinkRoute = (payload: Record<string, string>) => getCaseRoute(payload) === linkRoute;

  const caseTypes = getCaseTypes();

  // A payload that no route has resolves to a route only when the routing table has a single route of this form.
  if (getCaseRoute({ caseID: '' }) !== undefined) {
    const classGroups = [...new Set(caseTypes.map(({ className }) => getClassGroup(className)).filter((group): group is string => !!group))];
    if (!isLinkRoute({ caseID: '' }) || classGroups.length !== 1) {
      return undefined;
    }
    const keyPrefix = classGroups[0].toUpperCase();
    return { insKey: `${keyPrefix} ${workID}`, className: keyPrefix };
  }

  const caseType =
    caseTypes.find(({ className }) => isLinkRoute({ caseClassName: className })) ??
    caseTypes.find(({ name }) => isRouteOfCaseTypeName(routePath, name));
  if (caseType) {
    // The prefix of the route's case ID template; else, by convention, the class group in upper case, as case keys have it.
    const keyPrefix =
      getKeyPrefixCandidates(caseType.className).find(candidate =>
        isLinkRoute({ caseClassName: caseType.className, caseID: `${candidate} {workID}` })
      ) ?? getClassGroup(caseType.className)?.toUpperCase();
    return keyPrefix ? { insKey: `${keyPrefix} ${workID}`, className: caseType.className } : undefined;
  }

  // As for links that carry the case key, the class name is the key prefix (the case type is read from the case).
  const prefixes = new Set(caseTypes.flatMap(({ className }) => getKeyPrefixCandidates(className)));
  const prefix = [...prefixes].find(candidate => isLinkRoute({ caseID: `${candidate} {workID}` }));
  return prefix ? { insKey: `${prefix} ${workID}`, className: prefix } : undefined;
};

/**
 * Resolves the case of the application a link points to, if it can be opened in the application.
 * openWorkByHandle needs the case key (`<class> <work ID>`): either the link carries it, or the link is the case's
 * semantic URL, which carries the work ID only.
 */
const resolveLinkedCase = (linkHref: string): LinkedCase | undefined => {
  // Java URL encoders write the space of a case key as '+', which no case key or class name contains.
  const href = linkHref.replace(/\+/g, '%20');
  if (!hasCaseIdentifierQueryParams(href) && !isInfinityServerLink(href)) {
    return undefined;
  }

  const parsed = parseCaseLink(href);
  const fromLink = parsed ? resolveCaseKeysFromLink(parsed, href) : undefined;
  const linkInsKey = fromLink?.insKey?.trim();

  let linkedCase: LinkedCase | undefined;
  if (fromLink?.className && linkInsKey && /\s/.test(linkInsKey)) {
    if (!isApplicationCaseKey(linkInsKey)) {
      return undefined;
    }
    linkedCase = { insKey: linkInsKey, className: fromLink.className };
  } else {
    const [routePath, workID] = getLastPathSegments(href, 2);
    linkedCase = routePath && workID ? resolveCaseFromSemanticURL(routePath, workID) : undefined;
  }

  if (!linkedCase) {
    return undefined;
  }

  const strategy = resolveCaseOpenStrategy({
    appName: parsed?.appName ?? '',
    caseTypeID: linkedCase.className,
    caseReferenceID: linkedCase.insKey,
    pegaServerUrl: parsed?.pegaServerUrl ?? '',
    ...linkedCase
  });

  return strategy === 'native' ? linkedCase : undefined;
};

/**
 * Link renderer: links open in a new tab, except links to cases of the application.
 * @component
 */
const CoachLinkRenderer = ({ token, getPConnect, children }: { token: Tokens.Link; getPConnect?: CoachPConnectGetter; children?: ReactNode }) => {
  const { href, text } = token;
  // The rendered link text keeps its formatting (as in `[**T-1001**](…)`); the raw text is the fallback.
  const content = children ?? text;

  // Links with other protocols (for example javascript:) are shown as plain text.
  if (!isSafeHref(href)) {
    return <>{content}</>;
  }

  // Deviation from Constellation: a link to a case opens the case in the application, as the Pega portal
  // it points to is outside the application. Modified clicks keep the browser behavior.
  const handleClick = (e: MouseEvent) => {
    if (!getPConnect || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    let linkedCase: LinkedCase | undefined;
    try {
      linkedCase = resolveLinkedCase(href);
    } catch (error) {
      console.error(error);
    }
    if (!linkedCase) {
      return;
    }

    e.preventDefault();
    const { insKey, className } = linkedCase;
    new Promise(resolve => {
      resolve(getPConnect().getActionsApi().openWorkByHandle(insKey, className));
    }).catch((error: unknown) => {
      // The engine rejects without an error when the user cancels, for example on the dialog about unsaved changes.
      if (error === undefined) {
        return;
      }
      // If the case cannot be opened in the application, the link opens as it would without the SDK.
      console.error(error);
      window.open(href, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <Link href={href} target='_blank' rel='noopener noreferrer' onClick={handleClick}>
      {content}
    </Link>
  );
};

/** Markdown overrides for GenAI coach */
export const createAgentMarkdownMap = (options?: { getPConnect?: CoachPConnectGetter }) => {
  const getPConnect = options?.getPConnect;
  const LinkRenderer = ({ token, children }: { token: Tokens.Link; children?: ReactNode }) => (
    <CoachLinkRenderer token={token} getPConnect={getPConnect}>
      {children}
    </CoachLinkRenderer>
  );

  return {
    // Deviation from Constellation: links are rendered by the SDK so that case links stay in the application.
    link: () => LinkRenderer,
    text: (token: Tokens.Text): ComponentType<{ token: Tokens.Text }> | undefined => {
      // Only override for JSON marker tokens;
      // It preserve the default renderer.
      if (token?.text.startsWith('###')) {
        return CoachTextRenderer;
      }
      return undefined;
    }
  };
};

const agentMarkdownMap = createAgentMarkdownMap();

export default agentMarkdownMap;
