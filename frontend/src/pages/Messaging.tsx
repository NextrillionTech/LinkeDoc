import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  generateAndStoreKeys,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from '../utils/crypto';
import Pusher from 'pusher-js';

// Lucide React Icons
import {
  MessageSquare,
  Lock,
  Send,
  ShieldAlert,
  Compass,
  Users
} from 'lucide-react';


// Setup Pusher Client dynamically
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || 'dummy_key';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'dummy_cluster';

interface UserParticipant {
  id: string;
  name: string;
  specialty: string | null;
  publicKey: string | null;
}

interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  encryptedBody: string;
  status: string;
  createdAt: string;
}

interface DecryptedMessage extends RawMessage {
  decryptedBody: string;
}

interface ConversationItem {
  id: string;
  participant: UserParticipant;
  lastMessage: {
    id: string;
    encryptedBody: string;
    senderId: string;
    createdAt: string;
  } | null;
  decryptedLastMessage?: string | null;
}

export const Messaging: React.FC = () => {
  const currentUser = api.getCurrentUser();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [keyGenerating, setKeyGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  // Keep derived shared keys in memory for active sessions: Record<conversationId, CryptoKey>
  const sharedKeysRef = useRef<Record<string, CryptoKey>>({});
  // Refs to allow Pusher listener callbacks to access latest states safely
  const activeConvRef = useRef<ConversationItem | null>(null);
  const messagesRef = useRef<DecryptedMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize refs with state
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    messagesRef.current = messages;
    scrollToBottom();
  }, [messages]);

  // Handle client-side key pair setup and initial conversation listing on load
  useEffect(() => {
    const initializeE2EEAndLoadConversations = async () => {
      if (!currentUser) return;

      try {
        setKeyGenerating(true);
        // 1. Generate or fetch key pair from browser IndexedDB
        const publicKeyBase64 = await generateAndStoreKeys();
        
        // 2. Upload public key to server to register for key exchange
        await api.registerPublicKey(publicKeyBase64);
      } catch (err) {
        console.error('Failed to initialize E2EE key exchange:', err);
        setErrorMsg('Encryption registration failed. Direct messaging is disabled.');
      } finally {
        setKeyGenerating(false);
      }

      try {
        setLoadingConv(true);
        // 3. Load initial conversations list
        const res = await api.getConversations();
        if (res.success) {
          const loadedConvs: ConversationItem[] = res.conversations;

          // Attempt to decrypt last messages in the directory sidebar
          const updatedConvs = await Promise.all(
            loadedConvs.map(async (c) => {
              if (c.lastMessage && c.participant.publicKey) {
                try {
                  const key = await getOrDeriveSharedKey(c.id, c.participant.publicKey);
                  const decrypted = await decryptMessage(c.lastMessage.encryptedBody, key);
                  return { ...c, decryptedLastMessage: decrypted };
                } catch (err) {
                  console.warn(`Failed to decrypt last message for conversation ${c.id}:`, err);
                  return { ...c, decryptedLastMessage: '[Decryption Error]' };
                }
              }
              return { ...c, decryptedLastMessage: null };
            })
          );

          setConversations(updatedConvs);
        } else {
          setErrorMsg(res.error || 'Failed to load conversation list');
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setErrorMsg('Network error. Failed to load conversations.');
      } finally {
        setLoadingConv(false);
      }
    };

    initializeE2EEAndLoadConversations();
  }, []);

  // Set up Pusher WebSocket subscription on active conversation change
  useEffect(() => {
    if (!activeConv) return;

    let pusher: Pusher | null = null;
    let channel: any = null;

    try {
      pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        authEndpoint: `/api/conversations/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('linkedoc_token')}`,
          },
        },
      });

      channel = pusher.subscribe(`private-chat-${activeConv.id}`);
      channel.bind('new-message', async (data: RawMessage) => {
        if (messagesRef.current.some((m) => m.id === data.id)) return;

        try {
          const key = sharedKeysRef.current[data.conversationId];
          if (!key) return;

          const text = await decryptMessage(data.encryptedBody, key);
          const decryptedMsg: DecryptedMessage = {
            ...data,
            decryptedBody: text,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === decryptedMsg.id)) return prev;
            return [...prev, decryptedMsg];
          });

          // Also update last message preview in conversations directory list
          setConversations((prevList) =>
            prevList.map((c) =>
              c.id === data.conversationId
                ? {
                    ...c,
                    lastMessage: {
                      id: data.id,
                      encryptedBody: data.encryptedBody,
                      senderId: data.senderId,
                      createdAt: data.createdAt,
                    },
                    decryptedLastMessage: text,
                  }
                : c
            )
          );
        } catch (err) {
          console.error('Failed to decrypt real-time message payload:', err);
        }
      });
    } catch (err) {
      console.error('Failed to connect to Pusher notification channel:', err);
    }

    return () => {
      if (channel && pusher) {
        channel.unbind('new-message');
        pusher.unsubscribe(`private-chat-${activeConv.id}`);
        pusher.disconnect();
      }
    };
  }, [activeConv]);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Memoized helper to retrieve derived shared secret or derive it from peer public key
  const getOrDeriveSharedKey = async (convId: string, peerPublicKeyBase64: string): Promise<CryptoKey> => {
    if (sharedKeysRef.current[convId]) {
      return sharedKeysRef.current[convId];
    }
    const derived = await deriveSharedKey(peerPublicKeyBase64);
    sharedKeysRef.current[convId] = derived;
    return derived;
  };

  const handleSelectConversation = async (conv: ConversationItem) => {
    setActiveConv(conv);
    setLoadingMessages(true);
    setMessages([]);
    setErrorMsg(null);

    try {
      if (!conv.participant.publicKey) {
        throw new Error('Colleague has not initialized secure public keys. Encrypted chat is unavailable.');
      }

      const key = await getOrDeriveSharedKey(conv.id, conv.participant.publicKey);

      const res = await api.getMessages(conv.id);
      if (res.success) {
        const rawMsgs: RawMessage[] = res.messages;

        const decryptedList = await Promise.all(
          rawMsgs.map(async (m) => {
            try {
              const bodyText = await decryptMessage(m.encryptedBody, key);
              return { ...m, decryptedBody: bodyText };
            } catch (err) {
              console.error('Decryption failed for historical message:', err);
              return { ...m, decryptedBody: '[Decryption Error]' };
            }
          })
        );

        setMessages(decryptedList);
      } else {
        setErrorMsg(res.error || 'Failed to fetch message history');
      }
    } catch (err: any) {
      console.error('Failed to load thread history:', err);
      setErrorMsg(err.message || 'Key derivation failed');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const currentText = inputText;
    setInputText('');

    try {
      const peerKey = activeConv.participant.publicKey;
      if (!peerKey) {
        throw new Error('Peer public key missing');
      }

      const key = await getOrDeriveSharedKey(activeConv.id, peerKey);
      const ciphertext = await encryptMessage(currentText, key);

      const res = await api.sendMessage(activeConv.id, ciphertext);
      if (res.success) {
        const newRawMsg: RawMessage = res.message;
        const decryptedMsg: DecryptedMessage = {
          ...newRawMsg,
          decryptedBody: currentText,
        };

        setMessages((prev) => [...prev, decryptedMsg]);

        setConversations((prevList) =>
          prevList.map((c) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  lastMessage: {
                    id: newRawMsg.id,
                    encryptedBody: ciphertext,
                    senderId: currentUser.id,
                    createdAt: newRawMsg.createdAt,
                  },
                  decryptedLastMessage: currentText,
                }
              : c
          )
        );
      } else {
        setErrorMsg(res.error || 'Failed to dispatch message');
      }
    } catch (err) {
      console.error('Failed to send E2EE message:', err);
      setErrorMsg('Client-side encryption failure. Message not sent.');
    }
  };


  // Helper to extract initials for user avatars
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBgColor = (userId: string) => {
    const colors = [
      'linear-gradient(135deg, #38bdf8, #0284c7)',
      'linear-gradient(135deg, #fb7185, #db2777)',
      'linear-gradient(135deg, #4ade80, #16a34a)',
      'linear-gradient(135deg, #c084fc, #9333ea)',
      'linear-gradient(135deg, #fbbf24, #d97706)',
    ];
    let sum = 0;
    for (let i = 0; i < userId.length; i++) {
      sum += userId.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0' }}>
      {/* Encryption Badge & Status notifications */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '12px 24px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: keyGenerating ? 'var(--warning)' : 'var(--success)',
              boxShadow: keyGenerating ? '0 0 10px var(--warning)' : '0 0 10px var(--success)',
            }}
          />
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} />
            <span>{keyGenerating ? 'Initializing secure keys...' : 'E2EE Secure Messaging'}</span>
          </h2>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--accent)',
            fontWeight: 600,
            background: 'var(--accent-glow)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--primary-glow)',
          }}
        >
          <Lock size={14} />
          <span>End-to-End Encrypted (HIPAA-compliant)</span>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            color: 'var(--danger)',
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '20px',
          height: 'calc(100vh - 220px)',
          minHeight: '500px',
        }}
      >
        {/* Left Side: Directory and Conversations */}
        <div
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
            }}
          >
            <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} />
              <span>Colleague Directory</span>
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConv ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading colleagues list...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Compass size={32} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
                No message threads found. Go to <strong>My Network</strong> to connect and send messages.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-glow)' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: getAvatarBgColor(c.participant.id),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 600,
                        fontSize: '14px',
                        flexShrink: 0,
                        justifyContent: 'center',
                      }}
                    >
                      {getInitials(c.participant.name)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {c.participant.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {c.participant.specialty || 'General Practitioner'}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '4px',
                        }}
                      >
                        {c.decryptedLastMessage || 'No messages yet'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active message thread view */}
        <div
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {activeConv ? (
            <>
              {/* Message topbar info */}
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{activeConv.participant.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {activeConv.participant.specialty || 'General Practitioner'}
                  </div>
                </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    <Lock size={14} />
                    <span>E2EE Secure</span>
                  </div>
              </div>

              {/* Chat Message Stream */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: 'rgba(15, 23, 42, 0.01)',
                }}
              >
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Fetching secure thread history...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No messages in this chat. Start typing below to begin the clinical discussion.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwnMessage = m.senderId === currentUser.id;
                    const timeStr = new Date(m.createdAt).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                          maxWidth: '65%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          style={{
                            background: isOwnMessage
                              ? 'linear-gradient(135deg, var(--primary), var(--primary-glow))'
                              : 'var(--bg-tertiary)',
                            color: isOwnMessage ? '#fff' : 'var(--text-primary)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            borderTopRightRadius: isOwnMessage ? '0' : '12px',
                            borderTopLeftRadius: isOwnMessage ? '12px' : '0',
                            border: isOwnMessage ? 'none' : '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)',
                            lineHeight: 1.5,
                            fontSize: '14px',
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.decryptedBody}
                        </div>
                        <span
                          style={{
                            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            padding: '0 4px',
                          }}
                        >
                          {timeStr}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form editor */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <input
                  type="text"
                  placeholder="Type your encrypted message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            // Select active chat placeholder screen
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto', padding: '40px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '56px',
                  marginBottom: '16px',
                  color: 'var(--primary)',
                  filter: 'drop-shadow(0 0 15px var(--primary-glow))',
                }}
              >
                <MessageSquare size={64} />
              </div>
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', fontWeight: 700 }}>Select a Conversation</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', maxWidth: '320px' }}>
                Choose a professional from the sidebar directory to begin an encrypted clinical discussion thread.
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default Messaging;
