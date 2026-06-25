// js/loader.js
async function loadPage(page) {
  try {
    const response = await fetch(`pages/${page}.html`);
    if (!response.ok) throw new Error(`페이지 로드 실패: ${page}`);
    
    const html = await response.text();
    document.getElementById('page-content').innerHTML = html;
    
    // 🚨 [핵심 업데이트] 좌측 사이드바 버튼과 상단 모바일 탭 버튼 둘 다 active 스타일 동시 적용
    document.querySelectorAll('.nav-item, .top-tab').forEach(btn => {
      const isTarget = btn.getAttribute('data-page') === page || btn.getAttribute('onclick')?.includes(`'${page}'`);
      btn.classList.toggle('active', isTarget);
    });
    
    // 치트키 생성기 전용 초기화 유예장치
    if (page === 'cheatkey') {
      setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof initializeCheatkey === 'function') {
          initializeCheatkey();
        }
      }, 150);
    }
    
  } catch (error) {
    console.error(error);
    document.getElementById('page-content').innerHTML = `
      <div style="padding:60px; text-align:center; color:#64748b;">
        페이지를 불러올 수 없습니다.<br><small>${error.message}</small>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPage('dashboard');
});
