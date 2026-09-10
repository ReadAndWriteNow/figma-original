export default {
  name: 'qnaItem',
  title: '자주 묻는 질문 (Q&A)',
  type: 'document',
  fields: [
    {
      name: 'order',
      title: '정렬 순서',
      type: 'number',
    },
    {
      name: 'question',
      title: '질문',
      type: 'string',
    },
    {
      name: 'answer',
      title: '답변 (HTML 또는 일반 텍스트)',
      type: 'text',
    },
  ],
};
