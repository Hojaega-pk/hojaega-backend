import express from 'express';
import axios from 'axios';

const router = express.Router();

const DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;
const API_KEY = process.env.TEXTBEE_API_KEY;

router.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Missing phone or message' });
  }
  try {
    const url = `https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/send-sms`;
    await axios.post(
      url,
      { recipients: [phone], message },
      { headers: { 'x-api-key': API_KEY } }
    );
    res.json({ success: true, message: 'SMS sent' });
  } catch (error) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) errorMsg = error.message;
    res.status(500).json({ success: false, error: errorMsg });
  }
});

export default router;
