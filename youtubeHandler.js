// youtubeHandler.js (새로 만든 파일)

// 1. [분석] 버튼을 누르면 실행되는 브라우저 전용 함수
async function handleYoutubeAnalysis() {
  const urlInput = document.getElementById('youtube-url-input');
  const analyzeBtn = document.getElementById('btn-analyze-youtube');
  
  if (!urlInput || !urlInput.value.trim()) {
    alert("유튜브 링크나 곡 제목을 입력해 주세요!");
    return;
  }

  try {
    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "분석중..";

    // Vercel 서버(백엔드)로 데이터 요청 전송
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeInput: urlInput.value })
    });

    const result = await response.json();

    if (result.success) {
      alert("🎉 노션 DB 등록 완료! 화면을 확인하세요.");
      urlInput.value = '';
      // 만약 아카이브 갱신 함수가 존재한다면 실행
      if (typeof fetchAndRenderNotionPresets === 'function') {
        fetchAndRenderNotionPresets(); 
      }
    } else {
      alert(`실패: ${result.error}`);
    }
  } catch (error) {
    alert("서버와 통신하는 중 에러가 발생했습니다.");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerText = "분석";
  }
}

// 2. 프리셋 카드의 [적용] 버튼을 누르면 위쪽 수노 프롬프트창 값을 바꾸는 함수
function applyPresetToPrompt(fullPromptText) {
  const promptTextArea = document.querySelector('textarea'); 
  if (promptTextArea) {
    promptTextArea.value = fullPromptText;
    console.log("🚀 프롬프트가 주입되었습니다.");
  } else {
    alert("프롬프트 입력창을 찾을 수 없습니다.");
  }
}