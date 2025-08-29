import { prismaService } from './prisma.service';
import { SocketService } from './socket.service';

export interface CreateMessageData {
  conversationId: number;
  senderId: number;
  senderType: 'service_provider' | 'consumer';
  messageType: 'OFFER' | 'ACCEPT' | 'DECLINE' | 'CHARGE' | 'PAYMENT' | 'GENERAL' | 'SYSTEM';
  content: string;
  metadata?: any;
}

export interface CreateConversationData {
  serviceProviderId: number;
  consumerId: number;
}

export class MessagingService {
  constructor(private socketService: SocketService) {}

  // Create a new conversation between service provider and consumer
  async createConversation(data: CreateConversationData) {
    try {
      console.log('MessagingService: Creating conversation with data:', data);
      
      // Check if conversation already exists
      const existingConversation = await prismaService.getPrismaClient().conversation.findUnique({
        where: {
          serviceProviderId_consumerId: {
            serviceProviderId: data.serviceProviderId,
            consumerId: data.consumerId
          }
        }
      });

      if (existingConversation) {
        console.log('MessagingService: Found existing conversation:', existingConversation);
        return existingConversation;
      }

      console.log('MessagingService: No existing conversation found, creating new one...');

      // Create new conversation
      const conversation = await prismaService.getPrismaClient().conversation.create({
        data: {
          serviceProviderId: data.serviceProviderId,
          consumerId: data.consumerId
        },
        include: {
          serviceProvider: {
            select: { id: true, name: true, city: true, skillset: true }
          },
          consumer: {
            select: { id: true, name: true, city: true }
          }
        }
      });

      console.log('MessagingService: Conversation created successfully:', conversation);
      return conversation;
    } catch (error: any) {
      console.error('MessagingService: Error creating conversation:', error);
      console.error('MessagingService: Error stack:', error.stack);
      throw new Error(`Failed to create conversation: ${error.message || 'Unknown error'}`);
    }
  }

  // Send a message
  async sendMessage(data: CreateMessageData) {
    try {
      // Verify conversation exists
      const conversation = await prismaService.getPrismaClient().conversation.findUnique({
        where: { id: data.conversationId }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Create message
      const message = await prismaService.getPrismaClient().message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderType: data.senderType,
          messageType: data.messageType,
          content: data.content,
          metadata: data.metadata || {}
        },
        include: {
          conversation: {
            include: {
              serviceProvider: { select: { id: true, name: true } },
              consumer: { select: { id: true, name: true } }
            }
          }
        }
      });

      // Update conversation last message time
      await prismaService.getPrismaClient().conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() }
      });

      // Send real-time message via socket
      this.socketService.sendMessageToConversation(data.conversationId, {
        type: 'new_message',
        message: message
      });

      // Send notification to the other user if they're not in the conversation
      const otherUserId = data.senderType === 'service_provider' 
        ? conversation.consumerId 
        : conversation.serviceProviderId;
      const otherUserType = data.senderType === 'service_provider' ? 'consumer' : 'service_provider';

      this.socketService.sendNotification(otherUserId, otherUserType, {
        type: 'new_message_notification',
        conversationId: data.conversationId,
        senderName: data.senderType === 'service_provider' 
          ? (await prismaService.getPrismaClient().serviceProvider.findUnique({ where: { id: data.senderId } }))?.name
          : (await prismaService.getPrismaClient().consumer.findUnique({ where: { id: data.senderId } }))?.name,
        messageType: data.messageType,
        content: data.content
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Send offer message
  async sendOffer(conversationId: number, senderId: number, senderType: 'service_provider' | 'consumer', offerData: {
    amount: number;
    description: string;
    validityHours?: number;
  }) {
    const content = `Offer: ${offerData.description} - $${offerData.amount}`;
    const metadata = {
      amount: offerData.amount,
      description: offerData.description,
      validityHours: offerData.validityHours || 24,
      offerExpiresAt: new Date(Date.now() + (offerData.validityHours || 24) * 60 * 60 * 1000)
    };

    return this.sendMessage({
      conversationId,
      senderId,
      senderType,
      messageType: 'OFFER',
      content,
      metadata
    });
  }

  // Send charge message
  async sendCharge(conversationId: number, senderId: number, senderType: 'service_provider' | 'consumer', chargeData: {
    amount: number;
    description: string;
    breakdown?: string[];
  }) {
    const content = `Charge: ${chargeData.description} - $${chargeData.amount}`;
    const metadata = {
      amount: chargeData.amount,
      description: chargeData.description,
      breakdown: chargeData.breakdown || [],
      timestamp: new Date()
    };

    return this.sendMessage({
      conversationId,
      senderId,
      senderType,
      messageType: 'CHARGE',
      content,
      metadata
    });
  }

  // Send payment message
  async sendPayment(conversationId: number, senderId: number, senderType: 'service_provider' | 'consumer', paymentData: {
    amount: number;
    method: string;
    transactionId?: string;
  }) {
    const content = `Payment: $${paymentData.amount} via ${paymentData.method}`;
    const metadata = {
      amount: paymentData.amount,
      method: paymentData.method,
      transactionId: paymentData.transactionId,
      timestamp: new Date()
    };

    return this.sendMessage({
      conversationId,
      senderId,
      senderType,
      messageType: 'PAYMENT',
      content,
      metadata
    });
  }

  // Accept offer
  async acceptOffer(conversationId: number, senderId: number, senderType: 'service_provider' | 'consumer', offerMessageId: number) {
    const content = 'Offer accepted';
    const metadata = {
      acceptedOfferId: offerMessageId,
      acceptedAt: new Date()
    };

    return this.sendMessage({
      conversationId,
      senderId,
      senderType,
      messageType: 'ACCEPT',
      content,
      metadata
    });
  }

  // Decline offer
  async declineOffer(conversationId: number, senderId: number, senderType: 'service_provider' | 'consumer', offerMessageId: number, reason?: string) {
    const content = reason ? `Offer declined: ${reason}` : 'Offer declined';
    const metadata = {
      declinedOfferId: offerMessageId,
      declinedAt: new Date(),
      reason: reason || null
    };

    return this.sendMessage({
      conversationId,
      senderId,
      senderType,
      messageType: 'DECLINE',
      content,
      metadata
    });
  }

  // Get conversation messages
  async getConversationMessages(conversationId: number, limit: number = 50, offset: number = 0) {
    try {
      const messages = await prismaService.getPrismaClient().message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          conversation: {
            include: {
              serviceProvider: { select: { id: true, name: true } },
              consumer: { select: { id: true, name: true } }
            }
          }
        }
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error('Failed to get conversation messages');
    }
  }

  // Get user conversations
  async getUserConversations(userId: number, userType: 'service_provider' | 'consumer') {
    try {
      const conversations = await prismaService.getPrismaClient().conversation.findMany({
        where: userType === 'service_provider' 
          ? { serviceProviderId: userId }
          : { consumerId: userId },
        include: {
          serviceProvider: { select: { id: true, name: true, city: true, skillset: true } },
          consumer: { select: { id: true, name: true, city: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get user conversations');
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: number, userId: number, userType: 'service_provider' | 'consumer') {
    try {
      await prismaService.getPrismaClient().message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false
        },
        data: { isRead: true }
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }
}