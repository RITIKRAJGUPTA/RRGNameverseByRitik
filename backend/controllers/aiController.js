const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getNameMeaning = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const prompt = `Provide a concise, friendly explanation for the following given name:
Name: "${name}"
Return JSON with fields: meaning (1-2 sentences), origin (single word or short phrase), personality (2-3 short phrases), exampleSentence (1 sentence using the name).
Do not return extra commentary—only valid JSON.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // or try 'mixtral-8x7b-32768' for more powerful
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 250
    });

    const text = completion.choices[0].message.content.trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    return res.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Groq AI error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to get meaning from AI' });
  }
};

module.exports = { getNameMeaning };
