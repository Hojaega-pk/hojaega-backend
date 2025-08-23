import express from 'express';
import { prismaService } from '../services/prisma.service';
import { CreateConsumerDto, ConsumerResponse } from '../entities/Consumer';
import { validateForgotPassword } from '../middleware/validation';

const router = express.Router();

// Create consumer
router.post('/consumer-create', async (req, res) => {
  try {
    const { name, city, pin }: CreateConsumerDto = req.body;

    // Validate required fields
    if (!name || !city || !pin) {
      return res.status(400).json({ 
        error: 'Name, city and pin are required',
        message: 'Name, city and pin fields must be provided'
      });
    }

    // Validate name (not empty)
    if (name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Name cannot be empty',
        message: 'Name must contain valid characters'
      });
    }

    // Validate city (not empty)
    if (city.trim().length === 0) {
      return res.status(400).json({ 
        error: 'City cannot be empty',
        message: 'City must contain valid characters'
      });
    }

    // Validate pin format (exactly 4 digits)
    if (!/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({ 
        error: 'Invalid pin format',
        message: 'Pin must be exactly 4 digits (0-9)'
      });
    }

    // Hash the PIN before saving
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    // Create consumer with contactNo as empty string (to be updated later)
    const consumer = await prismaService.getPrismaClient().consumer.create({
      data: {
        name: name.trim(),
        city: city.trim(),
        contactNo: '',
        pin: hashedPin
      }
    });

    const response: ConsumerResponse = {
      id: consumer.id,
      name: consumer.name,
      city: consumer.city,
      contactNo: consumer.contactNo,
      pin: consumer.pin,
      createdAt: consumer.createdAt,
      updatedAt: consumer.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Consumer created successfully',
      data: response
    });

  } catch (error) {
    console.error('Error creating consumer:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create consumer. Please try again later.'
    });
  }
});

// Sign in consumer
router.post('/consumer-signin', async (req, res) => {
  try {
    console.log('Sign-in request received:', {
      body: req.body,
      headers: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });
    
    const { contactNo, pin } = req.body;

    // Validate required fields
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

    // Find consumer by contactNo
    const consumer = await prismaService.getPrismaClient().consumer.findFirst({
      where: {
        contactNo: String(contactNo)
      }
    });

    if (!consumer) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No consumer found with this contact number'
      });
    }

    // Compare PIN (hashed)
    const bcrypt = require('bcrypt');
    const pinMatch = await bcrypt.compare(pinString, consumer.pin);
    if (!pinMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'PIN is incorrect'
      });
    }

    const response: ConsumerResponse = {
      id: consumer.id,
      name: consumer.name,
      city: consumer.city,
      contactNo: consumer.contactNo,
      pin: consumer.pin,
      createdAt: consumer.createdAt,
      updatedAt: consumer.updatedAt
    };

    res.json({
      success: true,
      message: 'Consumer signed in successfully',
      data: response
    });

  } catch (error) {
    console.error('Error signing in consumer:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to sign in consumer. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Forgot password - Reset PIN (Unified for both consumers and service providers)
router.post('/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const { contactNo, newPin, otpCode } = req.body;

    // Validate required fields
    if (!contactNo || !newPin || !otpCode) {
      return res.status(400).json({
        error: 'Contact number, new PIN, and OTP code are required',
        message: 'All three fields must be provided: contactNo, newPin, and otpCode'
      });
    }

    // Validate new PIN format (exactly 4 digits)
    if (!/^[0-9]{4}$/.test(newPin)) {
      return res.status(400).json({
        error: 'Invalid PIN format',
        message: 'New PIN must be exactly 4 digits (0-9)'
      });
    }

    // Verify OTP first
    const otpRecord = await prismaService.getPrismaClient().otpCode.findFirst({
      where: {
        contactNo: String(contactNo),
        purpose: 'PIN_RESET',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(404).json({
        error: 'No active OTP found',
        message: 'Please request a new PIN reset OTP'
      });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        error: 'OTP expired',
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Verify OTP code
    const bcrypt = require('bcrypt');
    const isOtpValid = await bcrypt.compare(String(otpCode), otpRecord.codeHash);
    if (!isOtpValid) {
      // Update attempts count
      await prismaService.getPrismaClient().otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });
      return res.status(401).json({
        error: 'Invalid OTP',
        message: 'OTP code is incorrect'
      });
    }

    // First, try to find a consumer with this contact number
    let consumer = await prismaService.getPrismaClient().consumer.findFirst({
      where: {
        contactNo: String(contactNo)
      }
    });

    // If not found as consumer, try to find as service provider
    let serviceProvider = null;
    if (!consumer) {
      serviceProvider = await prismaService.getPrismaClient().serviceProvider.findFirst({
        where: {
          contactNo: String(contactNo)
        }
      });
    }

    if (!consumer && !serviceProvider) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this contact number'
      });
    }

    // Hash the new PIN
    const saltRounds = 10;
    const hashedNewPin = await bcrypt.hash(newPin, saltRounds);

    // Update the PIN based on user type
    if (consumer) {
      await prismaService.getPrismaClient().consumer.update({
        where: { id: consumer.id },
        data: { pin: hashedNewPin }
      });
    } else if (serviceProvider) {
      await prismaService.getPrismaClient().serviceProvider.update({
        where: { id: serviceProvider.id },
        data: { pin: hashedNewPin }
      });
    }

    // Mark OTP as consumed
    await prismaService.getPrismaClient().otpCode.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'PIN updated successfully',
      userType: consumer ? 'consumer' : 'serviceProvider',
      contactNo: String(contactNo)
    });

  } catch (error) {
    console.error('Error updating PIN:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update PIN. Please try again later.'
    });
  }
});

export default router;
