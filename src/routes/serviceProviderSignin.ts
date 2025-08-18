import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
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

    // Validate pin format (exactly 4 digits) - convert to string first
    const pinString = String(pin);
    if (!/^[0-9]{4}$/.test(pinString)) {
      return res.status(400).json({ 
        error: 'Invalid pin format',
        message: 'PIN must be exactly 4 digits (0-9)'
      });
    }

    // Find service provider by contactNo or other identifier (if needed, adjust query)
    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: {
        isActive: true
      }
    });

    if (!serviceProvider || !serviceProvider.pin) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'PIN is incorrect or no active service provider found with this PIN'
      });
    }

    // Compare hashed PIN
    const isMatch = await bcrypt.compare(pinString, serviceProvider.pin);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'PIN is incorrect or no active service provider found with this PIN'
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
