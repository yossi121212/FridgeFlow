import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { URL } from 'url';
import path from 'path';

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = dirname(__filename);

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

// Store connected clients
const clients = new Set();

interface ContextUpdate {
  type: string;
  data: unknown;
}

// SSE endpoint
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add client to the set
  clients.add(res);

  // Send initial connection message
  res.write('data: {"type": "connection", "status": "connected"}\n\n');

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
  });
});

// Endpoint to receive Figma context updates
app.post('/context-update', (req, res) => {
  const update = req.body;
  
  // Broadcast to all connected clients
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  res.status(200).json({ status: 'update sent' });
});

app.listen(PORT, () => {
  console.log(`Figma-Context-MCP Server running on http://localhost:${PORT}`);
}); 