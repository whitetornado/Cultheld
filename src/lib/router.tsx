import { createContext, useContext, useEffect, useState, ReactNode, MouseEvent, AnchorHTMLAttributes } from 'react';

interface RouterContextType {
  currentPath: string;
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  params: {},
  navigate: () => {},
});

export const useRouter = () => useContext(RouterContext);

export const Router = ({ children }: { children: ReactNode }) => {
  const getCleanPath = () => {
    return window.location.pathname + window.location.search;
  };

  const [currentPath, setCurrentPath] = useState(getCleanPath());
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handlePopState = () => {
      const path = getCleanPath();
      setCurrentPath(path);
      parseParams(path);
    };

    window.addEventListener('popstate', handlePopState);
    parseParams(currentPath);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const parseParams = (path: string) => {
    const [pathOnly, queryString] = path.split('?');
    const parts = pathOnly.split('/').filter(Boolean);
    const newParams: Record<string, string> = {};

    if (parts[0] === 'seizoen' && parts[1]) {
      newParams.seasonSlug = parts[1];
      if (parts[2] === 'club' && parts[3]) {
        newParams.clubSlug = parts[3];
      }
    } else if (parts[0] === 'legend' && parts[1]) {
      newParams.legendSlug = parts[1];
    } else if (parts[0] === 'admin') {
      if (parts[1] === 'orders' && parts[2]) {
        newParams.orderId = parts[2];
      }
    } else if (parts[0] === 'payment' && parts[1] === 'return') {
      if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        urlParams.forEach((value, key) => {
          newParams[key] = value;
        });
      }
    }

    setParams(newParams);
  };

  const navigate = (path: string) => {
    // Preserve any URL hash fragment already present (used briefly by Supabase's
    // password-recovery redirect, which appends #access_token=...&type=recovery).
    const hash = window.location.hash;
    const nextUrl = path + hash;

    if (nextUrl === getCleanPath() + hash) return;

    window.history.pushState({}, '', nextUrl);
    const newPath = getCleanPath();
    setCurrentPath(newPath);
    parseParams(newPath);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ currentPath, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

interface RouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export const Route = ({ path, component: Component }: RouteProps) => {
  const { currentPath } = useRouter();

  const matchPath = (routePath: string, currentPath: string): boolean => {
    const cleanCurrentPath = currentPath.split('?')[0];

    if (routePath === cleanCurrentPath) return true;

    const routeParts = routePath.split('/').filter(Boolean);
    const currentParts = cleanCurrentPath.split('/').filter(Boolean);

    if (routeParts.length !== currentParts.length) return false;

    return routeParts.every((part, i) => {
      return part.startsWith(':') || part === currentParts[i];
    });
  };

  if (!matchPath(path, currentPath)) return null;

  return <Component />;
};

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
}

// Drop-in replacement for <a href="/path">: navigates via the History API
// instead of a full page reload, while still behaving like a normal link
// (middle-click / cmd-click / ctrl-click to open in a new tab still works).
export const Link = ({ to, children, onClick, ...rest }: LinkProps) => {
  const { navigate } = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);

    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
