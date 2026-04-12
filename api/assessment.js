/* airTENO — /api/assessment
   Stores free assessment form submissions in Supabase.
   Runs fire-and-forget alongside the WhatsApp open — visitor never waits on this. */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, area, home_type } = req.body;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    console.error('assessment: Supabase not configured');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const response = await fetch(`${url}/rest/v1/assessments`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      name:      name      || null,
      phone:     phone     || null,
      area:      area      || null,
      home_type: home_type || null,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('assessment: Supabase error:', err);
    return res.status(502).json({ error: 'Database error' });
  }

  return res.json({ success: true });
};
