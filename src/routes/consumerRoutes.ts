import express from 'express';
import { prismaService } from '../services/prisma.service';
import { CreateConsumerDto, ConsumerResponse } from '../entities/Consumer';

const router = express.Router();
const prisma = prismaService.getPrismaClient();

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

    // Check if consumer with same name and city already exists
    const existingConsumer = await prisma.consumer.findFirst({
      where: {
        name: name.trim(),
        city: city.trim()
      }
    });

    if (existingConsumer) {
      return res.status(409).json({ 
        error: 'Consumer already exists',
        message: 'A consumer with this name and city already exists'
      });
    }

    // Create consumer
    const consumer = await prisma.consumer.create({
      data: {
        name: name.trim(),
        city: city.trim(),
        pin: pin
      }
    });

    const response: ConsumerResponse = {
      id: consumer.id,
      name: consumer.name,
      city: consumer.city,
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

export default router;
