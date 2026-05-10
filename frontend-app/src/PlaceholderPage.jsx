export default function PlaceholderPage({ icon, title, subtitle, setView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 64, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 380 }}>{subtitle || `The ${title} feature is coming soon. Stay tuned for updates!`}</div>
      <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setView('dashboard')}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
