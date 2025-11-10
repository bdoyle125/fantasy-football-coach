const { OpenAI } = require('openai');
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  // Print the value of OPENAI_API_KEY to verify it's loaded correctly
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
  res.send('Fantasy Football Coach Backend is running.');
});

app.post('/api/coach', (req, res) => {
  const { question } = req.body;
  // Here you would normally process the question and generate a response
  res.json({ answer: `You asked: ${question}. This is a placeholder response.` });
});

app.post('/api/openai-test', async (_, res) => {
  // Test endpoint to verify OpenAI API key usage
  const response = await client.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: 'Write a one-sentence fantasy football tip.' }],
  });

  console.log(response.choices[0].message.content);
  res.json({ tip: response.choices[0].message.content });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});