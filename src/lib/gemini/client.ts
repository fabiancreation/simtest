import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let _model: GenerativeModel | null = null;

export function getGeminiFlash(): GenerativeModel {
  if (!_model) {
    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY!
    );
    _model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return _model;
}
