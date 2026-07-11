import { useState } from 'react'

export default function SubscribeButton({
  subscribed,
  subscribing,
  onSubscribe,
  size = 'md',
}) {
  const [hovered, setHovered] = useState(false)
  const isSmall = size === 'sm'

  if (subscribed) {
    return (
      <button
        onClick={onSubscribe}
        disabled={subscribing}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: isSmall ? '6px 14px' : '9px 24px',
          borderRadius: 20,
          fontSize: isSmall ? 13 : 14,
          fontWeight: 600,
          background: hovered ? 'rgba(255,77,77,0.1)' : 'var(--bg-3)',
          color: hovered ? 'var(--red)' : 'var(--text-3)',
          border: `1px solid ${hovered ? 'rgba(255,77,77,0.3)' : 'var(--border)'}`,
          cursor: subscribing ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minWidth: isSmall ? 100 : 130,
          transition: 'all 0.18s',
          opacity: subscribing ? 0.6 : 1,
        }}
      >
        {subscribing ? (
          <span className="spinner" style={{ width: 13, height: 13 }} />
        ) : hovered ? (
          'Unsubscribe'
        ) : (
          <>
            <span style={{ color: 'var(--accent)', fontSize: 11 }}>{'✓'}</span>
            Subscribed
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onSubscribe}
      disabled={subscribing}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: isSmall ? '6px 14px' : '9px 24px',
        borderRadius: 20,
        fontSize: isSmall ? 13 : 14,
        fontWeight: 700,
        background: 'var(--accent)',
        color: 'var(--text-on-accent)',
        border: 'none',
        cursor: subscribing ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: isSmall ? 100 : 130,
        transition: 'opacity 0.18s',
        opacity: subscribing ? 0.7 : hovered ? 0.85 : 1,
      }}
    >
      {subscribing
        ? <span className="spinner" style={{ width: 13, height: 13 }} />
        : 'Subscribe'
      }
    </button>
  )
}