const { callOpenAI } = require('./llm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { contents, systemInstruction } = req.body;
    console.log('받은 데이터:', JSON.stringify({ contents, systemInstruction }));

    const text = await callOpenAI(
      systemInstruction.parts[0].text,
      contents[0].parts[0].text
    );
    return res.status(200).json({ result: text });

  } catch (error) {
    console.log('에러:', error.message);
    return res.status(500).json({ error: error.message });
  }
}