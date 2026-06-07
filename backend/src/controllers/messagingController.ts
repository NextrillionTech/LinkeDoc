import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Pusher from 'pusher';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Initialize Pusher Client
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'dummy_id',
  key: process.env.PUSHER_KEY || 'dummy_key',
  secret: process.env.PUSHER_SECRET || 'dummy_secret',
  cluster: process.env.PUSHER_CLUSTER || 'dummy_cluster',
  useTLS: true,
});

export const registerPublicKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { publicKey } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { publicKey },
    });

    res.status(200).json({
      success: true,
      message: 'Public key successfully registered',
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { publicKey: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      publicKey: user.publicKey,
    });
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { participantId } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.id === participantId) {
    res.status(400).json({ success: false, error: 'Cannot start a conversation with yourself' });
    return;
  }

  try {
    // Verify target participant exists and is approved
    const peerUser = await prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!peerUser) {
      res.status(404).json({ success: false, error: 'Participant not found' });
      return;
    }

    if (peerUser.status !== 'APPROVED') {
      res.status(403).json({ success: false, error: 'Cannot start a conversation with a pending/rejected user' });
      return;
    }

    // Sort participant IDs lexicographically to enforce global uniqueness for [participant1Id, participant2Id]
    const p1Id = req.user.id < participantId ? req.user.id : participantId;
    const p2Id = req.user.id < participantId ? participantId : req.user.id;

    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1Id,
          participant2Id: p2Id,
        },
      },
    });

    let statusCode = 200;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: p1Id,
          participant2Id: p2Id,
        },
      });
      statusCode = 201;
    }

    res.status(statusCode).json({
      success: true,
      conversationId: conversation.id,
    });
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            specialty: true,
            publicKey: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            specialty: true,
            publicKey: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedConversations = conversations.map((c) => {
      const peer = c.participant1Id === req.user!.id ? c.participant2 : c.participant1;
      const lastMsg = c.messages[0] || null;
      return {
        id: c.id,
        participant: peer,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          encryptedBody: lastMsg.encryptedBody,
          senderId: lastMsg.senderId,
          createdAt: new Date(lastMsg.createdAt).toISOString(),
        } : null,
      };
    });

    res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (err) {
    next(err);
  }
};

export const createMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id: conversationId } = req.params;
  const { encryptedBody } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied: you are not a participant in this conversation' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.id,
        encryptedBody,
        status: 'SENT',
      },
    });

    // Broadcast message payload in real-time
    try {
      await pusher.trigger(`private-chat-${conversationId}`, 'new-message', {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        encryptedBody: message.encryptedBody,
        status: message.status,
        createdAt: new Date(message.createdAt).toISOString(),
      });
    } catch (pusherErr) {
      // eslint-disable-next-line no-console
      console.error('[Pusher Error] Failed to trigger real-time notification:', pusherErr);
    }

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        encryptedBody: message.encryptedBody,
        status: message.status,
        createdAt: new Date(message.createdAt).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id: conversationId } = req.params;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied: you are not a participant in this conversation' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      encryptedBody: m.encryptedBody,
      status: m.status,
      createdAt: new Date(m.createdAt).toISOString(),
    }));

    res.status(200).json({
      success: true,
      messages: formattedMessages,
    });
  } catch (err) {
    next(err);
  }
};

export const pusherAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { socket_id, channel_name } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!socket_id || !channel_name) {
    res.status(400).json({ success: false, error: 'Missing socket_id or channel_name' });
    return;
  }

  try {
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    res.status(200).send(authResponse);
  } catch (err) {
    next(err);
  }
};
