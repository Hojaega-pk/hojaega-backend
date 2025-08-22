
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { validateServiceProvider } from '../middleware/validation';
import { prismaService } from '../services/prisma.service';
import { SubscriptionService } from '../services/subscription.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure screenshots folder exists
const uploadDir = path.join(__dirname, '../../screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function imageFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
}


// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


interface ServiceProviderRequestBody {
  name: string;
  city: string;
  skillset: string;
  contactNo: string;
  pin?: string; // plain pin from frontend, will be hashed
  description?: string;
  experience?: string;
}


interface FilterRequestBody {
  city?: string;
  skillset?: string;
  experience?: string;
  name?: string;
  search?: string; 
}


interface TypedRequest extends Request {
  body: ServiceProviderRequestBody;
}


interface FilterRequest extends Request {
  body: FilterRequestBody;
}

router.get('/sp-list', async (req: Request, res: Response) => {
  try {
    const serviceProviders = await prismaService.getPrismaClient().serviceProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: serviceProviders,
      count: serviceProviders.length,
      message: 'Service providers retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching service providers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.get('/sp-get/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required'
      });
    }

    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: { id: parseInt(id), isActive: true }
    });
    
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }
    
    res.json({
      success: true,
      data: serviceProvider
    });
  } catch (error) {
    console.error('Error fetching service provider:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.post('/sp-create', validateServiceProvider, async (req: TypedRequest, res: Response) => {
  try {
  const { name, city, skillset, contactNo, pin, description, experience } = req.body;

    // Validate 4-digit PIN
    if (pin && !/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits (0-9)'
      });
    }

    // Validate contact number
    if (!contactNo || contactNo.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid contact number is required (minimum 10 characters)'
      });
    }

    // Check if service provider with this contact number already exists
    const existingProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: { contactNo: contactNo.trim() }
    });

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Service provider with this contact number already exists'
      });
    }

    // Calculate subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // Add 1 month

    // Hash the PIN if provided
    let hashedPin: string | null = null;
    if (pin) {
      const saltRounds = 10;
      hashedPin = await bcrypt.hash(pin, saltRounds);
    }

    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.create({
      data: {
        name,
        city,
        skillset,
        contactNo: contactNo.trim(),
        pin: hashedPin || null,
        description: description || null,
        experience: experience || null,
        isActive: true,
        status: 1, // Active subscription
        subscriptionStartDate,
        subscriptionEndDate
      }
    });

    res.status(201).json({
      success: true,
      data: serviceProvider,
      message: 'Service provider created successfully'
    });
  } catch (error) {
    console.error('Error creating service provider:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.put('/sp-update/:id', validateServiceProvider, async (req: TypedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, city, skillset, contactNo, pin, description, experience } = req.body;

    // Validate 4-digit PIN
    if (pin && !/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits (0-9)'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required'
      });
    }

    // Check if service provider exists
    const existingProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: { id: parseInt(id), isActive: true }
    });

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    // Check for duplicate contact number (excluding current provider)
    const duplicateProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: {
        contactNo,
        NOT: { id: parseInt(id) }
      }
    });

    if (duplicateProvider) {
      return res.status(400).json({
        success: false,
        message: 'Service provider with this contact number already exists'
      });
    }

    // Hash the PIN if provided
    let hashedPin: string | null = null;
    if (pin) {
      const saltRounds = 10;
      hashedPin = await bcrypt.hash(pin, saltRounds);
    }

    const updatedProvider = await prismaService.getPrismaClient().serviceProvider.update({
      where: { id: parseInt(id) },
      data: {
        name,
        city,
        skillset,
        contactNo,
  ...(hashedPin !== null ? { pin: hashedPin } : {}),
        description: description || null,
        experience: experience || null
      }
    });

    res.json({
      success: true,
      data: updatedProvider,
      message: 'Service provider updated successfully'
    });
  } catch (error) {
    console.error('Error updating service provider:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.delete('/sp-delete/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required'
      });
    }
    
    // Check if service provider exists
    const existingProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: { id: parseInt(id), isActive: true }
    });

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    // Soft delete by setting isActive to false
    await prismaService.getPrismaClient().serviceProvider.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Service provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service provider:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.post('/sp-filter', async (req: FilterRequest, res: Response) => {
  try {
    const { city, skillset, experience, name, search } = req.body;
    
    const serviceProviders = await prismaService.getPrismaClient().serviceProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const filteredProviders = serviceProviders.filter((provider: any) => {
      const matchesCity = city ? provider.city.toLowerCase().includes(city.toLowerCase()) : true;
      const matchesSkillset = skillset ? provider.skillset.toLowerCase().includes(skillset.toLowerCase()) : true;
      const matchesExperience = experience ? provider.experience === experience : true;
      const matchesName = name ? provider.name.toLowerCase().includes(name.toLowerCase()) : true;
      const matchesSearch = search ? 
        provider.name.toLowerCase().includes(search.toLowerCase()) || 
        provider.city.toLowerCase().includes(search.toLowerCase()) || 
        provider.skillset.toLowerCase().includes(search.toLowerCase()) : true;

      return matchesCity && matchesSkillset && matchesExperience && matchesName && matchesSearch;
    });
    
    res.json({
      success: true,
      data: filteredProviders,
      count: filteredProviders.length,
      message: 'Filtered service providers retrieved successfully'
    });
  } catch (error) {
    console.error('Error filtering service providers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.get('/sp-stats', async (req: Request, res: Response) => {
  try {
    const totalCount = await prismaService.getPrismaClient().serviceProvider.count({ where: { isActive: true } });
    
    const cityStats = await prismaService.getPrismaClient().serviceProvider.groupBy({
      by: ['city'],
      where: { isActive: true },
      _count: { _all: true }
    });
    
    const skillsetStats = await prismaService.getPrismaClient().serviceProvider.groupBy({
      by: ['skillset'],
      where: { isActive: true },
      _count: { _all: true }
    });
    
    res.json({
      success: true,
      data: {
        totalProviders: totalCount,
        byCity: cityStats,
        bySkillset: skillsetStats
      },
      message: 'Service provider statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching service provider statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cities API endpoint - returns unique cities where service providers are available
router.get('/cities', async (req: Request, res: Response) => {
  try {
    // Get unique cities from active service providers
    const cities = await prismaService.getPrismaClient().serviceProvider.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' }
    });
    
    // Extract city names from the result
    const cityList = cities.map(item => item.city);
    
    res.json({
      success: true,
      data: cityList,
      count: cityList.length,
      message: 'Cities list retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get subscription status for a specific service provider
 * GET /api/sp-subscription-status/:id
 */
router.get('/sp-subscription-status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required'
      });
    }

    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(parseInt(id));
    
    if (!subscriptionStatus) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    res.json({
      success: true,
      data: subscriptionStatus
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Renew subscription for a service provider
 * POST /api/sp-renew-subscription/:id
 */
router.post('/sp-renew-subscription/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { months = 1, screenshot } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required'
      });
    }

    // Validate screenshot is provided
    if (!screenshot || typeof screenshot !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Screenshot is required and must be a valid URL string'
      });
    }

    // Validate URL format
    try {
      new URL(screenshot);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot must be a valid URL'
      });
    }

    const renewed = await SubscriptionService.renewSubscription(parseInt(id), months, screenshot);
    
    if (!renewed) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found or renewal failed'
      });
    }

    res.json({
      success: true,
      message: `Subscription renewed successfully for ${months} month(s)`
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Pending API - Get service providers with expired subscriptions
 * GET /api/sp-pending
 */
router.get('/sp-pending', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    
    // Find service providers with expired subscriptions (status = 0 or subscriptionEndDate < currentDate)
    const pendingProviders = await prismaService.getPrismaClient().serviceProvider.findMany({
      where: {
        OR: [
          { status: 0 }, // Explicitly expired
          {
            subscriptionEndDate: {
              lt: currentDate // Subscription end date is in the past
            }
          }
        ],
        isActive: true // Only active service providers
      },
      orderBy: { subscriptionEndDate: 'asc' }
    });

    // Update status for providers whose subscription has expired
    for (const provider of pendingProviders) {
      if (provider.subscriptionEndDate && provider.subscriptionEndDate < currentDate && provider.status !== 0) {
        await prismaService.getPrismaClient().serviceProvider.update({
          where: { id: provider.id },
          data: { status: 0 }
        });
      }
    }

    // Get the updated list
    const updatedPendingProviders = await prismaService.getPrismaClient().serviceProvider.findMany({
      where: {
        OR: [
          { status: 0 },
          {
            subscriptionEndDate: {
              lt: currentDate
            }
          }
        ],
        isActive: true
      },
      orderBy: { subscriptionEndDate: 'asc' }
    });

    res.json({
      success: true,
      data: updatedPendingProviders.map(provider => ({
        ...provider,
        message: 'Subscription period ended. Please complete your payment to continue services.',
        daysExpired: provider.subscriptionEndDate ? 
          Math.ceil((currentDate.getTime() - provider.subscriptionEndDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      })),
      count: updatedPendingProviders.length,
      message: `Found ${updatedPendingProviders.length} service providers with expired subscriptions`
    });
  } catch (error) {
    console.error('Error fetching pending service providers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Serve payment proof images
 * GET /api/images/:filename
 */
router.get('/images/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    // For now, we'll just return a placeholder response
    // In production, you would serve actual image files from a storage system
    res.json({
      success: true,
      message: `Image ${filename} requested`,
      note: 'This endpoint will serve actual image files in production'
    });
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.post('/payment-upload', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const { serviceProviderId, amount } = req.body;

    const parsedServiceProviderId = Number(serviceProviderId);
    const parsedAmount = Number(amount);

    if (
      !serviceProviderId ||
      isNaN(parsedServiceProviderId) ||
      parsedServiceProviderId <= 0 ||
      !amount ||
      isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({ error: 'serviceProviderId and amount must be valid positive numbers' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Screenshot is required' });
    }

    const payment = await prismaService.getPrismaClient().serviceProviderPayment.create({
      data: {
        serviceProviderId: parsedServiceProviderId,
        amount: parsedAmount,
        screenshotPath: `/screenshots/${req.file.filename}`
      }
    });

    // Automatically renew subscription after payment upload
    let subscriptionRenewed = false;
    let renewalMessage = '';
    
    try {
      const renewed = await SubscriptionService.renewSubscription(
        parsedServiceProviderId,
        1, // Default to 1 month renewal
        `/screenshots/${req.file.filename}`
      );
      
      if (renewed) {
        subscriptionRenewed = true;
        renewalMessage = 'Payment uploaded and subscription renewed successfully';
      } else {
        renewalMessage = 'Payment uploaded but subscription renewal failed';
      }
    } catch (renewalError) {
      console.error('Error renewing subscription:', renewalError);
      renewalMessage = 'Payment uploaded but subscription renewal failed';
    }

    res.json({
      message: renewalMessage,
      payment,
      subscriptionRenewed,
      details: {
        serviceProviderId: parsedServiceProviderId,
        amount: parsedAmount,
        screenshotPath: `/screenshots/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Payment upload error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Service Provider Sign-in
router.post('/sp-signin', async (req: Request, res: Response) => {
  try {
    const { contactNo, pin } = req.body;

    if (!contactNo || !pin) {
      return res.status(400).json({
        error: 'Contact number and PIN are required',
        message: 'Both contactNo and pin must be provided'
      });
    }

    // Validate pin format (exactly 4 digits)
    const pinString = String(pin);
    if (!/^[0-9]{4}$/.test(pinString)) {
      return res.status(400).json({
        error: 'Invalid pin format',
        message: 'PIN must be exactly 4 digits (0-9)'
      });
    }

    // Find service provider by contactNo
    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: {
        contactNo: String(contactNo)
      }
    });

    if (!serviceProvider) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No service provider found with this contact number'
      });
    }

    // Compare PIN (hashed)
    const bcrypt = require('bcrypt');
    const pinMatch = await bcrypt.compare(pinString, serviceProvider.pin || '');
    if (!pinMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'PIN is incorrect'
      });
    }

    res.json({
      success: true,
      message: 'Service provider signed in successfully',
      data: serviceProvider
    });
  } catch (error) {
    console.error('Error signing in service provider:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sign in service provider. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as serviceProviderRoutes };