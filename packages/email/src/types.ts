export type AnswerSummaryItem = {
  label: string;
  value: string;
};

export type NotifyCreatorInput = {
  formId: string;
  formTitle: string;
  submittedAt: Date;
  answersSummary: AnswerSummaryItem[];
};

export type NotifyRespondentInput = {
  email: string;
  formTitle: string;
  submittedAt: Date;
  answersSummary: AnswerSummaryItem[];
  viewReportUrl?: string;
};
