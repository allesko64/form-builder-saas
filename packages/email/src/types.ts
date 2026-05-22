export type AnswerSummaryItem = {
  label: string;
  value: string;
};

export type NotifyRespondentInput = {
  email: string;
  formTitle: string;
  submittedAt: Date;
  answersSummary: AnswerSummaryItem[];
  viewReportUrl?: string;
};
