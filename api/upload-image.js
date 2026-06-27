// /api/upload-image.js
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageDataUrl, fileName } = req.body;

    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // OAuth 토큰으로 인증
    const credentialsInfo = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
    credentials: credentialsInfo,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const { Readable } = require('stream');
    const stream = Readable.from(buffer);

    const uploaded = await drive.files.create({
      requestBody: {
        name: fileName || 'thumbnail.png',
        parents: [process.env.DRIVE_IMAGE_FOLDER_ID],
      },
      media: {
        mimeType: 'image/png',
        body: stream,
      },
      fields: 'id, webViewLink',
    });

    return res.status(200).json({
      fileId: uploaded.data.id,
      fileUrl: uploaded.data.webViewLink,
    });

  } catch (error) {
    console.log('에러:', error.message);
    return res.status(500).json({ error: error.message });
  }
};