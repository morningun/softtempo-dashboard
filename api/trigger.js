// /api/trigger.js
const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileId, title, stylPrompt, lyrics, language } = req.body;

    const r2Key = `videos/${Date.now()}.mp4`;

    const payload = JSON.stringify({
      ref: 'master',
      inputs: {
        image_file_id: fileId,
        title: title || '',
        style_prompt: stylPrompt || '',
        lyrics: lyrics || '',
        language: language || 'ko',
        r2_key: r2Key,
      }
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/workflows/music-auto.yml/dispatches`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'softtempo-app',
        'Content-Length': Buffer.byteLength(payload),
      }
    };

    await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        if (response.statusCode === 204) {
          resolve();
        } else {
          reject(new Error(`GitHub API 응답: ${response.statusCode}`));
        }
      });
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

     const mp4Url = `${process.env.R2_PUBLIC_URL}/${r2Key}`;
    return res.status(200).json({ success: true, message: 'Actions 트리거 성공', r2_key: r2Key, mp4_url: mp4Url });

  } catch (error) {
    console.log('에러:', error.message);
    return res.status(500).json({ error: error.message });
  }
};