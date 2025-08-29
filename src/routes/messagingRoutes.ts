import { Router, Request, Response } from 'express';
import { MessagingService } from '../services/messaging.service';
import { SocketService } from '../services/socket.service';
import { prismaService } from '../services/prisma.service';

const router = Router();

// Initialize services (this will be properly initialized in the main app)
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
export const initializeMessagingServices = (msgService: MessagingService, sockService: SocketService) => {
  messagingService = msgService;
  socketService = sockService;
};

// Create a new conversation
router.post('/conversation/create', initializeServices, async (req: Request, res: Response) => {
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

// Send a message
router.post('/message/send', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, senderType, messageType, content, metadata } = req.body;

    if (!conversationId || !senderId || !senderType || !messageType || !content) {
      return res.status(400).json({ 
        error: 'conversationId, senderId, senderType, messageType, and content are required' 
      });
    }

    const message = await messagingService.sendMessage({
      conversationId,
      senderId,
      senderType,
      messageType,
      content,
      metadata
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

// Send an offer
router.post('/message/offer', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, senderType, amount, description, validityHours } = req.body;

    if (!conversationId || !senderId || !senderType || !amount || !description) {
      return res.status(400).json({ 
        error: 'conversationId, senderId, senderType, amount, and description are required' 
      });
    }

    const message = await messagingService.sendOffer(conversationId, senderId, senderType, {
      amount,
      description,
      validityHours
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error sending offer:', error);
    res.status(500).json({ error: error.message || 'Failed to send offer' });
  }
});

// Send a charge
router.post('/message/charge', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, senderType, amount, description, breakdown } = req.body;

    if (!conversationId || !senderId || !senderType || !amount || !description) {
      return res.status(400).json({ 
        error: 'conversationId, senderId, senderType, amount, and description are required' 
      });
    }

    const message = await messagingService.sendCharge(conversationId, senderId, senderType, {
      amount,
      description,
      breakdown
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error sending charge:', error);
    res.status(500).json({ error: error.message || 'Failed to send charge' });
  }
});

// Send payment confirmation
router.post('/message/payment', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, senderType, amount, method, transactionId } = req.body;

    if (!conversationId || !senderId || !senderType || !amount || !method) {
      return res.status(400).json({ 
        error: 'conversationId, senderId, senderType, amount, and method are required' 
      });
    }

    const message = await messagingService.sendPayment(conversationId, senderId, senderType, {
      amount,
      method,
      transactionId
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error sending payment message:', error);
    res.status(500).json({ error: error.message || 'Failed to send payment message' });
  }
});

// Accept an offer
router.post('/message/accept-offer', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, senderType, offerMessageId } = req.body;

    if (!conversationId || !senderId || !senderType || !offerMessageId) {
      return res.status(400).json({ 
        error: 'conversationId, senderId, senderType, and offerMessageId are required' 
      });
    }

    const message = await messagingService.acceptOffer(conversationId, senderId, senderType, offerMessageId);

    res.status(201).json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: error.message || 'Failed to accept offer' });
  }
});

// Decline an offer
router.post('/message/decline-offer', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, senderType, offerMessageId, reason } = req.body;

    if (!conversationId || !senderId || !senderType || !offerMessageId) {
      return res.status(400).json({ 
        error: 'conversationId, senderId, senderType, and offerMessageId are required' 
      });
    }

    const message = await messagingService.declineOffer(conversationId, senderId, senderType, offerMessageId, reason);

    res.status(201).json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error declining offer:', error);
    res.status(500).json({ error: error.message || 'Failed to decline offer' });
  }
});

// Get conversation messages
router.get('/conversation/:conversationId/messages', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

          const messages = await messagingService.getConversationMessages(
        parseInt(conversationId!),
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        messages,
        conversationId: parseInt(conversationId!)
      });
  } catch (error: any) {
    console.error('Error getting conversation messages:', error);
    res.status(500).json({ error: error.message || 'Failed to get conversation messages' });
  }
});

// Get user conversations
router.get('/conversations/:userType/:userId', initializeServices, async (req: Request, res: Response) => {
  try {
    const { userId, userType } = req.params;

    if (!['service_provider', 'consumer'].includes(userType!)) {
      return res.status(400).json({ error: 'userType must be either service_provider or consumer' });
    }

    const conversations = await messagingService.getUserConversations(
      parseInt(userId!),
      userType! as 'service_provider' | 'consumer'
    );

    res.json({
      success: true,
      conversations
    });
  } catch (error: any) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({ error: error.message || 'Failed to get user conversations' });
  }
});

// Mark messages as read
router.put('/conversation/:conversationId/read', initializeServices, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'userId and userType are required' });
    }

    if (!['service_provider', 'consumer'].includes(userType)) {
      return res.status(400).json({ error: 'userType must be either service_provider or consumer' });
    }

          const result = await messagingService.markMessagesAsRead(
        parseInt(conversationId!),
        userId,
        userType as 'service_provider' | 'consumer'
      );

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark messages as read' });
  }
});

// Get online users (for debugging/admin purposes)
router.get('/online-users', initializeServices, (req: Request, res: Response) => {
  try {
    const onlineUsers = socketService.getOnlineUsers();
    res.json({
      success: true,
      onlineUsers
    });
  } catch (error: any) {
    console.error('Error getting online users:', error);
    res.status(500).json({ error: error.message || 'Failed to get online users' });
  }
});

export { router as messagingRoutes };
