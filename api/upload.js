// /api/upload.js
const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { r2_key, title, description, tags } = req.body;

    const payload = JSON.stringify({
      ref: 'master',
      inputs: {
        r2_key: r2_key || '',
        title: title || '',
        description: description || '',
        tags: tags || '',
      }
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/workflows/music-upload.yml/dispatches`,
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

    return res.status(200).json({ success: true, message: '유튜브 업로드 트리거 성공' });

  } catch (error) {
    console.log('에러:', error.message);
    return res.status(500).json({ error: error.message });
  }
};