// /api/options.js
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_OPTIONS_DATABASE_ID,
      filter: {
        property: 'active',
        checkbox: { equals: true }
      },
      sorts: [
        { property: 'layer', direction: 'ascending' },
        { property: 'order', direction: 'ascending' }
      ]
    });

    const options = {};

    response.results.forEach(page => {
      const layer = page.properties.layer?.rich_text?.[0]?.plain_text || '';
      const label = page.properties.label?.rich_text?.[0]?.plain_text || '';
      const value = page.properties.value?.rich_text?.[0]?.plain_text || '';

      if (!layer || !label || !value) return;

      if (!options[layer]) options[layer] = [];
      options[layer].push({ label, value });
    });

    return res.status(200).json({ success: true, options });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};