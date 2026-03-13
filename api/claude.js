export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const body = req.body;
 
    // Override the system prompt with an improved version
    const improvedSystem = `You are a precise YMCA schedule extraction assistant. Extract ALL classes from the PDF exactly as written — pay extreme attention to spelling of instructor names, class names, and times. The PDF is image-based so read carefully.
 
Return ONLY a raw JSON array — no markdown, no backticks, no preamble.
 
Each element = one time-slot row:
{
  "_id": "row_1",
  "timeA": "7:00a",
  "timeB": "7:45a",
  "startH": 7,
  "mon": { "name":"Class Name","instructor":"Exact Full Name","room":"Room","type":"cardio","sub":false },
  "tue": null, "wed": null, "thu": null, "fri": null, "sat": null, "sun": null
}
 
CRITICAL RULES:
- Read instructor names VERY carefully character by character. Do not guess. Names are often partially cut off by column width — read the full name carefully. Never alter, shorten, or approximate a name.
- _id must be unique: "row_1","row_2" etc
- startH = 24hr integer start hour (7am=7, 5pm=17)  
- timeA/timeB = short strings like "7:00a","5:45p" — match times exactly as printed
- If multiple classes at same time+day use array: "mon":[{...},{...}]
- sub=true if instructor name is italicized or starts with * — preserve the * in the name string
- type must be exactly one of: cardio|strength|aqua|mindbody|dance|senior|cycle|sgt
  cardio: cardio dance, cardio strength, athletic conditioning, group fight, HIIT, step
  strength: group power, stronger, total strength, core & more, core strength, BodyPump
  aqua: shallow water, aqua yoga, deep water, aquatic
  mindbody: yoga, pilates, barre, deep stretch, slow flow, vinyasa, chair fitness, restorative
  dance: zumba, SHiNE, MixxedFit, dance fitness, line dance, cardio dance
  senior: senior cardio, senior strength, silver sneakers, senior card
  cycle: cycle, cycle & core, spin, ride
  sgt: any class with ($) in the name
- Include EVERY class — do not skip any time slot or day
- Room should only be the room name like "Studio A" or "Fitness Center" — do not include the center name
- Read the entire schedule including all columns for Saturday and Sunday`;
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...body,
        system: improvedSystem,
      }),
    });
 
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
