import express, { Router, Request, Response } from 'express';
import { MessagingService } from '../services/messaging.service';
import { SocketService } from '../services/socket.service';
import { prismaService } from '../services/prisma.service';

const router = Router();

let messagingService: MessagingService;
let socketService: SocketService;

// Middleware to initialize services
const initializeServices = (req: Request, res: Response, next: any) => {
  if (!messagingService || !socketService) {
    return res.status(500).json({ error: 'Services not initialized' });
  }
  next();
};

// Initialize services function (called from main app)
export const initializeConversationServices = (msgService: MessagingService, sockService: SocketService) => {
  messagingService = msgService;
  socketService = sockService;
};

// ===== CONVERSATION MANAGEMENT =====

// Create a new conversation
router.post('/conversation', initializeServices, async (req: Request, res: Response) => {
  try {
    console.log('Creating conversation with body:', req.body);
    
    const { serviceProviderId, consumerId } = req.body;

    if (!serviceProviderId || !consumerId) {
      return res.status(400).json({ error: 'serviceProviderId and consumerId are required' });
    }

    // Validate that IDs are numbers
    if (typeof serviceProviderId !== 'number' || typeof consumerId !== 'number') {
      return res.status(400).json({ 
        error: 'serviceProviderId and consumerId must be numbers',
        received: { serviceProviderId: typeof serviceProviderId, consumerId: typeof consumerId }
      });
    }

    // Check if service provider exists
    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.findUnique({
      where: { id: serviceProviderId }
    });
    
    if (!serviceProvider) {
      return res.status(404).json({ error: `Service provider with ID ${serviceProviderId} not found` });
    }

    // Check if consumer exists
    const consumer = await prismaService.getPrismaClient().consumer.findUnique({
      where: { id: consumerId }
    });
    
    if (!consumer) {
      return res.status(404).json({ error: `Consumer with ID ${consumerId} not found` });
    }

    console.log('Service provider and consumer found, creating conversation...');

    const conversation = await messagingService.createConversation({
      serviceProviderId,
      consumerId
    });

    console.log('Conversation created successfully:', conversation);

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to create conversation',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== UNIVERSAL GET API =====

// Universal GET API - handles getting conversations, conversation details, and messages
router.get('/conversation', initializeServices, async (req: Request, res: Response) => {
  try {
    const { 
      id,                    // Get specific conversation by ID
      userType,              // Get conversations for user (service_provider or consumer)
      userId,                // User ID for getting conversations
      includeMessages,        // Include messages in response
      page = 1,              // Page number for messages
      limit = 50             // Limit for messages
    } = req.query;

    // Case 1: Get specific conversation by ID
    if (id) {
      const conversationId = parseInt(id as string);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Conversation ID must be a valid number' });
      }

      const conversation = await prismaService.getPrismaClient().conversation.findUnique({
        where: { id: conversationId },
        include: {
          serviceProvider: { select: { id: true, name: true, city: true, skillset: true } },
          consumer: { select: { id: true, name: true, city: true } },
          ...(includeMessages === 'true' && {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: parseInt(limit as string) || 50,
              skip: (parseInt(page as string) - 1) * (parseInt(limit as string) || 50)
            }
          })
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // If messages are requested, get total count for pagination
      let messageStats = null;
      if (includeMessages === 'true') {
        const totalMessages = await prismaService.getPrismaClient().message.count({
          where: { conversationId }
        });
        messageStats = {
          totalMessages,
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 50,
          pages: Math.ceil(totalMessages / (parseInt(limit as string) || 50))
        };
      }

      return res.json({
        success: true,
        conversation,
        ...(messageStats && { pagination: messageStats })
      });
    }

    // Case 2: Get conversations for a user
    if (userType && userId) {
      if (!['service_provider', 'consumer'].includes(userType as string)) {
        return res.status(400).json({ error: 'userType must be either "service_provider" or "consumer"' });
      }

      const userIdNum = parseInt(userId as string);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: 'userId must be a valid number' });
      }

      let conversations;
      if (userType === 'service_provider') {
        conversations = await prismaService.getPrismaClient().conversation.findMany({
          where: { serviceProviderId: userIdNum },
          include: {
            serviceProvider: { select: { id: true, name: true, city: true, skillset: true } },
            consumer: { select: { id: true, name: true, city: true } },
            ...(includeMessages === 'true' && {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            })
          },
          orderBy: { lastMessageAt: 'desc' }
        });
      } else {
        conversations = await prismaService.getPrismaClient().conversation.findMany({
          where: { consumerId: userIdNum },
          include: {
            serviceProvider: { select: { id: true, name: true, city: true, skillset: true } },
            consumer: { select: { id: true, name: true, city: true } },
            ...(includeMessages === 'true' && {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            })
          },
          orderBy: { lastMessageAt: 'desc' }
        });
      }

      return res.json({
        success: true,
        conversations
      });
    }

    // Case 3: Get messages for a conversation (when conversation ID is provided via query param)
    if (includeMessages === 'true' && !id && !userType && !userId) {
      return res.status(400).json({ 
        error: 'Conversation ID (id) is required when requesting messages' 
      });
    }

    // If no valid parameters provided
    return res.status(400).json({ 
      error: 'Please provide either: id (for specific conversation), or userType + userId (for user conversations), or id + includeMessages=true (for messages)',
      examples: {
        getConversation: 'GET /api/conversation?id=123',
        getUserConversations: 'GET /api/conversation?userType=consumer&userId=5',
        getConversationWithMessages: 'GET /api/conversation?id=123&includeMessages=true&page=1&limit=20'
      }
    });

  } catch (error: any) {
    console.error('Error in universal GET API:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch data' });
  }
});

