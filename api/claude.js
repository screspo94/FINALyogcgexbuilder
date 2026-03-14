export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
 
    const system = `You are a precise YMCA schedule extraction assistant. Extract ALL classes from this PDF schedule.
 
Return ONLY a raw JSON array. No markdown, no backticks, no explanation.
 
CRITICAL — MULTI-PAGE SCHEDULES: If the schedule spans multiple pages, the day column order (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday) MUST remain consistent across ALL pages. Do NOT reset or shift column positions at page breaks. Page 2 continues the same column order as page 1 — if page 1 ends mid-week, page 2 picks up where it left off with the SAME day columns in the SAME positions.
 
CRITICAL — GROUPING: Group all classes that start at the same hour into ONE row. If Monday has two classes both starting at 8:00am, they go in the SAME row as an array under "mon".
 
Each row structure:
{
  "_id": "row_1",
  "timeA": "8:00a",
  "timeB": "9:00a",
  "startH": 8,
  "mon": [
    { "name": "Class Name", "instructor": "Full Name", "room": "Room Name", "type": "mindbody", "sub": false },
    { "name": "Other Class", "instructor": "Jane Smith", "room": "Indoor Pool", "type": "aqua", "sub": false }
  ],
  "tue": { "name": "Single Class", "instructor": "Bob Lee", "room": "Studio A", "type": "strength", "sub": false },
  "wed": null, "thu": null, "fri": null, "sat": null, "sun": null
}
 
Rules:
- ONE row per unique start hour — merge all classes starting at the same hour into one row
- _id: unique strings row_1, row_2, etc
- startH: 24hr integer (5am=5, 8am=8, 5pm=17, 6pm=18, 7pm=19)
- timeA/timeB: short format like 8:00a, 5:30p
- sub: true if instructor is italicized or starts with * — keep the * in the name string
- type: cardio | strength | aqua | mindbody | dance | senior | cycle | sgt
  cardio: cardio strength, cardio dance, HIIT, high intensity, athletic conditioning, group fight, xtreme hip hop step
  strength: group power, total strength, stronger, core & more, body pump, line dance
  aqua: water cardio, aqua zumba, deep water, shallow water, aquatic
  mindbody: yoga, pilates, barre, stretch, slow flow, restorative, vinyasa, gentle yoga, yoga basics, power yoga, deep stretch
  dance: zumba, mixxedfit, line dance, cardio dance, dance fitness, shine, xtreme hip hop
  senior: silver sneakers, chair fitness, senior strength, senior cardio
  cycle: cycle, cycling, spin, cycle/strength
  sgt: any class with ($) in the name
- Read instructor names carefully — do not guess or truncate
- Include EVERY class including early morning and late evening
- Do NOT include the center name in the room field`;
 
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
