/** Single answer value stored in `responses.answers` JSONB. */
export type ResponseAnswerValue = string | number | boolean | string[] | null;

export type ResponseAnswers = Record<string, ResponseAnswerValue>;
