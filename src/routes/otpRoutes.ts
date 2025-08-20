import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prismaService } from '../services/prisma.service';
import { OtpPurpose } from '@prisma/client';

const router = Router();
const prisma = prismaService.getPrismaClient();

// Helpers
function generateNumericOtp(length: number): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, digits.length);
    otp += digits[idx];
  }
  return otp;
}

async function hashCode(code: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(code, saltRounds);
}

function normalizeContactNo(raw: string): string {
  return String(raw).replace(/\D/g, '');
}

// Request OTP
router.post('/otp/request', async (req: Request, res: Response) => {
  try {
    const { contactNo, purpose = OtpPurpose.GENERIC, length = 6, ttlSeconds = 300 } = req.body as {
      contactNo?: string;
      purpose?: OtpPurpose;
      length?: number;
      ttlSeconds?: number;
    };

    if (!contactNo) {
      return res.status(400).json({ success: false, message: 'contactNo is required' });
    }

    if (!/^[0-9]{6,15}$/.test(String(contactNo))) {
      return res.status(400).json({ success: false, message: 'contactNo must be 6-15 digits' });
    }

    const safeLength = Math.min(Math.max(Number(length) || 6, 4), 8);
    const safeTtl = Math.min(Math.max(Number(ttlSeconds) || 300, 60), 900);

    // Check if an account exists for this contact number
    const normalized = normalizeContactNo(String(contactNo));
    const lastSeven = normalized.slice(-7);
    const existingAccount = await prisma.serviceProvider.findFirst({
      where: {
        OR: [
          { contactNo: String(contactNo) },
          { contactNo: { contains: normalized } },
          { contactNo: { contains: lastSeven } },
        ]
      }
    });

    // Purpose-based gating
    if (purpose === OtpPurpose.SP_SIGNIN) {
      // For sign-in, require that the account exists
      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this contact number'
        });
      }
    } else {
      // For other purposes (e.g., signup), block if account already exists
      if (existingAccount) {
        return res.status(409).json({
          success: false,
          message: 'Account with this contact number already exists'
        });
      }
    }

    // Invalidate previous active OTPs for same contact/purpose
    await prisma.otpCode.deleteMany({
      where: {
        contactNo: String(contactNo),
        purpose,
        consumedAt: null,
      }
    });

    const code = generateNumericOtp(safeLength);
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + safeTtl * 1000);

    const saved = await prisma.otpCode.create({
      data: {
        contactNo: String(contactNo),
        purpose,
        codeHash,
        expiresAt,
      }
    });

    // TODO: Integrate SMS provider here. For now, return code only in development.
    const isDev = process.env.NODE_ENV !== 'production';

    return res.status(201).json({
      success: true,
      message: 'OTP generated',
      data: {
        id: saved.id,
        contactNo: saved.contactNo,
        purpose: saved.purpose,
        expiresAt: saved.expiresAt,
        // Return code for dev only
        code: isDev ? code : undefined,
      }
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify OTP
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { contactNo, purpose = OtpPurpose.GENERIC, code } = req.body as {
      contactNo?: string;
      purpose?: OtpPurpose;
      code?: string;
    };

    if (!contactNo || !code) {
      return res.status(400).json({ success: false, message: 'contactNo and code are required' });
    }

    const record = await prisma.otpCode.findFirst({
      where: {
        contactNo: String(contactNo),
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'No active OTP found' });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const isMatch = await bcrypt.compare(String(code), record.codeHash);
    const updatedAttempts = record.attempts + 1;

    if (!isMatch) {
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: updatedAttempts }
      });
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    await prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date(), attempts: updatedAttempts }
    });

    return res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export { router as otpRoutes };


