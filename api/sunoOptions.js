const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY});
const DB_ID = process.env.NOTION_OPTIONS_DATABASE_ID;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'active',
        checkbox: { equals: true }
      },
      sorts: [
        { property: 'layer', direction: 'ascending' },
        { property: 'order', direction: 'ascending' }
      ]
    });

    const result = {};

    for (const page of response.results) {
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