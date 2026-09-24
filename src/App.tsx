import { Suspense, lazy, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sidebar, TabBar } from './components/Nav';
import { Toast } from './components/Toast';
import { db } from './db';
import { registerSpecies } from './data/species';
import { useRoute } from './lib/router';
import { Count } from './screens/Count';
import { Listen } from './screens/Listen';
import { NotFound } from './screens/NotFound';
import { Plant } from './screens/Plant';
import { Rain } from './screens/Rain';
import { Records } from './screens/Records';
import { Seasons } from './screens/Seasons';
import { Settings } from './screens/Settings';
import { Setup } from './screens/Setup';
import { Sighting } from './screens/Sighting';
import { SpeciesDetail } from './screens/SpeciesDetail';
import { SpeciesList } from './screens/SpeciesList';
import { Today } from './screens/Today';

// The map library is large, so it only loads when the map is opened.
const MapScreen = lazy(() => import('./screens/MapScreen').then((m) => ({ default: m.MapScreen })));

/** Screens for making a record hide the tab bar and show their own Save bar instead. */
const FORMS = new Set(['count', 'sighting', 'plant', 'rain']);

function Screen({ page, rest }: { page: string; rest: string[] }) {
  switch (page) {
    case '':
      return <Today />;
    case 'count':
      return <Count />;
    case 'sighting':
      return <Sighting />;
    case 'plant':
      return <Plant />;
    case 'rain':
      return <Rain />;
    case 'listen':
      return <Listen />;
    case 'map':
      return (
        <Suspense fallback={<div className="mapview" />}>
          <MapScreen />
        </Suspense>
      );
    case 'species':
      return rest[0] ? <SpeciesDetail id={rest[0]} /> : <SpeciesList />;
    case 'seasons':
      return <Seasons />;
    case 'records':
      return <Records />;
    case 'settings':
      return <Settings />;
    default:
      return <NotFound />;
  }
}

export function App() {
  const [page = '', ...rest] = useRoute();
  const isForm = FORMS.has(page);
  // Birds saved from sound identification join the species list.
  const added = useLiveQuery(() => db.species.toArray(), []);
  if (added) registerSpecies(added);
  // null while loading, so the setup screens never flash for someone who has done them.
  const setupDone = useLiveQuery(async () => ((await db.settings.get('setupDone'))?.value as boolean | undefined) ?? false, [], null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, rest[0]]);

  if (setupDone === null) return null;
  if (!setupDone) return <Setup />;

  return (
    <div className={`app${isForm ? ' app--form' : ''}`}>
      <Sidebar current={page} />
      <main className={`main${page === 'map' ? ' main--map' : ''}`}>
        <Screen key={`${page}/${rest.join('/')}`} page={page} rest={rest} />
      </main>
      {!isForm && <TabBar current={page} />}
      <Toast />
    </div>
  );
}
