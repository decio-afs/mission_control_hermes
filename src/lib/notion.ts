import axios from 'axios';

// We use the Vite proxy defined in vite.config.ts to bypass CORS
const NOTION_PROXY_BASE = '/notion-api/v1';

// These should be set in .env.local
const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN || '';

export const notion = axios.create({
  baseURL: NOTION_PROXY_BASE,
  headers: {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  },
});

/**
 * Utility functions to clean up Notion's complex JSON response
 */
export const utils = {
  getText: (property: any) => {
    if (!property || !property.rich_text || property.rich_text.length === 0) return '';
    return property.rich_text[0].plain_text;
  },
  getTitle: (property: any) => {
    if (!property || !property.title || property.title.length === 0) return '';
    return property.title[0].plain_text;
  },
  getSelect: (property: any) => {
    return property?.select?.name || property?.status?.name || '';
  },
  getNumber: (property: any) => {
    return property?.number || 0;
  },
  getDate: (property: any) => {
    return property?.date?.start ? new Date(property.date.start) : null;
  }
};
