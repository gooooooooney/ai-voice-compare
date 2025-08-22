/**
 * Simple Express server to handle OpenAI session token generation
 * This keeps the API key secure on the server side
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS for the frontend
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Endpoint to create ephemeral session token
app.post('/api/openai/session', async (req, res) => {
  try {
    // Create an ephemeral key for the Realtime API
    const response = await openai.beta.realtime.sessions.create({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
    });

    res.json({
      sessionId: response.id,
      sessionKey: response.client_secret.value,
      expiresAt: response.expires_at,
    });
  } catch (error) {
    console.error('Error creating OpenAI session:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle all other routes by serving the index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`CORS origin: ${corsOrigin}`);
});