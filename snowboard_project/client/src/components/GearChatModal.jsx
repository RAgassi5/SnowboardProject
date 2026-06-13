import React, { useState, useEffect, useRef } from 'react';
import { getStoredUser, sendGearChatMessage, getGearChatHistory, resetGearChatHistory } from '../services/api';

export default function GearChatModal({ trip, resort, forecast }) {
  const user    = getStoredUser();
  const tripId  = trip?.tripId;

  const [open,          setOpen]          = useState(false);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [initialized,   setInitialized]   = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  // Load persisted history on mount
  useEffect(() => {
    if (!tripId || !user?.userId) { setHistoryLoaded(true); return; }
    getGearChatHistory(tripId)
      .then(msgs => { setMessages(Array.isArray(msgs) ? msgs : []); })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-init only when chat opens for the first time and there is no saved history
  useEffect(() => {
    if (open && historyLoaded && !initialized && messages.length === 0) {
      setInitialized(true);
      sendMessage('__init__', []);
    }
  }, [open, historyLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildContext = () => ({
    tripId,
    resort: {
      name:              resort?.name,
      country:           resort?.country,
      elevation:         resort?.elevation,
      terrainType:       resort?.terrainType,
      difficultyLevel:   resort?.difficultyLevel,
      snowboardFriendly: resort?.snowboardFriendly,
    },
    trip: {
      startDate: trip?.startDate,
      endDate:   trip?.endDate,
    },
    rider: {
      skillLevel: user?.skillLevel,
      sportType:  user?.sportType,
    },
    forecast: forecast?.summary ? {
      confidence: forecast.confidence,
      summary:    forecast.summary,
    } : null,
  });

  const sendMessage = async (text, currentHistory) => {
    setLoading(true);
    try {
      const { reply } = await sendGearChatMessage({
        message: text,
        history: currentHistory,
        context: buildContext(),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInput('');
    sendMessage(text, newHistory);
  };

  const handleReset = async () => {
    try { await resetGearChatHistory(tripId); } catch { /* non-critical */ }
    setMessages([]);
    setInitialized(false);
    setTimeout(() => {
      setInitialized(true);
      sendMessage('__init__', []);
    }, 0);
  };

  const toggle = () => setOpen(o => !o);

  return (
    <div style={styles.container}>
      {open && (
        <div style={styles.popup}>
          {/* Messages */}
          <div style={styles.messageList}>
            {messages.length === 0 && !loading && (
              <div style={styles.emptyHint}>Starting up your gear advisor…</div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.messageBubble,
                  ...(msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI),
                }}
              >
                {msg.role === 'assistant' && (
                  <span style={styles.senderLabel}>🎒 Gear AI</span>
                )}
                <p style={styles.bubbleText}>{msg.content}</p>
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.messageBubble, ...styles.bubbleAI }}>
                <span style={styles.senderLabel}>🎒 Gear AI</span>
                <p style={{ ...styles.bubbleText, ...styles.thinkingText }}>Thinking…</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about gear, clothing, packing…"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              style={{
                ...styles.sendBtn,
                opacity: (!input.trim() || loading) ? 0.45 : 1,
              }}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Header bar — always visible */}
      <div
        style={{
          ...styles.header,
          borderRadius: open ? 0 : '12px 12px 0 0',
          borderTop: open ? '1px solid rgba(56,217,192,0.2)' : '1px solid var(--border-card)',
        }}
        onClick={toggle}
        role="button"
        aria-expanded={open}
        aria-label={open ? 'Minimize Gear Advisor' : 'Open AI Gear Advisor'}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
      >
        <span style={styles.headerIcon}>🎒</span>
        <div style={styles.headerText}>
          <span style={styles.headerTitle}>AI Gear Advisor</span>
          <span style={styles.headerSub}>Ask about packing &amp; gear</span>
        </div>
        {open && (
          <button
            style={styles.resetBtn}
            onClick={e => { e.stopPropagation(); handleReset(); }}
            title="Start a new conversation"
            aria-label="Reset conversation"
          >
            ↺
          </button>
        )}
        <span style={styles.chevron} aria-hidden="true">{open ? '▼' : '▲'}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: '1.5rem',
    zIndex: 600,
    width: 340,
    display: 'flex',
    flexDirection: 'column',
  },
  popup: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '12px 12px 0 0',
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: 'none',
    height: 440,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  emptyHint: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: '1rem',
    fontStyle: 'italic',
  },
  messageBubble: {
    maxWidth: '92%',
    padding: '0.55rem 0.8rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    background: 'rgba(56,217,192,0.08)',
    border: '1px solid rgba(56,217,192,0.18)',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    background: 'rgba(79,142,247,0.15)',
    border: '1px solid rgba(79,142,247,0.25)',
  },
  senderLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#38d9c0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  bubbleText: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  thinkingText: {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  inputRow: {
    display: 'flex',
    gap: '0.4rem',
    padding: '0.6rem 0.75rem',
    borderTop: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.15)',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    padding: '0.45rem 0.7rem',
    outline: 'none',
  },
  sendBtn: {
    background: 'rgba(56,217,192,0.15)',
    border: '1px solid rgba(56,217,192,0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#38d9c0',
    fontSize: '0.9rem',
    padding: '0.45rem 0.7rem',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'rgba(56,217,192,0.09)',
    cursor: 'pointer',
    userSelect: 'none',
    borderLeft: '1px solid var(--border-card)',
    borderRight: '1px solid var(--border-card)',
    borderBottom: '1px solid var(--border-card)',
  },
  headerIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  headerSub: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  resetBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '0.1rem 0.4rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  chevron: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
};
