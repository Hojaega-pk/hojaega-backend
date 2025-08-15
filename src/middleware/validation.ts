import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateServiceProvider = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { name, city, skillset, contactNo } = req.body;

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push({ field: 'name', message: 'Name is required and must be a string' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
  }

  // City validation
  if (!city || typeof city !== 'string') {
    errors.push({ field: 'city', message: 'City is required and must be a string' });
  } else if (city.trim().length < 2) {
    errors.push({ field: 'city', message: 'City must be at least 2 characters long' });
  } else if (city.trim().length > 100) {
    errors.push({ field: 'city', message: 'City cannot exceed 100 characters' });
  }

  // Skillset validation
  if (!skillset || typeof skillset !== 'string') {
    errors.push({ field: 'skillset', message: 'Skillset is required and must be a string' });
  } else if (skillset.trim().length < 5) {
    errors.push({ field: 'skillset', message: 'Skillset must be at least 5 characters long' });
  }

  // Contact number validation
  if (!contactNo || typeof contactNo !== 'string') {
    errors.push({ field: 'contactNo', message: 'Contact number is required and must be a string' });
  } else {
    // Basic phone number validation (adjust regex as needed for your region)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(contactNo.replace(/[\s\-\(\)]/g, ''))) {
      errors.push({ field: 'contactNo', message: 'Please enter a valid contact number' });
    }
  }



  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

