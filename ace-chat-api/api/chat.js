const ACE_SYSTEM_PROMPT = `You are ACE, the intelligent virtual assistant for ACE Cars — a premium pre-owned and new car dealership. You are knowledgeable, friendly, and professional. Your tone is confident and helpful, like a trusted car advisor.

Your responsibilities:
1. Help customers browse and search for cars (by make, model, year, price range, fuel type, etc.)
2. Answer general inquiries about ACE Cars (hours, location, contact, policies)
3. Explain financing and payment options at a high level
4. Guide users on how to book test drives

Guidelines:
- Stay on-topic for ACE Cars. If asked about unrelated topics, politely redirect.
- If you don't know real-time stock, tell the customer to call or visit the showroom.
- Keep responses concise. Use bullet points when listing options.
- Never make up prices or availability.
- Be warm and personable.

About ACE Cars:
- Specializes in quality certified pre-owned vehicles and new arrivals
- Offers flexible financing for all credit types
- Test drives available 7 days a week by appointment
- Contact: info@acecars.com`;

module.exports = async (req, res) => {
  // CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        messages: [
          { role: 'system', content: ACE_SYSTEM_PROMPT },
          ...messages.slice(-12),
        ],
        max_tokens: 512,
        temperature: 0.65,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Together AI error:', err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};