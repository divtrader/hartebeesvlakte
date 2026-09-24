import { Icon } from './Icon';
import { PersonAvatar } from './PersonAvatar';
import { Avatar, SpeciesThumb } from './ui';
import { speciesPhoto } from '../data/speciesInfo';
import type { FieldRecord } from '../db';
import { getSpecies } from '../data/species';
import { formatDay } from '../lib/format';
import { groupStyle, recordGroup, recordMeta, recordTitle, recordValue } from '../lib/records';
import { href } from '../lib/router';

export function RecordRow({ record, showDay = false }: { record: FieldRecord; showDay?: boolean }) {
  const style = groupStyle(recordGroup(record));
  const species = getSpecies(record.speciesId);
  const meta = showDay ? `${formatDay(record.at)} · ${recordMeta(record)}` : recordMeta(record);
  const content = (
    <>
      <span className="list-row__icon">
        {species && speciesPhoto(species.id, true) ? <SpeciesThumb species={species} /> : <Avatar icon={style.icon} colour={style.colour} tint={style.tint} />}
        {record.by && record.by !== 'Unknown' && (
          <span className="list-row__who">
            <PersonAvatar name={record.by} size={20} />
          </span>
        )}
      </span>
      <span className="list-row__text">
        <span className="list-row__title">{recordTitle(record)}</span>
        <span className="list-row__meta">{meta}</span>
      </span>
      {record.clipId ? <Icon name="wave" size={16} className="list-row__photo" /> : null}
      {record.photoIds?.length ? <Icon name="camera" size={16} className="list-row__photo" /> : null}
      <span className={`list-row__value${record.kind === 'plant' ? ' list-row__value--text' : ''}`}>{recordValue(record)}</span>
    </>
  );
  return species ? (
    <a className="list-row" href={href(`species/${species.id}`)}>
      {content}
    </a>
  ) : (
    <div className="list-row">{content}</div>
  );
}
