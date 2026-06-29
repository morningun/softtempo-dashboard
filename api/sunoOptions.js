module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_OPTIONS_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'active',
          checkbox: { equals: true }
        },
        sorts: [
          { property: 'layer', direction: 'ascending' },
          { property: 'order', direction: 'ascending' }
        ]
      })
    });

    const data = await response.json();
    const result = {};

    for (const page of data.results) {
      const props = page.properties;

      const layer = props.layer?.title?.[0]?.plain_text;
      const label = props.label?.rich_text?.[0]?.plain_text;
      const value = props.value?.rich_text?.[0]?.plain_text;

      if (!layer || !label || !value) continue;

      if (!result[layer]) result[layer] = [];
      result[layer].push({ label, value });
    }

    res.status(200).json({ stylePresets: result });

  } catch (e) {
    console.error('Notion fetch error:', e);
    res.status(500).json({ error: e.message });
  }
};