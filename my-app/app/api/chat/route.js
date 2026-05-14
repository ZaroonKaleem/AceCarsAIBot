// app/api/chat/route.js  (Next.js App Router)
// Deploy on Vercel. Set TOGETHER_API_KEY in Vercel environment variables.

const ACE_SYSTEM_PROMPT = `You are ACE, the intelligent virtual assistant for ACE Cars — a premium pre-owned and new car dealership. You are knowledgeable, friendly, and professional. Your tone is confident and helpful, like a trusted car advisor.

Your responsibilities:
1. Help customers browse and search for cars (by make, model, year, price range, fuel type, etc.)
2. Answer general inquiries about ACE Cars (hours, location, contact, policies)
3. Explain financing and payment options at a high level
4. Guide users on how to book test drives
5. Handle complaints or concerns with empathy and direct them to the right team

Guidelines:
- Always stay on-topic for ACE Cars. If asked about unrelated topics, politely redirect.
- If you don't know a specific car's availability or real-time stock, tell the customer to call or visit the showroom, and offer to help with general questions.
- Keep responses concise — use short paragraphs or bullet points when listing features/options.
- Never make up prices or availability. Say you can check with the team for exact figures.
- If the customer seems ready to buy or book, encourage them to visit or call.
- Be warm and personable.

About ACE Cars:
- Specializes in quality certified pre-owned vehicles and new arrivals
- Offers flexible financing for all credit types
- Test drives available 7 days a week by appointment
- Contact: info@acecars.com`;

// 🔧 Set this to your Angular site's domain, or use '*' to allow all origins during development
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Handle preflight OPTIONS request — browsers send this before every cross-origin POST
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Invalid messages format' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500, headers: corsHeaders() }
      );
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
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together AI error:', errorText);
      return Response.json(
        { error: 'AI service error' },
        { status: 502, headers: corsHeaders() }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return Response.json(
        { error: 'Empty response from AI' },
        { status: 502, headers: corsHeaders() }
      );
    }

    return Response.json({ reply }, { headers: corsHeaders() });

  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export const dynamic = 'force-dynamic';