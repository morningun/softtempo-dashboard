// /api/upload-image-r2.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageDataUrl, fileName } = req.body;

    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME;
    const token = process.env.R2_ACCESS_TOKEN;
    const fileKey = fileName || `thumbnail_${Date.now()}.png`;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${fileKey}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'image/png',
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`R2 업로드 실패: ${err}`);
    }

    return res.status(200).json({
      fileKey: fileKey,
      success: true,
    });

  } catch (error) {
    console.log('에러:', error.message);
    return res.status(500).json({ error: error.message });
  }
};