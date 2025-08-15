import { prismaService } from './prisma.service';

export class SubscriptionService {
  /**
   * Check and update subscription status for all service providers
   */
  static async checkAndUpdateSubscriptions(): Promise<void> {
    try {
      const currentDate = new Date();
      
      // Find all active service providers
      const activeProviders = await prismaService.getPrismaClient().serviceProvider.findMany({
        where: { isActive: true }
      });

      for (const provider of activeProviders) {
        if (provider.subscriptionEndDate && provider.subscriptionEndDate < currentDate && provider.status !== 0) {
          // Update status to expired
          await prismaService.getPrismaClient().serviceProvider.update({
            where: { id: provider.id },
            data: { status: 0 }
          });
          
          console.log(`Subscription expired for service provider ID: ${provider.id} - ${provider.name}`);
        }
      }
    } catch (error) {
      console.error('Error checking subscriptions:', error);
    }
  }

  /**
   * Renew subscription for a service provider
   */
  static async renewSubscription(providerId: number, months: number = 1): Promise<boolean> {
    try {
      const provider = await prismaService.getPrismaClient().serviceProvider.findFirst({
        where: { id: providerId, isActive: true }
      });

      if (!provider) {
        return false;
      }

      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + months);

      await prismaService.getPrismaClient().serviceProvider.update({
        where: { id: providerId },
        data: {
          status: 1,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: newEndDate
        }
      });

      console.log(`Subscription renewed for service provider ID: ${providerId} until ${newEndDate}`);
      return true;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      return false;
    }
  }

  /**
   * Get subscription status for a service provider
   */
  static async getSubscriptionStatus(providerId: number): Promise<any> {
    try {
      const provider = await prismaService.getPrismaClient().serviceProvider.findFirst({
        where: { id: providerId, isActive: true }
      });

      if (!provider) {
        return null;
      }

      const currentDate = new Date();
      const isExpired = provider.subscriptionEndDate ? provider.subscriptionEndDate < currentDate : false;
      const daysUntilExpiry = provider.subscriptionEndDate ? 
        Math.ceil((provider.subscriptionEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        providerId: provider.id,
        name: provider.name,
        status: provider.status,
        isExpired,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        subscriptionStartDate: provider.subscriptionStartDate,
        subscriptionEndDate: provider.subscriptionEndDate,
        message: isExpired ? 
          'Subscription period ended. Please complete your payment to continue services.' :
          `Subscription active. ${daysUntilExpiry} days remaining.`
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }
}
