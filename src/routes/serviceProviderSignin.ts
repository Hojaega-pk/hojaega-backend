import { Router, Request, Response } from 'express';
import { prismaService } from '../services/prisma.service';

const router = Router();

// Sign in service provider
router.post('/sp-signin', async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;

    // Validate required fields
    if (!pin) {
      return res.status(400).json({ 
        error: 'PIN is required',
        message: 'PIN field must be provided'
      });
    }

    // Validate pin format (exactly 6 digits) - convert to string first
    const pinString = String(pin);
    if (!/^[0-9]{6}$/.test(pinString)) {
      return res.status(400).json({ 
        error: 'Invalid pin format',
        message: 'PIN must be exactly 6 digits (0-9)'
      });
    }

    // Find service provider with matching PIN
    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: {
        pin: String(pin),
        isActive: true // Only allow active service providers to sign in
      }
    });

    if (!serviceProvider) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'PIN is incorrect or no active service provider found with this PIN'
      });
    }

    // Check if service provider has a PIN set
    if (!serviceProvider.pin) {
      return res.status(401).json({ 
        error: 'PIN not configured',
        message: 'This service provider does not have a PIN configured. Please contact support.'
      });
    }

    // Successfully signed in
    const response = {
      id: serviceProvider.id,
      name: serviceProvider.name,
      city: serviceProvider.city,
      skillset: serviceProvider.skillset,
      contactNo: serviceProvider.contactNo,
      pin: serviceProvider.pin,
      description: serviceProvider.description,
      experience: serviceProvider.experience,
      isActive: serviceProvider.isActive,
      status: serviceProvider.status,
      subscriptionStartDate: serviceProvider.subscriptionStartDate,
      subscriptionEndDate: serviceProvider.subscriptionEndDate,
      createdAt: serviceProvider.createdAt,
      updatedAt: serviceProvider.updatedAt
    };

    res.json({
      success: true,
      message: 'Service provider signed in successfully',
      data: response
    });

  } catch (error) {
    console.error('Error signing in service provider:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to sign in service provider. Please try again later.'
    });
  }
});

export { router as serviceProviderSigninRoutes };
