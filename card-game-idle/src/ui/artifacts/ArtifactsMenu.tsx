interface Props {
  onClose: () => void;
}

export default function ArtifactsMenu({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, rgba(20,15,40,0.97), rgba(5,4,14,0.99))',
        color: '#e8e8f0',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(560px, calc(100vw - 32px))',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(8, 8, 18, 0.84)',
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#d7d9ef',
            marginBottom: 10,
          }}
        >
          Artifacts! Coming Soon
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(235, 236, 246, 0.74)',
            marginBottom: 18,
          }}
        >
          The artifact system is currently disabled and has no gameplay effect.
        </div>
        <button
          onClick={onClose}
          style={{
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            color: '#f3f4ff',
            padding: '8px 16px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}