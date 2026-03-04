import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function checkModels() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    console.log("API Key exists:", !!apiKey);
    
    // We cannot easily list models with the new sdk directly without google-generative-ai package, 
    // let's fetch it via REST
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data.models.map((m: any) => m.name), null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkModels();
