import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Messaging from '../../src/pages/Messaging';
import { api } from '../../src/services/api';
import * as cryptoUtils from '../../src/utils/crypto';

// Mock E2EE Crypto utils
vi.mock('../../src/utils/crypto', () => ({
  generateAndStoreKeys: vi.fn().mockResolvedValue('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEalicekey'),
  deriveSharedKey: vi.fn().mockResolvedValue({}),
  encryptMessage: vi.fn().mockResolvedValue('encryptedciphertextbase64'),
  decryptMessage: vi.fn().mockResolvedValue('Decrypted Bob Message Body'),
}));

// Mock API service layer
vi.mock('../../src/services/api', () => ({
  API_BASE_URL: '/api',
  api: {
    getCurrentUser: vi.fn().mockReturnValue({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Dr. Alice',
      role: 'DOCTOR',
      status: 'APPROVED',
    }),
    registerPublicKey: vi.fn().mockResolvedValue({ success: true }),
    getConversations: vi.fn().mockResolvedValue({
      success: true,
      conversations: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          participant: {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Dr. Bob',
            specialty: 'Cardiology',
            publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbobkey',
          },
          lastMessage: {
            id: '77777777-7777-7777-7777-777777777777',
            encryptedBody: 'encryptedciphertextbase64',
            senderId: '22222222-2222-2222-2222-222222222222',
            createdAt: new Date().toISOString(),
          },
        },
      ],
    }),
    getMessages: vi.fn().mockResolvedValue({
      success: true,
      messages: [
        {
          id: '77777777-7777-7777-7777-777777777777',
          conversationId: '55555555-5555-5555-5555-555555555555',
          senderId: '22222222-2222-2222-2222-222222222222',
          encryptedBody: 'encryptedciphertextbase64',
          status: 'SENT',
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    sendMessage: vi.fn().mockResolvedValue({
      success: true,
      message: {
        id: '88888888-8888-8888-8888-888888888888',
        conversationId: '55555555-5555-5555-5555-555555555555',
        senderId: '11111111-1111-1111-1111-111111111111',
        encryptedBody: 'encryptedAliceText',
        status: 'SENT',
        createdAt: new Date().toISOString(),
      },
    }),
  },
}));

// Mock Pusher JS client
vi.mock('pusher-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      subscribe: vi.fn().mockReturnValue({
        bind: vi.fn(),
        unbind: vi.fn(),
      }),
      unsubscribe: vi.fn(),
      disconnect: vi.fn(),
    })),
  };
});

describe('E2EE Messaging UI Component tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates E2EE keys on mount and displays the active conversation', async () => {
    render(
      <BrowserRouter>
        <Messaging />
      </BrowserRouter>
    );

    // Verify keypair generation check triggers on startup
    await waitFor(() => {
      expect(cryptoUtils.generateAndStoreKeys).toHaveBeenCalled();
      expect(api.registerPublicKey).toHaveBeenCalledWith('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEalicekey');
    });

    // Verify conversation directory list renders
    await waitFor(() => {
      expect(screen.getByText('Dr. Bob')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
    });
  });

  it('selects conversation, fetches and decrypts message threads', async () => {
    render(
      <BrowserRouter>
        <Messaging />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Bob')).toBeInTheDocument();
    });

    // Select/Click Dr. Bob conversation card
    fireEvent.click(screen.getByText('Dr. Bob'));

    // Verify message retrieval triggers and decrypted message renders in active chat box
    await waitFor(() => {
      expect(api.getMessages).toHaveBeenCalledWith('55555555-5555-5555-5555-555555555555');
      expect(cryptoUtils.decryptMessage).toHaveBeenCalled();
      expect(screen.getAllByText('Decrypted Bob Message Body').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('encrypts client-side and dispatches new message body on submit', async () => {
    render(
      <BrowserRouter>
        <Messaging />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Bob')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dr. Bob'));

    await waitFor(() => {
      expect(screen.getAllByText('Decrypted Bob Message Body').length).toBeGreaterThanOrEqual(1);
    });

    // Input new message text
    const input = screen.getByPlaceholderText(/Type your encrypted message/i);
    fireEvent.change(input, { target: { value: 'Secret Alice Message' } });

    // Submit form
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Verify message was encrypted client-side and posted to server
    await waitFor(() => {
      expect(cryptoUtils.encryptMessage).toHaveBeenCalledWith(
        'Secret Alice Message',
        expect.any(Object)
      );
      expect(api.sendMessage).toHaveBeenCalledWith(
        '55555555-5555-5555-5555-555555555555',
        'encryptedciphertextbase64'
      );
    });
  });
});
