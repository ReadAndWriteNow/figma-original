import { defineConfig } from 'sanity';
import siteSettings from './schemaTypes/siteSettings';
import qnaItem from './schemaTypes/qnaItem';
import reviewItem from './schemaTypes/reviewItem';

export default defineConfig({
  name: 'hanwoori-reading',
  title: '한우리 독서토론논술 산내푸르지오 관리자',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  schema: {
    types: [siteSettings, qnaItem, reviewItem],
  },
});
