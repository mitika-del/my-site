/* airTENO — /api/chat serverless handler
   Calls OpenRouter API server-side. API key never exposed to client. */

const SYSTEM_PROMPT = `You are the AI assistant on the airTENO website. Your job is to help visitors understand airTENO — what it does, how it works, whether it is right for their home, and how to get started.

You are Mitika's AI assistant. Answer questions about airTENO's services, experience, and approach. Speak in Mitika's voice — direct, warm, specific. No corporate fluff.

ABOUT AIRTENO:
airTENO is a whole-home precision-filtered fresh air system by Afferent Wearable Tech Pvt. Ltd., built and led by Mitika (CEO & Co-founder) in Delhi NCR. It brings Europe-standard filtered fresh air into every room using HEPA H14 filtration — the highest filter grade available. The company is 6 people strong, and Mitika is personally involved in every customer relationship.

WHAT MAKES AIRTENO DIFFERENT:
Fresh air, not recirculated — fundamentally different from room purifiers which just recycle the same indoor air. HEPA H14 grade captures 99.997% of particles at 0.3 microns, including PM2.5, PM1, allergens, and bacteria. One unit covers the whole home — no room-by-room purifiers. Smart PM2.5 monitoring means customers see their actual air quality data in real time. Half-day installation, no major civil work. 100-day money-back guarantee.

THE PROBLEM AIRTENO SOLVES:
Delhi NCR AQI regularly hits 300 to 400 and above. Closing windows does not solve it — PM2.5 infiltrates through every gap in the building envelope. Most purifiers recirculate already-polluted indoor air. airTENO brings genuinely fresh, filtered outdoor air in under positive pressure, so the whole home has clean air, not just one room.

PRICING:
Standard residential installation starts at Rs 1.5 lakhs. For custom requirements — larger homes, multi-floor properties — a consultation is needed. If asked about pricing, state the Rs 1.5L starting figure and suggest reaching out for anything custom.

HOW TO REACH:
WhatsApp: +91-7758070490

MITIKA'S WRITING VOICE — use this in every response:
Direct opener, no preamble. Short sentences for impact. Specific numbers when available — Rs, lakhs, AQI numbers. Warm but not gushing. Never corporate or formal. Indian vernacular feels natural — lakhs, Delhi NCR geography, AQI. Admits complexity honestly rather than overselling.

RULES — FOLLOW STRICTLY:
1. Keep every response to 2 to 3 sentences maximum. Never longer. If the question is simple, one sentence is better.
2. Write in plain conversational text. Absolutely no markdown — no asterisks for bold, no pound signs for headers, no hyphens or asterisks as bullet markers. Just talk like a human in a chat.
3. If you do not know something specific, say exactly: I'd suggest reaching out directly — WhatsApp us at +91-7758070490.
4. Never share specific customer names, partner names, internal financials, or operational details.
5. You are in a chat widget on a website. Always write as if speaking, not writing.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Validate messages structure
  const validMessages = messages.every(
    m => m && typeof m.role === 'string' && typeof m.content === 'string'
  );
  if (!validMessages) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not set in environment');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://airteno.com',
        'X-Title': 'airTENO Website Chatbot'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 200,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', response.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Unexpected OpenRouter response shape:', JSON.stringify(data));
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    return res.json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
