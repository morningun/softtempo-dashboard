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
  const promptDiv = document.getElementById('ck-sunoStyleText');
  if (promptDiv) {
    promptDiv.textContent = fullPromptText;
    console.log("🚀 프롬프트가 주입되었습니다.");
  } else {
    alert("프롬프트 입력창을 찾을 수 없습니다.");
  }
}

async function fetchAndRenderNotionPresets() {
  const container = document.querySelector('.notion-preset-container');
  const listArea = document.getElementById('notion-preset-list');
  
  if (!listArea) return;
  listArea.innerHTML = '<p style="color:#888; font-size:13px;">불러오는 중...</p>';

  try {
    const response = await fetch('/api/presets');
    const result = await response.json();

    if (!result.success || result.presets.length === 0) {
      listArea.innerHTML = '<p style="color:#888; font-size:13px;">저장된 프리셋이 없습니다.</p>';
      return;
    }

    listArea.innerHTML = result.presets.map(preset => `
      <div style="background:#1a1f2e; border:1px solid #2d3348; border-radius:6px; padding:12px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="color:#fff; font-size:14px;">🎵 ${preset.title}</strong>
          <span style="color:#888; font-size:12px;">${preset.rating}</span>
        </div>
        <div style="color:#aaa; font-size:12px; margin-bottom:4px;">🎹 ${preset.genres.join(', ')} | ⏱️ ${preset.bpm}</div>
        <div style="color:#aaa; font-size:12px; margin-bottom:8px;">🌌 ${preset.mood}</div>
        <button onclick="applyPresetToPrompt('${preset.fullPrompt.replace(/'/g, "\\'")}')" 
          style="background:#4f46e5; color:#fff; border:none; border-radius:4px; padding:4px 10px; font-size:12px; cursor:pointer;">
          적용
        </button>
        ${preset.youtubeUrl ? `<a href="${preset.youtubeUrl}" target="_blank" style="color:#4f46e5; font-size:12px; margin-left:8px;">▶ 유튜브</a>` : ''}
      </div>
    `).join('');

  } catch (error) {
    listArea.innerHTML = '<p style="color:#f00; font-size:13px;">불러오기 실패</p>';
  }
}

// 새로고침 버튼 연결
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderNotionPresets();
  document.getElementById('btn-refresh-notion')?.addEventListener('click', fetchAndRenderNotionPresets);
});