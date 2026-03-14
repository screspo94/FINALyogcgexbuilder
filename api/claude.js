export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
 
    const system = `You are a precise YMCA schedule extraction assistant. Extract ALL classes from the PDF exactly as written. Pay extreme attention to instructor names — read carefully character by character.
 
Return ONLY a raw JSON array. No markdown, no backticks, no preamble.
 
Each element is one time-slot row:
{
  "_id": "row_1",
  "timeA": "7:00a",
  "timeB": "7:45a",
  "startH": 7,
  "mon": { "name":"Class Name", "instructor":"Full Name", "room":"Studio A", "type":"cardio", "sub": false },
  "tue": null, "wed": null, "thu": null, "fri": null, "sat": null, "sun": null
}
 
Rules:
- _id must be unique strings row_1, row_2, etc
- startH is 24hr integer: 7am=7, 5pm=17
- timeA and timeB are short strings like 7:00a or 5:45p
- If multiple classes at same time and day, use an array for that day
- sub is true if instructor is a sub (italicized or starts with asterisk) — keep the asterisk in the name
- type must be one of: cardio, strength, aqua, mindbody, dance, senior, cycle, sgt
- Include every single class — do not skip any row or day
- Room is only the room name, not the center name`;
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: system,
        messages: body.messages,
      }),
    });
 
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
