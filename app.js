// ─── 페이지 전환 ───


// ─── Google Drive 업로드 ───
const GOOGLE_CLIENT_ID = '1069291813254-bnb51fntviqatbdjsul7jct2hug174ft.apps.googleusercontent.com';
const DRIVE_FOLDER_ID = '1twt_l-QU1UJi0Hsn_bpfWfE9f2ChaW4R';

let driveAccessToken = null;

// app.js
function initCanvas() {
  if (typeof ckDrawCanvas === 'function') {
    ckDrawCanvas();
  } else {
    console.log('ckDrawCanvas 아직 로드 안됨');
  }
}
function initGoogleDrive() {
  gapi.load('client', async () => {
    await gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
  });
}

function googleLogin() {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: (response) => {
      driveAccessToken = response.access_token;
      console.log('구글 로그인 완료');
      uploadImageToDrive();
    },
  });
  client.requestAccessToken();
}

async function uploadImageToDrive() {
  if (!window.ckExportData?.imageDataUrl) {
    alert('이미지가 없습니다.');
    return;
  }

  const base64Data = window.ckExportData.imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const blob = new Blob([byteArray], { type: 'image/png' });

  const metadata = {
    name: `${window.ckExportData.title}_thumbnail.png`,
    parents: [DRIVE_FOLDER_ID],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${driveAccessToken}` },
    body: form,
  });

  const data = await response.json();
  console.log('Drive 업로드 완료:', data);
  return data.id;
}

// DOM 로드 후 호출
document.addEventListener('DOMContentLoaded', initCanvas);
function showPage(name, el) {
  const genBtn = document.getElementById('gen-btn');
  if (genBtn) genBtn.style.display = 'none';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .top-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll(`[onclick*="'${name}'"]`).forEach(b => b.classList.add('active'));

  if (name === 'cheatkey') {
    setTimeout(() => { lucide.createIcons(); ckSyncPrompt(); ckDrawCanvas(); }, 50);
  }
  // 추가: 콘텐츠 생성 탭으로 이동시 데이터 표시
  if (name === 'generate' && window.ckExportData) {
    const d = window.ckExportData;
    document.getElementById('import-card').style.display = 'block';
    document.getElementById('no-import-card').style.display = 'none';

    // 1. 버튼을 화면에 보여준다
    const realBtn = document.getElementById('gen-btn');
    if (realBtn) {
      realBtn.style.display = 'block';
      // 🟢 [핵심 수정] 버튼이 켜지는 이 타이밍에 startGenerate를 다이렉트로 강제 바인딩!
      realBtn.onclick = startGenerate; startGenerate
    }
    //document.getElementById('gen-btn').style.display = 'block';
    document.getElementById('import-image').src = d.imageDataUrl;
    document.getElementById('import-style').innerText = d.stylePrompt;
    document.getElementById('import-title').innerText = d.title;
    document.getElementById('import-lyrics').innerText = d.lyrics;
    document.getElementById('import-youtube').innerText = d.youtubeData;
  }

}

// ─── 프리셋 로드 ───
async function loadPresets() {
  try {
    const [presetsRes, refsRes] = await Promise.all([
      fetch('./stylePresets.json'),
      fetch('./references.json')
    ]);

    const presetsText = await presetsRes.text();
    const refsText = await refsRes.text();

    const presetsData = JSON.parse(presetsText.replace(/\u00A0/g, ' '));
    const refsData = JSON.parse(refsText);

    // 콘텐츠 생성 탭
    const p = presetsData.stylePresets;
    fillSelect('sel-genre', p.layer_1_genre);
    fillSelect('sel-bpm', p.layer_2_bpm);
    fillSelect('sel-instruments', p.layer_3_instruments);
    fillSelect('sel-vocal', p.layer_4_vocal);
    fillSelect('sel-mood', p.layer_5_mood);
    fillSelect('sel-language', p.layer_6_language);
    fillSelect('sel-thumbnail', p.layer_7_thumbnail);

    // 치트키 탭 (cheatkey.js 에서 사용)
    if (typeof ckLoadPresets === 'function') {
    ckLoadPresets(p, refsData.references);
    }

  } catch(e) {
    console.error('데이터 로드 실패', e);
  }
}

function fillSelect(id, items) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = items.map(v => {
    if (typeof v === 'object') return `<option value="${v.value}">${v.label}</option>`;
    return `<option value="${v}">${v}</option>`;
  }).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  loadPresets();
  lucide.createIcons();
  //ckSyncPrompt();

    // localStorage에서 이전 데이터 복원
  const saved = localStorage.getItem('ckExportData');
  if (saved) {
    window.ckExportData = JSON.parse(saved);
  }
});

// ─── 콘텐츠 생성 ───
const STEPS = [
  { name: 'Suno (APIPASS)', detail: '음악 생성 중...' },
  { name: 'Flux', detail: '앨범 이미지 생성 중...' },
  { name: 'Pexels', detail: '배경 영상 다운로드 중...' },
  { name: 'FFmpeg', detail: '영상 합성 중...' },
  { name: 'GPT', detail: '제목·설명·태그 생성 중...' },
  { name: 'YouTube', detail: '업로드 중...' },
  { name: 'Google Drive', detail: '저장 중...' },
];

async function startGenerate() {
  if (!window.ckExportData || !window.ckExportData.imageDataUrl) {
    alert("❌ 썸네일 이미지가 없습니다!");
    return;
  }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.textContent = '생성 중...';

  try {
    // Step 1: 구글 로그인 + Drive 업로드
    await new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response) => {
          try {
            driveAccessToken = response.access_token;
            const fileId = await uploadImageToDrive();
            console.log('Drive 파일 ID:', fileId);
            resolve(fileId);
          } catch(e) {
            reject(e);
          }
        },
      });
      client.requestAccessToken();
    });

    alert('✅ Drive 업로드 완료!');

  } catch(err) {
    console.log('에러:', err.message);
    alert('❌ ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '▶ 생성 시작';
  }
}
window.addEventListener('DOMContentLoaded', () => {
  loadPresets();
  lucide.createIcons();
  initGoogleDrive(); // 추가
  
  const saved = localStorage.getItem('ckExportData');
  if (saved) {
    window.ckExportData = JSON.parse(saved);
  }
});