interface Props {
  id: string;
  size?: number;
  className?: string;
}

export default function GameEmblem({ id, size = 22, className }: Props) {
  let detail: React.ReactNode;

  switch (id) {
    case 'settings':
      detail = <><circle cx="24" cy="24" r="6" /><path d="m20 7 1.5-2h5L28 7l3 2 2.3-.5 2.5 4.3-1 2.1 1 3.5 2 1.2v4.8l-2 1.2-1 3.5 1 2.1-2.5 4.3L31 33l-3 2-1.5 2h-5L20 35l-3-2-2.3.5-2.5-4.3 1-2.1-1-3.5-2-1.2v-4.8l2-1.2 1-3.5-1-2.1 2.5-4.3L17 9l3-2Z" /></>;
      break;
    case 'begin-turn':
      detail = <><path d="M15 10v28l23-14-23-14Z" /><path d="M9 8v32m12-26 12 10m-12 8 12-10" /></>;
      break;
    case 'challenges':
      detail = <><path d="M15 36V12h3l1.6 2.2 1.7-2.2h12v14H21l-2-2-1 2h-3" /><path d="m22 21 2.2 2.2 4.8-5" /><path d="M12 36h8" /></>;
      break;
    case 'achievements':
      detail = <><path d="m24 8 4.8 10 11 1.5-8 7.6 2 10.9L24 32.7l-9.8 5.3 1.9-10.9-7.9-7.6 11-1.5L24 8Z" /><circle cx="24" cy="24" r="18" /></>;
      break;
    case 'mastery':
      detail = <><path d="M24 7 29 19l12 5-12 5-5 12-5-12-12-5 12-5 5-12Z" /><circle cx="24" cy="24" r="18" /><circle cx="24" cy="24" r="4" /></>;
      break;
    case 'daily-calendar':
      detail = <><rect x="9" y="11" width="30" height="28" rx="3" /><path d="M15 7v8m18-8v8M9 19h30" /><path d="M16 25h4m5 0h4m5 0h2M16 31h4m5 0h4m5 0h2" /></>;
      break;
    case 'enigma':
      detail = <><path d="M24 5 43 24 24 43 5 24 24 5Z" /><path d="M13 24s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="24" cy="24" r="2.5" /><path d="M24 9v3m15 12h-3M24 39v-3M9 24h3" /></>;
      break;
    case 'profile':
      detail = <><circle cx="24" cy="18" r="7" /><path d="M10 39c1.5-7.3 6.7-11 14-11s12.5 3.7 14 11" /><circle cx="24" cy="24" r="19" /></>;
      break;
    case 'tutorial':
      detail = <><path d="M7 11c7-2 12-.5 17 3v24c-5-3.5-10-5-17-3V11Zm34 0c-7-2-12-.5-17 3v24c5-3.5 10-5 17-3V11Z" /><path d="M24 14v24" /><path d="M12 17c3-.4 6 .2 8 1.4m16-1.4c-3-.4-6 .2-8 1.4" /></>;
      break;
    case 'card-store':
      detail = <><path d="M8 18 24 9l16 9v18H8V18Z" /><path d="M8 18h32M18 18v18m12-18v18" /><path d="m24 14 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.3 1.2.4-2.6-1.9-1.8 2.7-.4L24 14Z" /></>;
      break;
    case 'deck-builder':
      detail = <><path d="m11 15 20-7 7 20-20 7-7-20Z" /><path d="m8 20 7 20 20-7" /><path d="m17 18 12-4m-10 9 12-4m-10 9 12-4" /></>;
      break;
    case 'deck-viewer':
      detail = <><path d="M8 11h12c2 0 4 1 4 3v23c0-2-2-4-4-4H8V11Zm32 0H28c-2 0-4 1-4 3v23c0-2 2-4 4-4h12V11Z" /><path d="M12 17h8m-8 5h8m8-5h8m-8 5h8" /></>;
      break;
    case 'infinitude':
      detail = <><path d="M7 24c5-12 13-12 17 0s12 12 17 0c-5-12-13-12-17 0S12 36 7 24Z" /><circle cx="24" cy="24" r="19" /></>;
      break;
    case 'fracture':
      detail = <><path d="m24 5 14 10-5 20-18 4-7-17L24 5Z" /><path d="m24 5-2 16 11-6m-11 6 11 14m-11-14L8 22m14-1-7 18" /></>;
      break;
    case 'inventory':
      detail = <><path d="m24 6 17 9v18l-17 9-17-9V15l17-9Z" /><path d="m7 15 17 9 17-9M24 24v18" /><path d="m16 10 17 9" /></>;
      break;
    case 'eternitys-wake':
      detail = <><path d="m24 6 3.5 12.5L40 23l-12.5 4.5L24 40l-3.5-12.5L8 23l12.5-4.5L24 6Z" /><path d="M9 8 7 5m32 3 2-3M8 39l-3 2m35-2 3 2" /></>;
      break;
    case 'garden':
      detail = <><path d="M24 24c-11 1-14-6-9-11 5-5 11-2 9 11Zm0 0c-1-11 6-14 11-9 5 5 2 11-11 9Zm0 0c11-1 14 6 9 11-5 5-11 2-9-11Zm0 0c1 11-6 14-11 9-5-5-2-11 11-9Z" /><circle cx="24" cy="24" r="3" /><path d="M24 27v14m0-5c-4-4-7-3-9-3" /></>;
      break;
    case 'cards':
      detail = <><rect x="12" y="8" width="22" height="30" rx="3" transform="rotate(-9 12 8)" /><rect x="16" y="10" width="22" height="30" rx="3" /><path d="m27 17 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5 1.5-4Z" /></>;
      break;
    case 'aberrated-shards':
      detail = <><path d="m10 17 14-10 14 10-4 19-10 5-10-5-4-19Z" /><path d="m10 17 14 8 14-8M24 25v16m-9-26 9 14 9-14" /></>;
      break;
    case 'divine-light':
      detail = <><circle cx="24" cy="24" r="7" /><circle cx="24" cy="24" r="13" /><path d="M24 4v5m0 30v5M4 24h5m30 0h5M10 10l4 4m20 20 4 4m0-28-4 4M14 34l-4 4" /></>;
      break;
    case 'transcendence-shard':
      detail = <><path d="m24 5 13 8-2 18-11 12-11-12-2-18 13-8Z" /><path d="m11 13 13 11 13-11M24 24v19M17 9l7 15 7-15" /></>;
      break;
    default:
      detail = <><path d="M24 6 29 19l13 5-13 5-5 13-5-13-13-5 13-5 5-13Z" /><circle cx="24" cy="24" r="19" /></>;
  }

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeOpacity="0.32" strokeWidth="0.8" />
      <circle cx="24" cy="24" r="17" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.6" strokeDasharray="1.5 2.4" />
      <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">{detail}</g>
    </svg>
  );
}