// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const token = process.env.TOKEN_FODA;
const HEADER = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
const URL = 'https://graph.facebook.com/v22.0/229472750249089/messages';

async function sendMessage(to, text) {
  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: HEADER,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      }),
    });
    console.log('Message sent:', await response.json());
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  console.log(req.body.entry[0].changes[0].value.messages[0].from);
  sendMessage(req.body.entry[0].changes[0].value.messages[0].from, 'Olá, tudo bem?')
  res.status(200).end();
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
