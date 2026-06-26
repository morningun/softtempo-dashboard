// /api/llm.js
async function callOpenAI(systemText, userText) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemText },
        { role: 'user', content: userText }
      ]
    })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

async function callGemini(systemText, userText) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: systemText }] }
      })
    }
  );
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

module.exports = { callOpenAI, callGemini };