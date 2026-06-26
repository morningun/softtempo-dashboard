// ─── 치트키 생성기 전용 ───
let ckApiKey = "";

let ckBgImage = null;

// ─── 프리셋 초기화 (app.js 에서 호출) ───
function ckLoadPresets(p, references) {
  fillSelect('ck-genreSelect', p.layer_1_genre);
  fillSelect('ck-bpmSelect', p.layer_2_bpm);
  fillSelect('ck-instrumentSelect', p.layer_3_instruments);
  fillSelect('ck-vocalSelect', p.layer_4_vocal);
  fillSelect('ck-moodSelect', p.layer_5_mood);
  fillSelect('ck-languageSelect', p.layer_6_language);

  const refItems = references.map(r => ({ value: r.key, label: r.label }));
  fillSelect('ck-referenceSelect', refItems);

  window.ckRefDb = {};
  references.forEach(r => {
    window.ckRefDb[r.key] = { vibe: r.vibe, structure: r.structure };
  });
   const uploadInput = document.getElementById('ck-imageUpload');
  if (uploadInput) {
    uploadInput.addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = new Image();
        img.onload = () => {
          ckBgImage = img;
          console.log('이미지 로드됨:', ckBgImage);
          setTimeout(() => ckDrawCanvas(), 50);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

// ─── 스타일 프롬프트 동기화 ───
function ckSyncPrompt() {
  const genre = document.getElementById('ck-genreSelect')?.value || '';
  const bpm = document.getElementById('ck-bpmSelect')?.value || '';
  const instrument = document.getElementById('ck-instrumentSelect')?.value || '';
  const vocal = document.getElementById('ck-vocalSelect')?.value || '';
  const mood = document.getElementById('ck-moodSelect')?.value || '';
  const el = document.getElementById('ck-sunoStyleText');
  if (el) el.innerText = `${genre}, ${bpm}, ${instrument}, ${vocal}, ${mood}, clean vocals, high quality production`;
}

['ck-genreSelect','ck-bpmSelect','ck-instrumentSelect','ck-vocalSelect','ck-moodSelect'].forEach(id => {
  document.addEventListener('change', e => { if (e.target.id === id) ckSyncPrompt(); });
});

// ─── 탭 전환 ───
function ckSwitchTab(tab) {
  ['style','lyrics','youtube','thumbnail'].forEach(t => {
    const content = document.getElementById('ck-content-' + t);
    const btn = document.getElementById('ck-tab-' + t);
    if (content) content.style.display = t === tab ? 'block' : 'none';
    if (btn) {
      btn.style.background = t === tab ? '#4f46e5' : 'transparent';
      btn.style.color = t === tab ? 'white' : '#64748b';
    }
  });
  if (tab === 'thumbnail') setTimeout(() => ckDrawCanvas(), 50);
}

// ─── 복사 ───
function ckCopy(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const ta = document.createElement('textarea');
  ta.value = el.innerText;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    const btnMap = {
      'ck-sunoStyleText': 'ck-copySunoBtnText',
      'ck-lyricsOutputText': 'ck-copyLyricsBtnText',
      'ck-youtubeOutputText': 'ck-copyYoutubeBtnText'
    };
    const btnId = btnMap[elementId];
    if (btnId) {
      const b = document.getElementById(btnId);
      const orig = b.innerText;
      b.innerText = '복사 완료! ✔';
      setTimeout(() => b.innerText = orig, 2000);
    }
  } catch(e) {}
  document.body.removeChild(ta);
}

// ─── Gemini API ───
async function ckFetchGemini(userPrompt, systemInstruction) {
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
    
  };
  const maxRetries = 1;
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      
      const response = await fetch('/api/generate',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();      
      const text = result.result;
      if (text) return text;
      throw new Error('빈 응답');
    } catch(e) {
      if (attempt === maxRetries) throw new Error('AI 통신 실패');
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// ─── 마크다운 → HTML ───
function ckFormatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/### (.*)/g, '<h4 style="color:#818cf8;font-size:12px;font-weight:700;margin:12px 0 6px;">$1</h4>')
    .replace(/## (.*)/g, '<h3 style="color:white;font-size:13px;font-weight:700;border-bottom:1px solid #1e293b;padding-bottom:4px;margin:16px 0 8px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#a5b4fc;">$1</strong>')
    .replace(/\* (.*)/g, '<li style="color:#94a3b8;margin-left:16px;padding:2px 0;">$1</li>')
    .replace(/\n/g, '<br>');
}

// ─── 썸네일 캔버스 ───
function ckDrawCanvas() {
 const canvas = document.getElementById('ck-thumbnailCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = (rect.width * 9 / 16) * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.width * 9 / 16;

  const title = document.getElementById('ck-canvasTitle')?.value || '';
  const sub = document.getElementById('ck-canvasSub')?.value || '';
  const color = document.getElementById('ck-canvasColor')?.value || '#ffffff';
  const dim = (document.getElementById('ck-canvasDim')?.value || 50) / 100;
  const fontSize = parseInt(document.getElementById('ck-canvasFont')?.value || 75);
  const yPct = (document.getElementById('ck-canvasY')?.value || 50) / 100;

  if (ckBgImage && ckBgImage !== 'failed') {
    ctx.drawImage(ckBgImage, 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#311042');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = `rgba(0,0,0,${0.3 + dim * 0.5})`;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const targetY = H * yPct;

  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.font = `bold ${Math.round(fontSize * 0.9)}px "Pretendard Variable", sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(title, W / 2, targetY - 40);

  ctx.shadowBlur = 10;
  ctx.font = `normal ${Math.round(fontSize * 0.4)}px "Pretendard Variable", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(sub, W / 2, targetY + 60);

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}


function ckInsertVisualPrompt() {
  const el = document.getElementById('ck-imagePrompt');
  if (!el) return;
  if (window.ckActiveSuggestedPrompt) {
    el.value = window.ckActiveSuggestedPrompt;
  } else {
    const genre = document.getElementById('ck-genreSelect')?.value || '';
    const mood = document.getElementById('ck-moodSelect')?.value || '';
    const title = document.getElementById('ck-songTitle')?.value || '';
    el.value = `Aesthetic fantasy artwork for album cover titled "${title}", matching ${genre} and ${mood} mood, high resolution, cozy lofi illustration style, cinematic lighting, 16:9`;
  }
}

async function ckFetchImagen(promptText) {
  const payload = {
    instances: { prompt: promptText },
    parameters: { sampleCount: 1 }
  };

  //console.log("🚀 [Gemini API 호출 직전 데이터]:\n", JSON.stringify(payload, null, 2));
  const maxRetries = 3;
  let delay = 1000
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: userPrompt, systemPrompt: systemInstruction  })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const base64 = result.predictions?.[0]?.bytesBase64Encoded;
      if (base64) return `data:image/png;base64,${base64}`;
      throw new Error('빈 이미지 응답');
    } catch(e) {
      if (attempt === maxRetries) throw new Error('이미지 생성 실패');
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

async function ckGenerateImage() {
  const prompt = document.getElementById('ck-imagePrompt')?.value.trim();
  if (!prompt) { alert('이미지 프롬프트를 입력해주세요.'); return; }

  const loader = document.getElementById('ck-imageLoader');
  loader.style.display = 'flex';
console.log("프롬프트 ==>"==prompt)
  try {
    const dataUrl = await ckFetchImagen(prompt);
    const img = new Image();
    img.onload = () => {
      ckBgImage = img;
      ckDrawCanvas();
      loader.style.display = 'none';
    };
    img.src = dataUrl;
  } catch(e) {
    loader.style.display = 'none';
    alert(e.message);
  }
}

function ckDownloadCanvas() {
  const canvas = document.getElementById('ck-thumbnailCanvas');
  const title = document.getElementById('ck-canvasTitle')?.value || 'thumbnail';
  try {
    const link = document.createElement('a');
    link.download = `thumbnail_${title}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch(e) {
    alert('우클릭 → 이미지를 다른 이름으로 저장 해주세요.');
  }
}

// 캔버스 실시간 업데이트
['ck-canvasTitle','ck-canvasSub','ck-canvasColor','ck-canvasDim','ck-canvasFont','ck-canvasY'].forEach(id => {
  document.addEventListener('input', e => { if (e.target.id === id) ckDrawCanvas(); });
});

// ─── 가사 & 유튜브 기획 생성 ───
async function ckGenerate() {
  const refKey = document.getElementById('ck-referenceSelect').value;
  const refData = window.ckRefDb?.[refKey] || { vibe: '감성적인 팝', structure: '[vers 1]\n첫 번째 절\n\n[chorus 1]\n후렴구' };
  const title = document.getElementById('ck-songTitle').value || '무제';
  const concept = document.getElementById('ck-songConcept').value || '사랑에 관한 이야기';
  const language = document.getElementById('ck-languageSelect').value;
  const hookCheck = document.getElementById('ck-addHookCheck').checked;
  const timelineCheck = document.getElementById('ck-preventTimelineCheck').checked;

  const btn = document.getElementById('ck-generateBtn');
  btn.disabled = true;
  btn.style.opacity = '0.5';

  document.getElementById('ck-lyricsPlaceholder').style.display = 'none';
  document.getElementById('ck-lyricsOutputBlock').style.display = 'none';
  document.getElementById('ck-lyricsLoading').style.display = 'block';
  document.getElementById('ck-youtubePlaceholder').style.display = 'none';
  document.getElementById('ck-youtubeOutputBlock').style.display = 'none';
  document.getElementById('ck-youtubeLoading').style.display = 'block';

  ckSwitchTab('lyrics');

  const genre = document.getElementById('ck-genreSelect').value;
  const bpm = document.getElementById('ck-bpmSelect').value;
  const instrument = document.getElementById('ck-instrumentSelect').value;
  const vocal = document.getElementById('ck-vocalSelect').value;
  const mood = document.getElementById('ck-moodSelect').value;
  const stylePrompt = `${genre}, ${bpm}, ${instrument}, ${vocal}, ${mood}, clean vocals, high quality production`;

  let systemLyric = `당신은 대한민국 최고의 작사가이자 Suno AI 전문가입니다.
사용자의 곡 정보를 기반으로 뼈대 가사의 구조와 음절 배치를 100% 모방한 새로운 가사를 **${language}**로 작성해 주세요.
규칙: 1) 음절 수와 띄어쓰기 준수 2) 기존 단어 대체 3) '/' 기호 동일 위치 이식 4) 무드: '${refData.vibe}' 5) 전체 가사를 **${language}**로 통일`;

  if (hookCheck) systemLyric += `\n6) [Chorus] 직전에 훅을 삽입:\n[Hook]\nwoo woo woo woo wah uh yeah e yeah e yeah ~eh`;
  if (timelineCheck) systemLyric += `\n7) 시간 타임스탬프나 한글 메타 지시어 제거. [Verse 1], [Chorus] 등 영어 태그만 사용.`;

  const userLyric = `[곡 정보]\n제목: ${title}\n언어: ${language}\n컨셉: ${concept}\n\n[뼈대 가사]\n${refData.structure}\n\n위 뼈대를 기반으로 ${language} 가사 전문을 출력해줘.`;

  //const systemYoutube = `당신은 유튜브 채널 수익화 마케터입니다. 입력 정보를 바탕으로 마케팅 기획서를 한국어로 작성하세요. 마지막 줄에 [Visual Prompt] 태그로 영문 이미지 프롬프트를 기재해 주세요.`;
  const systemYoutube = `당신은 유튜브 채널 수익화 마케터입니다. 입력 정보를 바탕으로 마케팅 기획서를 ${language}로 작성하세요. 마지막 줄에 [Visual Prompt] 태그로 영문 이미지 프롬프트를 기재해 주세요.`
  const userYoutube = `[곡 기획]\n제목: ${title}\n언어: ${language}\n주제: ${concept}\n스타일: ${stylePrompt}\n\n유튜브 최적화 기획서 (타겟 분석, 제목 5선, 썸네일 가이드, 설명란 템플릿) 작성해줘.\n마지막 줄: [Visual Prompt] 영문 이미지 프롬프트`;

  try {
    const [lyrics, youtube] = await Promise.all([
      ckFetchGemini(userLyric, systemLyric),
      ckFetchGemini(userYoutube, systemYoutube)
    ]);

    document.getElementById('ck-lyricsLoading').style.display = 'none';
    document.getElementById('ck-lyricsOutputBlock').style.display = 'block';
    document.getElementById('ck-lyricsOutputText').innerText = lyrics;

    document.getElementById('ck-youtubeLoading').style.display = 'none';
    document.getElementById('ck-youtubeOutputBlock').style.display = 'block';
    document.getElementById('ck-youtubeOutputText').innerHTML = ckFormatMarkdown(youtube);

    const matchVisual = youtube.match(/\[Visual Prompt\]\s*(.*)/i);
    if (matchVisual?.[1]) {
      window.ckActiveSuggestedPrompt = matchVisual[1].trim();
      document.getElementById('ck-imagePrompt').value = window.ckActiveSuggestedPrompt;
    }

    document.getElementById('ck-canvasTitle').value = title;
    document.getElementById('ck-canvasSub').value = concept.substring(0, 25) + '...';
    ckDrawCanvas();

  } catch(err) {
    document.getElementById('ck-lyricsLoading').style.display = 'none';
    document.getElementById('ck-lyricsPlaceholder').style.display = 'block';
    document.getElementById('ck-lyricsPlaceholder').innerHTML = '<p style="color:#f87171;font-size:12px;">API 연결 실패. API 키를 확인해 주세요.</p>';
    document.getElementById('ck-youtubeLoading').style.display = 'none';
    document.getElementById('ck-youtubePlaceholder').style.display = 'block';
  }


  btn.disabled = false;
  btn.style.opacity = '1';
}

function ckSendToGenerate() {
  // 캔버스 이미지 데이터 저장
  const canvas = document.getElementById('ck-thumbnailCanvas');
  window.ckExportData = {
    imageDataUrl: canvas.toDataURL('image/png'),
    stylePrompt: document.getElementById('ck-sunoStyleText')?.innerText || '',
    lyrics: document.getElementById('ck-lyricsOutputText')?.innerText || '',
    youtubeData: document.getElementById('ck-youtubeOutputText')?.innerText || '',
    title: document.getElementById('ck-songTitle')?.value || '',
  };

  // localStorage에 저장
  localStorage.setItem('ckExportData', JSON.stringify(window.ckExportData));
  // 콘텐츠 생성 탭으로 이동
  showPage('generate');
  document.querySelectorAll(`[onclick*="'generate'"]`).forEach(b => b.classList.add('active'));
  
  console.log('전송 데이터:', window.ckExportData);  
}

/// 테스트 구역 
window.addEventListener('DOMContentLoaded', () => {
  const savedData = localStorage.getItem('my_test_json');
  if (savedData) {
    const parsed = JSON.parse(savedData);
    // 새로고침되어도 자동으로 콘텐츠 생성 카드를 열고 값을 유지
    pushData(parsed); 
  }
});

// 콘솔 전용 치트키 배달 함수 최적화 버전
window.pushData = function(jsonInput) {
  localStorage.setItem('my_test_json', JSON.stringify(jsonInput));

  window.ckExportData = {
    title: jsonInput.title,
    stylePrompt: jsonInput.style,
    lyrics: jsonInput.lyrics,
    youtubeData: jsonInput.youtube,
    imageDataUrl: document.getElementById('ck-thumbnailCanvas') ? 
                  document.getElementById('ck-thumbnailCanvas').toDataURL('image/png') : ""
  };

  if (typeof showPage === 'function') {
    showPage('generate');
  }

  // 🟢 [추가] 탭 전환이 끝난 직후, 맨 밑바닥에 새로 심은 버튼을 강제로 '짜잔' 하고 보여주는 격발 장치
  setTimeout(() => {
    var finalBtn = document.getElementById('gen-btn');
    if (finalBtn) {
      finalBtn.style.setProperty('display', 'block', 'important');
      finalBtn.innerText = '콘텐츠 생성 완료';
    }
  }, 50); // app.js가 화면 다 그릴 때까지 0.05초만 기다렸다가 강제 조준
}