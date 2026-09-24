import { Empty } from '../components/ui';
import { href } from '../lib/router';

export function NotFound() {
  return (
    <Empty icon="map" title="This page does not exist">
      <a href={href('')}>Back to Today</a>
    </Empty>
  );
}
