import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log('Available Gemini models:');
    for (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
