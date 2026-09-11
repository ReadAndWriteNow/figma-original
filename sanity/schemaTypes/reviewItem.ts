export default {
  name: 'reviewItem',
  title: '수업 소식 (리뷰/공지)',
  type: 'document',
  fields: [
    {
      name: 'reviewId',
      title: '고유 번호',
      type: 'number',
    },
    {
      name: 'title',
      title: '제목',
      type: 'string',
    },
    {
      name: 'date',
      title: '작성일',
      type: 'date',
    },
    {
      name: 'body',
      title: '본문 (HTML)',
      type: 'text',
    },
  ],
};
