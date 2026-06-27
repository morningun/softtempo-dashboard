export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 20
      })
    });

    const data = await response.json();

    const presets = data.results.map(page => ({
      id: page.id,
      title: page.properties['🎵 레퍼런스 곡명']?.title?.[0]?.text?.content || '',
      youtubeUrl: page.properties['🔗 유튜브 링크']?.url || '',
      genres: page.properties['🎹 장르 (Genre)']?.multi_select?.map(g => g.name) || [],
      bpm: page.properties['⏱️ 템포 (BPM)']?.rich_text?.[0]?.text?.content || '',
      instruments: page.properties['🎸 악기 구성']?.rich_text?.[0]?.text?.content || '',
      vocal: page.properties['🎙️ 보컬 질감']?.rich_text?.[0]?.text?.content || '',
      mood: page.properties['🌌 무드 & 감성']?.rich_text?.[0]?.text?.content || '',
      fullPrompt: page.properties['🔥 최종 프롬프트']?.rich_text?.[0]?.text?.content || '',
      rating: page.properties['⭐ 내 평가']?.select?.name || ''
    }));

    return res.status(200).json({ success: true, presets });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}