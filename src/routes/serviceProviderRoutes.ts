import { Router, Request, Response } from 'express';
import { validateServiceProvider } from '../middleware/validation';
import { prismaService } from '../services/prisma.service';


interface ServiceProviderRequestBody {
  name: string;
  city: string;
  skillset: string;
  contactNo: string;
  email?: string;
  description?: string;
  experience?: string;
  hourlyRate?: string | number;
}


interface FilterRequestBody {
  city?: string;
  skillset?: string;
  experience?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  name?: string;
  search?: string; 
}


interface TypedRequest extends Request {
  body: ServiceProviderRequestBody;
}


interface FilterRequest extends Request {
  body: FilterRequestBody;
}

const router = Router();


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
    const { name, city, skillset, contactNo, email, description, experience, hourlyRate } = req.body;

    // Check if service provider already exists
    const existingProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: {
        OR: [
          { contactNo },
          { email: email || undefined }
        ]
      }
    });

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Service provider with this contact number or email already exists'
      });
    }

    const serviceProvider = await prismaService.getPrismaClient().serviceProvider.create({
      data: {
        name,
        city,
        skillset,
        contactNo,
        email,
        description,
        experience,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate.toString()) : null,
        isActive: true
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
    const { name, city, skillset, contactNo, email, description, experience, hourlyRate } = req.body;

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

    // Check for duplicate contact/email (excluding current provider)
    const duplicateProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
      where: {
        OR: [
          { contactNo },
          { email: email || undefined }
        ],
        NOT: { id: parseInt(id) }
      }
    });

    if (duplicateProvider) {
      return res.status(400).json({
        success: false,
        message: 'Service provider with this contact number or email already exists'
      });
    }

    const updatedProvider = await prismaService.getPrismaClient().serviceProvider.update({
      where: { id: parseInt(id) },
      data: {
        name,
        city,
        skillset,
        contactNo,
        email,
        description,
        experience,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate.toString()) : null
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
    const { city, skillset, experience, hourlyRateMin, hourlyRateMax, name, search } = req.body;
    
    const serviceProviders = await prismaService.getPrismaClient().serviceProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const filteredProviders = serviceProviders.filter((provider: any) => {
      const matchesCity = city ? provider.city.toLowerCase().includes(city.toLowerCase()) : true;
      const matchesSkillset = skillset ? provider.skillset.toLowerCase().includes(skillset.toLowerCase()) : true;
      const matchesExperience = experience ? provider.experience === experience : true;
      const matchesHourlyRateMin = hourlyRateMin !== undefined ? provider.hourlyRate >= hourlyRateMin : true;
      const matchesHourlyRateMax = hourlyRateMax !== undefined ? provider.hourlyRate <= hourlyRateMax : true;
      const matchesName = name ? provider.name.toLowerCase().includes(name.toLowerCase()) : true;
      const matchesSearch = search ? 
        provider.name.toLowerCase().includes(search.toLowerCase()) || 
        provider.city.toLowerCase().includes(search.toLowerCase()) || 
        provider.skillset.toLowerCase().includes(search.toLowerCase()) : true;

      return matchesCity && matchesSkillset && matchesExperience && matchesHourlyRateMin && matchesHourlyRateMax && matchesName && matchesSearch;
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

export { router as serviceProviderRoutes };

