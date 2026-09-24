import { Icon } from './Icon';
import { Avatar } from './ui';
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
      <Avatar icon={style.icon} colour={style.colour} tint={style.tint} />
      <span className="list-row__text">
        <span className="list-row__title">{recordTitle(record)}</span>
        <span className="list-row__meta">{meta}</span>
      </span>
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
