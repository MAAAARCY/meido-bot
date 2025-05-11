import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

export class GeminiModel {
    private readonly model: GenerativeModel;
    private readonly genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY!
          );
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    public async getGeminiResponse(content: string): Promise<string> {
        const result = await this.generateContent(content);
        const json = JSON.parse(result);

        if (json["response"] == null) {
            return "エラーが発生しました。";
        }

        return json["response"];
    }

    private async generateContent(content: string): Promise<string> {
        const result = await this.model.generateContent([
            `あなたは親切なメイドAIです。以下の会話に日本語で返答してください。二人称は常にご主人様でお願いします。会話内容:${content}`
        ]);
        return result.response.text();
    }
}
