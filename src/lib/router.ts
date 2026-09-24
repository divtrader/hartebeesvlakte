import { useEffect, useState } from 'react';

// Hash routes (#/count, #/species/kudu) work on GitHub Pages without any server setup.
function parse(hash: string): string[] {
  return hash
    .replace(/^#\/?/, '')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
}

export function useRoute(): string[] {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parse(hash);
}

/** Query value from the hash, such as `species` in #/sighting?species=kudu. */
export function routeParam(name: string): string | undefined {
  const query = window.location.hash.split('?')[1];
  return query ? (new URLSearchParams(query).get(name) ?? undefined) : undefined;
}

export function go(path: string): void {
  window.location.hash = `#/${path.replace(/^\//, '')}`;
}

export function href(path: string): string {
  return `#/${path.replace(/^\//, '')}`;
}
