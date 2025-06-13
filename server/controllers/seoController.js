const { analyzeSEOText, insertKeyword } = require('../utils/gemini');

const analyzeText = async (req, res) => {
  try {
    const { text, contentType = 'blog' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    // Validate content type
    const validContentTypes = ['blog', 'tweet', 'caption', 'news', 'other'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const analysis = await analyzeSEOText(text, contentType);
    res.json({
      success: true,
      data: {
        analysis: analysis.analysis,
        keywords: analysis.keywords,
        score: analysis.score,
        originalText: text,
        contentType
      }
    });
  } catch (error) {
    console.error('Error in analyzeText:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze text',
      details: error.message 
    });
  }
};

const addKeyword = async (req, res) => {
  try {
    const { originalText, keyword } = req.body;
    
    if (!originalText || !keyword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both originalText and keyword are required' 
      });
    }

    const updatedText = await insertKeyword(originalText, keyword);
    
    res.json({
      success: true,
      data: {
        updatedText,
        keyword
      }
    });
  } catch (error) {
    console.error('Error in addKeyword:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add keyword',
      details: error.message 
    });
  }
};

module.exports = {
  analyzeText,
  addKeyword
};
