import { saveGeneratedPreset } from '../notionService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const genData = req.body;

    if (!genData || !genData.title) {
      return res.status(400).json({ success: false, error: 'title은 필수입니다' });
    }

    const result = await saveGeneratedPreset(genData);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}