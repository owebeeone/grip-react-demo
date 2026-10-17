import { useId } from 'react';
import { GripInput, useGrip } from '@owebeeone/grip-react';
import { DESCRIPTION, DESCRIPTION_SLUG, DESCRIPTION_STATS, DESCRIPTION_TAP } from './grips';

export default function DescriptionEditor() {
  const id = useId();
  const stored = useGrip(DESCRIPTION);
  const slug = useGrip(DESCRIPTION_SLUG);
  const statistics = useGrip(DESCRIPTION_STATS);
  return (
    <section className="demo-card description-example" aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`}>Text & derived values</h3>
      <label htmlFor={id}>Description</label>
      <GripInput
        id={id}
        grip={DESCRIPTION}
        tapGrip={DESCRIPTION_TAP}
        parse={text => text.toUpperCase()}
        aria-describedby={`${id}-help`}
        autoComplete="off"
        spellCheck={false}
      />
      <p id={`${id}-help`} className="card-caption">Edit anywhere. The caret stays put.</p>
      <dl>
        <dt>Stored value</dt><dd><output aria-label="Stored value">{stored || '—'}</output></dd>
        <dt>Computed slug</dt><dd><output aria-label="Computed slug">{slug || '—'}</output></dd>
        <dt>Text statistics</dt><dd><output aria-label="Text statistics">{statistics}</output></dd>
      </dl>
    </section>
  );
}
