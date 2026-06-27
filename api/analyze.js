// api/analyze.js
import { insertPromptToNotion } from './notionService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { youtubeInput } = req.body;

  try {
    // fetch로 직접 Gemini REST API 호출
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `유저가 제공한 레퍼런스 정보: "${youtubeInput}"`
            }]
          }],
          systemInstruction: {
            parts: [{
              text: `너는 유튜브 음악을 분석하여 Suno v5.5 전용 고음질 프롬프트로 변환하는 천재 음악 엔지니어다.
반드시 아래 JSON 구조로만 응답해라. 다른 텍스트는 절대로 출력하지 마라.
{
  "referenceTitle": "곡 제목 (한국어)",
  "youtubeUrl": "${youtubeInput.startsWith('http') ? youtubeInput : ''}",
  "genres": ["장르1", "장르2"],
  "bpm": "BPM 수치 및 템포",
  "instruments": "악기 묘사",
  "vocal": "보컬 스타일",
  "mood": "분위기 묘사",
  "fullPrompt": "[Hyper-Realistic] 시작하는 완벽한 영어 문장"
}`
            }]
          },
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );
    console.log("GEMINI_API_KEY 존재:", !!process.env.GEMINI_API_KEY);
    const geminiData = await geminiRes.json();
    console.log("Gemini 응답:", JSON.stringify(geminiData));  // 추가

    const text = geminiData.candidates[0].content.parts[0].text;
    const musicData = JSON.parse(text);

    await insertPromptToNotion(musicData);

    return res.status(200).json({ success: true, data: musicData });

  } catch (error) {
    console.error("❌ 백엔드 분석 실패:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}