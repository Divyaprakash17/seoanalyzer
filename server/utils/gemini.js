const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_TEXT_LENGTH = 30000;
const MIN_TEXT_LENGTH = 20;

// Mapping for prompt types
const getContentTypePrompt = (contentType) => {
  const prompts = {
    blog: 'blog post',
    tweet: 'tweet',
    caption: 'social media caption',
    news: 'news article',
    other: 'content'
  };

  const considerations = {
    blog: 'Consider post length, headings, internal/external linking, and engagement potential.',
    tweet: 'Focus on hashtag usage, character count, engagement hooks, and call-to-action.',
    caption: 'Consider visual appeal, hashtag strategy, engagement prompts, and brand voice.',
    news: 'Focus on timeliness, factual accuracy, headline strength, and source credibility.',
    other: 'Consider general readability, keyword usage, and content structure.'
  };

  const scoring = {
    '90-100': 'Excellent - Well-optimized with great keyword usage, structure, and readability',
    '80-89': 'Very Good - Strong content with minor SEO improvements needed',
    '70-79': 'Good - Decent content but needs optimization in several areas',
    '60-69': 'Fair - Needs significant SEO improvements',
    '0-59': 'Poor - Needs major SEO work'
  };

  return {
    label: prompts[contentType] || prompts.other,
    considerations: considerations[contentType] || considerations.other,
    scoring
  };
};

// Builds the full prompt text dynamically
const buildSEOPrompt = (text, contentTypeData) => {
  const { label, considerations, scoring } = contentTypeData;

  const scoringGuidelines = Object.entries(scoring)
    .map(([range, desc]) => `- ${range}: ${desc}`)
    .join('\n');

  return `
Analyze the following ${label} for SEO and provide a detailed analysis.

For the keywords, provide a comprehensive list of relevant terms and phrases that would make this content more SEO-friendly. Include:
- Primary keywords (1–3 word phrases)
- Long-tail keywords (3–5 word phrases)
- Related terms and synonyms
- Common misspellings if relevant
- Location-based terms if applicable
- Industry-specific terminology

Return the response as a valid JSON object with this exact structure:
{
  "analysis": "<detailed_analysis>",
  "score": <number_between_0_and_100>,
  "keywords": [
    {
      "keyword": "<main keyword phrase>",
      "type": "primary|long-tail|related|synonym|location|industry",
      "relevance": <number_between_1_and_10>,
      "difficulty": "low|medium|high"
    }
  ]
}

Scoring Guidelines:
${scoringGuidelines}

Additional considerations for this content type:
${considerations}

Text to analyze:
${text}`.trim();
};

// Analyze SEO text using Gemini
const analyzeSEOText = async (text, contentType = 'blog') => {
  if (typeof text !== 'string' || text.trim().length < MIN_TEXT_LENGTH) {
    throw new Error(`Input text is too short. Minimum ${MIN_TEXT_LENGTH} characters required.`);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Input text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const contentTypeData = getContentTypePrompt(contentType);
  const prompt = buildSEOPrompt(text, contentTypeData);

  try {
    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
    const content = response.text();

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
    const rawJson = jsonMatch ? jsonMatch[1] : content;

    const result = JSON.parse(rawJson);

    if (Array.isArray(result.keywords)) {
      result.keywords.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      while (result.keywords.length < 10) {
        result.keywords.push({
          keyword: '',
          type: 'related',
          relevance: 1,
          difficulty: 'medium'
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error analyzing text with Gemini:', error.message);
    throw new Error('Failed to analyze text with Gemini.');
  }
};

// Rewrites text with a new keyword inserted
const insertKeyword = async (originalText, keyword) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Given the following text and a keyword, rewrite the text to naturally include the keyword while maintaining good grammar and flow.
Return only the rewritten text, with correct spelling and grammar. No explanations or markdown formatting.

Original text:
${originalText}

Keyword to insert:
${keyword}

Rewritten text:`.trim();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    const updatedText = response.text().trim();
    if (!updatedText) throw new Error('Empty response from Gemini API.');

    return updatedText;
  } catch (error) {
    console.error('Error inserting keyword with Gemini:', error.message);
    throw new Error('Failed to insert keyword into text.');
  }
};

module.exports = {
  analyzeSEOText,
  insertKeyword
};
