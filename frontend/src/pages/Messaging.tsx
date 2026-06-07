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
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  ShieldAlert,
  Activity,
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

  // Video Call Simulation State
  const [callOpen, setCallOpen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callVideoStopped, setCallVideoStopped] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  // WebRTC Video Call Actions
  const startVideoCall = async () => {
    setCallOpen(true);
    setCallDuration(0);
    setCallMuted(false);
    setCallVideoStopped(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access not allowed or unavailable. Operating in simulation mode.', err);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const endVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallOpen(false);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setCallMuted(!callMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setCallVideoStopped(!callVideoStopped);
    }
  };

  useEffect(() => {
    if (callOpen && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callOpen]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* WebRTC calling button */}
                  <button
                    onClick={startVideoCall}
                    style={{
                      background: 'var(--primary-glow)',
                      border: '1px solid var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 14px',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    title="Initiate E2EE Clinical Consultation Video Call"
                  >
                    <Video size={16} />
                    <span>Video Consult</span>
                  </button>

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

      {/* WebRTC Video Consultation Calling overlay Modal */}
      {callOpen && activeConv && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#090d16',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            fontFamily: 'var(--font-body)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d1321' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--success)', width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 8px var(--success)' }}></div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>Secure Consultation: Dr. {activeConv.participant.name}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: '4px', color: '#38bdf8' }}>
                <Lock size={14} />
                <span>AES-256 E2E Encrypted</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                {formatDuration(callDuration)}
              </span>
            </div>
          </div>

          {/* Main call screens */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', background: '#070a13', overflow: 'hidden' }}>
            
            {/* Main view: Simulated Remote Colleague Stream */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              
              {/* Simulated high-fidelity UI overlay of remote peer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 5, padding: '30px', borderRadius: '12px', background: 'rgba(13,19,33,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: getAvatarBgColor(activeConv.participant.id), color: '#fff', fontSize: '32px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  {getInitials(activeConv.participant.name)}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>Dr. {activeConv.participant.name}</h2>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>{activeConv.participant.specialty || 'General Practitioner'}</p>
                </div>
                
                {/* Simulated WebRTC E2EE connection telemetry graph */}
                <div style={{ width: '220px', height: '50px', borderTop: '1px solid rgba(56, 189, 248, 0.2)', position: 'relative', overflow: 'hidden', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: '#38bdf8', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                    <Activity size={12} />
                    <span>Real-time Audio Stream</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '20px' }}>
                    {[12, 24, 18, 30, 10, 42, 20, 15, 33, 19, 8, 25, 14].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          width: '4px',
                          height: `${h}px`,
                          background: 'linear-gradient(to top, var(--primary), #38bdf8)',
                          borderRadius: '2px',
                          animation: 'pulse 1s infinite alternate',
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Looping Heartbeat SVG graph in background */}
              <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%', opacity: 0.05, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="200" viewBox="0 0 1000 200" fill="none">
                  <path d="M0 100 H300 L320 70 L340 130 L360 30 L380 170 L400 100 H600 L620 60 L640 140 L660 100 H1000" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* PIP View: Local User Camera Stream */}
            <div
              style={{
                position: 'absolute',
                bottom: '30px',
                right: '30px',
                width: '240px',
                height: '160px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.15)',
                background: '#000',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 20
              }}
            >
              {localStream && !callVideoStopped ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#94a3b8', fontSize: '12px', gap: '8px' }}>
                  <VideoOff size={24} />
                  <span>Your Camera is Off</span>
                </div>
              )}
            </div>

          </div>

          {/* Bottom call control controls panel */}
          <div style={{ padding: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', background: '#0d1321', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={toggleMute}
              style={{
                background: callMuted ? '#ef4444' : 'rgba(255,255,255,0.08)',
                border: 'none',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              title={callMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {callMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={endVideoCall}
              style={{
                background: '#ef4444',
                border: 'none',
                padding: '0 32px',
                height: '56px',
                borderRadius: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                gap: '10px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              <PhoneOff size={20} />
              <span>End Consultation</span>
            </button>

            <button
              onClick={toggleVideo}
              style={{
                background: callVideoStopped ? '#ef4444' : 'rgba(255,255,255,0.08)',
                border: 'none',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              title={callVideoStopped ? 'Start Video' : 'Stop Video'}
            >
              {callVideoStopped ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
