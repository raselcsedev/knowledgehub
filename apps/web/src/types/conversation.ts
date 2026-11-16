
export type Citation = {
  sourceNumber: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  originalName: string;
  chunkIndex: number;
  similarity: number;
  content: string;
};

export type QaResponse = {
  question: string;
  answer: string;
  provider: "mock" | "openai" | "none";
  model?: string;
  embeddingModel: string;
  citations: Citation[];
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
};

export type ConversationMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Citation[] | null;
  provider: string | null;
  model: string | null;
  embeddingModel: string | null;
  conversationId: string;
  createdAt: string;
};

export type ConversationDetail = Conversation & {
  messages: ConversationMessage[];
};

export type CreateMessageResponse = {
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
  qa: QaResponse;
};
