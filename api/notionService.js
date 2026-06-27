import { Client } from '@notionhq/client';

// ⚠️ 보안을 위해 API 키와 DB ID는 환경변수(process.env)로 관리하는 것이 좋습니다.
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 노션 클라이언트 초기화
const notion = new Client({ auth: NOTION_API_KEY });

/**
 * 제미나이가 분석한 수노 프롬프트 데이터를 노션 DB에 삽입하는 함수
 * @param {Object} musicData - 제미나이가 추출한 구조화된 음악 데이터
 */
export async function insertPromptToNotion(musicData) {
  try {
      console.log("DB ID:", NOTION_DATABASE_ID);
    // 노션 API 규격에 맞추어 데이터 삽입 요청
    const response = await notion.pages.create({
      parent: {
        database_id: NOTION_DATABASE_ID,
      },
      // 노션 표의 각 열(Column) 이름과 타입을 정확히 매칭해야 에러가 나지 않습니다.
      properties: {
        // 1. 레퍼런스 곡명 (Title 타입 - 메인 이름 칸)
        '🎵 레퍼런스 곡명': {
          title: [
            {
              text: { content: musicData.referenceTitle || '이름 없는 레퍼런스' }
            }
          ]
        },
        // 2. 유튜브 링크 (URL 타입)
        '🔗 유튜브 링크': {
          url: musicData.youtubeUrl || null
        },
        // 3. 장르 (Multi-select 타입 - 배열 형태로 전달)
        '🎹 장르 (Genre)': {
          multi_select: musicData.genres.map(genreName => ({ name: genreName }))
        },
        // 4. 템포 (Select 타입 - 문자열로 전달)
        '⏱️ 템포 (BPM)': {
          rich_text: { name: musicData.bpm || '100 BPM' }
        },
        // 5. 악기 구성 (Rich text 타입)
        '🎸 악기 구성': {
          rich_text: [
            {
              text: { content: musicData.instruments || '' }
            }
          ]
        },
        // 6. 보컬 질감 (Rich text 타입)
        '🎙️ 보컬 질감': {
          rich_text: [
            {
              text: { content: musicData.vocal || '' }
            }
          ]
        },
        // 7. 무드 & 감성 (Rich text 타입)
        '🌌 무드 & 감성': {
          rich_text: [
            {
              text: { content: musicData.mood || '' }
            }
          ]
        },
        // 8. 최종 프롬프트 (Rich text 타입)
        '🔥 최종 프롬프트': {
          rich_text: [
            {
              text: { content: musicData.fullPrompt || '' }
            }
          ]
        },
        // 9. 내 평가 (Select 타입 - 기본값 설정)
        '⭐ 내 평가': {
          select: { name: '☆☆☆☆☆' } // 처음 등록 시에는 빈 별점으로 세팅
        }
      }
    });

    console.log(`🎉 [${musicData.referenceTitle}] 노션 DB 등록 성공! (Page ID: ${response.id})`);
    return { success: true, pageId: response.id };

  } catch (error) {
    console.error('❌ 노션 API 통신 중 에러 발생:', error);
    return { success: false, error: error.message };
  }
}