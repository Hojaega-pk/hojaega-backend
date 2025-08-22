import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateServiceProvider = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { name, city, skillset, contactNo, pin } = req.body;

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
  } else if (contactNo.trim().length < 10) {
    errors.push({ field: 'contactNo', message: 'Contact number must be at least 10 characters long' });
  } else if (contactNo.trim().length > 20) {
    errors.push({ field: 'contactNo', message: 'Contact number cannot exceed 20 characters' });
  } else {
    // Basic phone number validation (adjust regex as needed for your region)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(contactNo.replace(/[\s\-\(\)]/g, ''))) {
      errors.push({ field: 'contactNo', message: 'Please enter a valid contact number' });
    }
  }

  // PIN validation (optional but if provided, must be exactly 4 digits)
  if (pin !== undefined && pin !== null) {
    if (typeof pin !== 'string') {
      errors.push({ field: 'pin', message: 'PIN must be a string' });
    } else if (!/^[0-9]{4}$/.test(pin)) {
      errors.push({ field: 'pin', message: 'PIN must be exactly 4 digits (0-9)' });
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

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { contactNo, newPin } = req.body;

  // Contact number validation
  if (!contactNo || typeof contactNo !== 'string') {
    errors.push({ field: 'contactNo', message: 'Contact number is required and must be a string' });
  } else if (contactNo.trim().length < 10) {
    errors.push({ field: 'contactNo', message: 'Contact number must be at least 10 characters long' });
  } else if (contactNo.trim().length > 20) {
    errors.push({ field: 'contactNo', message: 'Contact number cannot exceed 20 characters' });
  } else {
    // Basic phone number validation (adjust regex as needed for your region)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(contactNo.replace(/[\s\-\(\)]/g, ''))) {
      errors.push({ field: 'contactNo', message: 'Please enter a valid contact number' });
    }
  }

  // New PIN validation
  if (!newPin || typeof newPin !== 'string') {
    errors.push({ field: 'newPin', message: 'New PIN is required and must be a string' });
  } else if (!/^[0-9]{4}$/.test(newPin)) {
    errors.push({ field: 'newPin', message: 'New PIN must be exactly 4 digits (0-9)' });
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

