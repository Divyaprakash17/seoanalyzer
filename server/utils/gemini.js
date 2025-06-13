const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getContentTypePrompt = (contentType) => {
  const prompts = {
    blog: 'blog post',
    tweet: 'tweet',
    caption: 'social media caption',
    news: 'news article',
    other: 'content'
  };
  
  const contentTypeLabel = prompts[contentType] || 'content';
  
  return {
    intro: `Analyze the following ${contentTypeLabel} for SEO and provide a detailed analysis.`,
    scoring: {
      '90-100': 'Excellent - Well-optimized with great keyword usage, structure, and readability',
      '80-89': 'Very Good - Strong content with minor SEO improvements needed',
      '70-79': 'Good - Decent content but needs optimization in several areas',
      '60-69': 'Fair - Needs significant SEO improvements',
      '0-59': 'Poor - Needs major SEO work'
    },
    considerations: {
      blog: 'Consider post length, headings, internal/external linking, and engagement potential.',
      tweet: 'Focus on hashtag usage, character count, engagement hooks, and call-to-action.',
      caption: 'Consider visual appeal, hashtag strategy, engagement prompts, and brand voice.',
      news: 'Focus on timeliness, factual accuracy, headline strength, and source credibility.',
      other: 'Consider general readability, keyword usage, and content structure.'
    }
  };
};

// Constants for input validation
const MAX_TEXT_LENGTH = 30000; // ~7,500 words (assuming ~4 chars per word + spaces)
const MIN_TEXT_LENGTH = 20; // Minimum characters for meaningful analysis

const analyzeSEOText = async (text, contentType = 'blog') => {
  try {
    // Input validation
    if (typeof text !== 'string' || text.trim().length < MIN_TEXT_LENGTH) {
      throw new Error(`Input text is too short. Minimum ${MIN_TEXT_LENGTH} characters required.`);
    }
    
    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Input text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash'});
    const { intro, scoring, considerations } = getContentTypePrompt(contentType);
    
    const scoringGuidelines = Object.entries(scoring)
      .map(([range, desc]) => `- ${range}: ${desc}`)
      .join('\n');

    const prompt = `${intro}
    
    For the keywords, provide a comprehensive list of relevant terms and phrases that would make this content more SEO-friendly. Include:
    - Primary keywords (1-3 word phrases)
    - Long-tail keywords (3-5 word phrases)
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
        },
        ... (minimum 10 keywords, more if valuable)
      ]
    }
    
    Important guidelines for scoring:
    ${scoringGuidelines}
    
    Additional considerations for this content type:
    ${considerations[contentType] || considerations.other}
    
    Text to analyze: ${text}`;

    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
    const content = response.text();
    
    // Parse the response (Gemini might return markdown code blocks with JSON)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    const analysisResult = JSON.parse(jsonContent);
    
    // Sort keywords by relevance (highest first)
    if (analysisResult.keywords && Array.isArray(analysisResult.keywords)) {
      analysisResult.keywords.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      
      // Ensure we have at least 10 keywords, filling with empty if needed
      while (analysisResult.keywords.length < 10) {
        analysisResult.keywords.push({
          keyword: '',
          type: 'related',
          relevance: 1,
          difficulty: 'medium'
        });
      }
    }
    
    return analysisResult;
  } catch (error) {
    console.error('Error analyzing text with Gemini:', error);
    throw new Error('Failed to analyze text with Gemini');
  }
};

const insertKeyword = async (originalText, keyword) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash'});
    
    const prompt = `Given the following text and a keyword, rewrite the text to naturally include the keyword while maintaining good grammar and flow. 
    Return only the rewritten text, no additional explanations or markdown formatting,with correct spelling and grammar.
    
    Original text: ${originalText}
    Keyword to insert: ${keyword}
    
    Rewritten text:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response || !response.text) {
      console.error('Invalid response from Gemini API:', response);
      throw new Error('Invalid response from AI service');
    }
    
    const updatedText = response.text().trim();
    
    if (!updatedText) {
      throw new Error('Received empty response from AI service');
    }
    
    return updatedText;
  } catch (error) {
    console.error('Error inserting keyword with Gemini:', error);
    throw new Error(`Failed to insert keyword: ${error.message}`);
  }
};

module.exports = {
  analyzeSEOText,
  insertKeyword
};
