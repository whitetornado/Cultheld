import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
    const hash = window.location.hash.slice(1) || '/';
    // Remove any auth parameters (access_token, refresh_token, etc.) from the path
    // These appear after a second # in the URL
    const cleanHash = hash.split('#')[0] || '/';
    return cleanHash;
  };

  const [currentPath, setCurrentPath] = useState(getCleanPath());
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleHashChange = () => {
      const path = getCleanPath();
      setCurrentPath(path);
      parseParams(path);
    };

    window.addEventListener('hashchange', handleHashChange);
    parseParams(currentPath);

    return () => window.removeEventListener('hashchange', handleHashChange);
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
    window.location.hash = path;
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
