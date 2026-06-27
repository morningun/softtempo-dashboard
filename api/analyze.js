import { GoogleGenAI } from '@google/genai';
import { insertPromptToNotion } from './notionService.js'; // 바로 옆에 있는 노션 서비스 임포트

// Vercel 환경변수에서 API 키 안전하게 가져오기
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Vercel 백엔드 서버가 브라우저의 요청을 받는 공식 함수
export default async function handler(req, res) {
  // POST 요청이 아니면 거절
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { youtubeInput } = req.body;

  try {
    // 1. 제미나이에게 분석 요청
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `유저가 제공한 레퍼런스 정보: "${youtubeInput}"`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          너는 유튜브 음악을 분석하여 Suno v5.5 전용 고음질 프롬프트로 변환하는 천재 음악 엔지니어다.
          반드시 아래 JSON 구조로만 응답해라. 다른 텍스트는 절대로 출력하지 마라.
          {
            "referenceTitle": "곡 제목 (한국어)",
            "youtubeUrl": "${youtubeInput.startsWith('http') ? youtubeInput : ''}",
            "genres": ["장르1", "장르2"],
            "bpm": "BPM 수치 및 템포",
            "instruments": "악기 묘사",
            "vocal": "보컬 스타일 (front-and-center 포함)",
            "mood": "분위기 묘사",
            "fullPrompt": "[Hyper-Realistic] 시작하는 완벽한 영어 문장"
          }
        `
      }
    });

    const musicData = JSON.parse(response.text);

    // 2. 바로 옆에 있는 notionService.js를 실행해서 노션 DB에 저장!
    await insertPromptToNotion(musicData);
    
    // 3. 브라우저(프론트엔드)에게 "성공했어!"라고 응답
    return res.status(200).json({ success: true, data: musicData });

  } catch (error) {
    console.error("❌ 백엔드 분석 실패:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}