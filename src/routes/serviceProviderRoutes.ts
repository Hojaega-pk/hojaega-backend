import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { ServiceProvider } from '../entities/ServiceProvider';
import { validateServiceProvider } from '../middleware/validation';


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
    const serviceProviderRepository = getRepository(ServiceProvider);
    const serviceProviders = await serviceProviderRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
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

    const serviceProviderRepository = getRepository(ServiceProvider);
    
    const serviceProvider = await serviceProviderRepository.findOne({
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
    
    
    if (!name || !city || !skillset || !contactNo) {
      return res.status(400).json({
        success: false,
        message: 'Name, city, skillset, and contact number are required'
      });
    }
    
   
    const validatedName = name as string;
    const validatedCity = city as string;
    const validatedSkillset = skillset as string;
    const validatedContactNo = contactNo as string;
    
    const serviceProviderRepository = getRepository(ServiceProvider);
    
    
    const existingProvider = await serviceProviderRepository.findOne({
      where: { contactNo: validatedContactNo, isActive: true }
    });
    
    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: 'A service provider with this contact number already exists'
      });
    }
    
   
    const serviceProviderData = {
      name: validatedName,
      city: validatedCity,
      skillset: validatedSkillset,
      contactNo: validatedContactNo,
      ...(email && { email }),
      ...(description && { description }),
      ...(experience && { experience }),
      ...(hourlyRate && { hourlyRate: parseFloat(String(hourlyRate)) })
    };
    
    
    const newServiceProvider = serviceProviderRepository.create(serviceProviderData);
    
    const savedProvider = await serviceProviderRepository.save(newServiceProvider);
    
    res.status(201).json({
      success: true,
      message: 'Service provider created successfully',
      data: savedProvider
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
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required'
      });
    }
    
    const { name, city, skillset, contactNo, email, description, experience, hourlyRate } = req.body;
    
   
    if (!name || !city || !skillset || !contactNo) {
      return res.status(400).json({
        success: false,
        message: 'Name, city, skillset, and contact number are required'
      });
    }
    
   
    const validatedName = name as string;
    const validatedCity = city as string;
    const validatedSkillset = skillset as string;
    const validatedContactNo = contactNo as string;
    
    const serviceProviderRepository = getRepository(ServiceProvider);
   
    const existingProvider = await serviceProviderRepository.findOne({
      where: { id: parseInt(id), isActive: true }
    });
    
    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }
    
  
    const updateData: Partial<ServiceProvider> = {
      name: validatedName,
      city: validatedCity,
      skillset: validatedSkillset,
      contactNo: validatedContactNo,
      ...(email && { email }),
      ...(description && { description }),
      ...(experience && { experience }),
      ...(hourlyRate && { hourlyRate: parseFloat(String(hourlyRate)) })
    };
    
    Object.assign(existingProvider, updateData);
    const updatedProvider = await serviceProviderRepository.save(existingProvider);
    
    res.json({
      success: true,
      message: 'Service provider updated successfully',
      data: updatedProvider
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
    
    const serviceProviderRepository = getRepository(ServiceProvider);
    
    const existingProvider = await serviceProviderRepository.findOne({
      where: { id: parseInt(id), isActive: true }
    });
    
    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }
    
   
    existingProvider.isActive = false;
    await serviceProviderRepository.save(existingProvider);
    
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
    
    const serviceProviderRepository = getRepository(ServiceProvider);
    const queryBuilder = serviceProviderRepository
      .createQueryBuilder('provider')
      .where('provider.isActive = :isActive', { isActive: true });
    
    if (city && typeof city === 'string') {
      queryBuilder.andWhere('LOWER(provider.city) = :city', { city: city.toLowerCase() });
    }
    
    if (skillset && typeof skillset === 'string') {
      queryBuilder.andWhere('provider.skillset LIKE :skillset', { skillset: `%${skillset}%` });
    }
    
    if (experience && typeof experience === 'string') {
      queryBuilder.andWhere('provider.experience = :experience', { experience });
    }

    if (hourlyRateMin !== undefined && hourlyRateMax !== undefined) {
      queryBuilder.andWhere('provider.hourlyRate BETWEEN :min AND :max', {
        min: hourlyRateMin,
        max: hourlyRateMax
      });
    } else if (hourlyRateMin !== undefined) {
      queryBuilder.andWhere('provider.hourlyRate >= :min', { min: hourlyRateMin });
    } else if (hourlyRateMax !== undefined) {
      queryBuilder.andWhere('provider.hourlyRate <= :max', { max: hourlyRateMax });
    }

    if (name && typeof name === 'string') {
      queryBuilder.andWhere('provider.name LIKE :name', { name: `%${name}%` });
    }

    if (search && typeof search === 'string') {
      queryBuilder.andWhere('(LOWER(provider.name) LIKE :search OR LOWER(provider.city) LIKE :search OR LOWER(provider.skillset) LIKE :search)', { search: `%${search.toLowerCase()}%` });
    }
    
    const serviceProviders = await queryBuilder
      .orderBy('provider.createdAt', 'DESC')
      .getMany();
    
    res.json({
      success: true,
      data: serviceProviders,
      count: serviceProviders.length,
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
    const serviceProviderRepository = getRepository(ServiceProvider);
    
  
    const totalCount = await serviceProviderRepository.count({ where: { isActive: true } });
    
    
    const cityStats = await serviceProviderRepository
      .createQueryBuilder('provider')
      .select('provider.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('provider.isActive = :isActive', { isActive: true })
      .groupBy('provider.city')
      .getRawMany();
    
    
    const skillsetStats = await serviceProviderRepository
      .createQueryBuilder('provider')
      .select('provider.skillset', 'skillset')
      .addSelect('COUNT(*)', 'count')
      .where('provider.isActive = :isActive', { isActive: true })
      .groupBy('provider.skillset')
      .getRawMany();
    
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

