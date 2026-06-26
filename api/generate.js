

const MASTER_SYSTEM_PROMPT = `당신은 AI 음악 채널의 프로듀서입니다... (우리가 합의한 7단계 타임라인 및 제약규칙 전체)`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
     const { contents, systemInstruction } = req.body;
     console.log('받은 데이터:', JSON.stringify({ contents, systemInstruction }));

     const response = await fetch(... {
        body: JSON.stringify({ contents, systemInstruction })
     });

    const data = await response.json();
    console.log('Gemini 응답:', JSON.stringify(data));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ result: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}