import type { CSSProperties } from 'react';

interface Props {
  label: string;
  fontSize?: number;
  style?: CSSProperties;
}

export default function ShardDropRate({ label, fontSize = 11, style }: Props) {
  return (
    <span className="shard-drop-rate" style={{ fontSize, ...style }} title="Shard of Transcendence drop rate">
      <span className="shard-drop-rate__text">{label}</span>
    </span>
  );
}
