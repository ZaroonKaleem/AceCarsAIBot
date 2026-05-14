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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid messages' }, { status: 400, headers: CORS_HEADERS });
    }

    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500, headers: CORS_HEADERS });
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
      return Response.json({ error: 'AI service error' }, { status: 502, headers: CORS_HEADERS });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    return Response.json({ reply }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export const dynamic = 'force-dynamic';