// Update conversation status
router.put('/conversation/:id/status', initializeServices, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const conversationId = parseInt(id);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Conversation ID must be a valid number' });
    }

    if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ACTIVE, COMPLETED, or CANCELLED' });
    }

    const conversation = await prismaService.getPrismaClient().conversation.update({
      where: { id: conversationId },
      data: { status },
      include: {
        serviceProvider: { select: { id: true, name: true, city: true, skillset: true } },
        consumer: { select: { id: true, name: true, city: true } }
      }
    });

    res.json({
      success: true,
      conversation
    });
  } catch (error: any) {
    console.error('Error updating conversation status:', error);
    res.status(500).json({ error: error.message || 'Failed to update conversation status' });
  }
});

// ===== MESSAGE MANAGEMENT =====

// Simple message sending API - only requires conversation ID and content
router.post('/message', initializeServices, async (req: Request, res: Response) => {
  try {
    const { 
      id,        // conversation ID
      content    // message content
    } = req.body;

    // Basic validation
    if (!id || !content) {
      return res.status(400).json({ 
        error: 'id (conversation ID) and content are required' 
      });
    }

    // Validate id is a number
    if (typeof id !== 'number') {
      return res.status(400).json({ 
        error: 'id must be a number' 
      });
    }

    // Get conversation to determine sender details
    const conversation = await prismaService.getPrismaClient().conversation.findUnique({
      where: { id },
      include: {
        serviceProvider: { select: { id: true, name: true } },
        consumer: { select: { id: true, name: true } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // For now, we'll use the consumer as the sender (you can modify this logic as needed)
    // You might want to get the actual sender from authentication token or request headers
    const senderId = conversation.consumerId;
    const senderType = 'consumer';

    // Send message using the universal messaging service
    const message = await messagingService.sendMessage({
      conversationId: id,
      senderId,
      senderType,
      messageType: 'GENERAL', // Default to GENERAL type
      content,
      metadata: {} // Empty metadata
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// Simple: Get all messages for a conversation by ID
router.get('/messages', initializeServices, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id (conversation ID) query param is required' });
    }

    const conversationId = parseInt(id);
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'id must be a valid number' });
    }

    // Ensure conversation exists
    const convo = await prismaService.getPrismaClient().conversation.findUnique({ where: { id: conversationId } });
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await prismaService.getPrismaClient().message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/conversation/:id/read', initializeServices, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const conversationId = parseInt(id);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Conversation ID must be a valid number' });
    }

    if (!userId || !userType) {
      return res.status(400).json({ error: 'userId and userType are required' });
    }

    // Mark all unread messages in this conversation as read
    const result = await prismaService.getPrismaClient().message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: `Marked ${result.count} messages as read`,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark messages as read' });
  }
});

// Note: All message types are now handled by the universal /message endpoint above

// Note: Utility endpoints removed as requested

export { router as conversationRoutes };
