import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { getStoredUser } from '../services/api';

export default function ChatRoom({ tripId }) {
  const user        = getStoredUser();
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [joined,    setJoined]    = useState(false);
  const bottomRef   = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Join room and fetch history
  const setup = useCallback(() => {
    const socket = getSocket();
    if (!socket || !tripId) return;

    // Join the trip room
    socket.emit('chat:join', { tripId });

    // Fetch history
    socket.emit('chat:history', { tripId }, ({ messages: history }) => {
      setMessages(history ?? []);
      setJoined(true);
      setTimeout(scrollToBottom, 50);
    });

    // Listen for new messages
    const onMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    };
    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [tripId]);

  useEffect(() => {
    const cleanup = setup();
    return cleanup;
  }, [setup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    const socket = getSocket();
    if (!socket) return;

    setSending(true);
    setInput('');
    socket.emit('chat:send', { tripId, content }, ({ success }) => {
      setSending(false);
      if (!success) setInput(content); // restore on failure
    });
  };

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (!joined) {
    return <p style={styles.loading}>Connecting to chat…</p>;
  }

  return (
    <div style={styles.root}>
      {/* Messages */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <p style={styles.empty}>No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.userId;
          const showHeader = i === 0 || messages[i - 1].userId !== msg.userId;
          return (
            <div key={msg.messageId ?? i} style={{ ...styles.msgWrapper, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {showHeader && !isMe && (
                <div style={styles.msgSender}>{msg.firstName} {msg.lastName}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                {showHeader && (
                  <div style={{ ...styles.avatar, background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}>
                    {msg.firstName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                {!showHeader && <div style={{ width: 28 }} />}
                <div style={{ ...styles.bubble, ...(isMe ? styles.bubbleMe : styles.bubbleThem) }}>
                  {msg.content}
                  <span style={styles.time}>{fmtTime(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={sending}
          maxLength={500}
        />
        <button type="submit" style={styles.sendBtn} disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column', gap: '0',
    height: '100%',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.02)',
  },
  loading: {
    color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem',
  },
  messageList: {
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    flex: 1, overflowY: 'auto', minHeight: 0,
    padding: '1rem',
  },
  empty: {
    color: 'var(--text-muted)', fontSize: '0.83rem', textAlign: 'center',
    padding: '1.5rem 0',
  },
  msgWrapper: {
    display: 'flex', flexDirection: 'column', gap: '0.15rem',
    marginBottom: '0.4rem',
  },
  msgSender: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
    paddingLeft: 34,
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  bubble: {
    padding: '0.5rem 0.85rem',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.88rem', lineHeight: 1.5, maxWidth: '70%',
    display: 'flex', flexDirection: 'column', gap: '0.2rem',
    wordBreak: 'break-word',
  },
  bubbleMe: {
    background: 'rgba(79,142,247,0.25)',
    color: 'var(--text-primary)',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
    borderBottomLeftRadius: 4,
  },
  time: {
    fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'flex-end',
  },
  inputRow: {
    display: 'flex', gap: '0',
    flexShrink: 0,
    borderTop: '1px solid var(--border-subtle)',
  },
  input: {
    flex: 1, padding: '0.7rem 1rem',
    background: 'transparent',
    border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontSize: '0.88rem',
  },
  sendBtn: {
    padding: '0.7rem 1.25rem',
    background: 'var(--accent)',
    border: 'none', color: '#fff',
    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
};
