import { useState } from 'react';
import axios from 'axios';

// Icons (we'll use text symbols as fallback since we removed @heroicons/react)
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M18 12l-4 4-2-2-6 6M3.27 12.96l8.73 2.09 1.64-6.8-6.82-1.63z" />
  </svg>
);

const ArrowPathIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const DocumentCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

// In production, we use relative URLs that will be proxied by Vercel
// In development, we use the full URL to the local server
const isProduction = import.meta.env.PROD;
const API_URL = isProduction 
  ? '/api/seo'  // This will be relative to the current domain
  : 'http://localhost:5000/api/seo';

console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`API URL: ${API_URL}`);

function App() {
  const [text, setText] = useState('');
  const [contentType, setContentType] = useState('blog'); // 'blog', 'tweet', 'caption', 'news', 'other'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('input'); // 'input' or 'preview'

  const contentTypes = [
    { value: 'blog', label: 'Blog Post' },
    { value: 'tweet', label: 'Tweet' },
    { value: 'caption', label: 'Social Media Caption' },
    { value: 'news', label: 'News Article' },
    { value: 'other', label: 'Other' }
  ];

  const getContentTypeLabel = (type) => {
    const typeMap = {
      blog: 'Blog Post',
      tweet: 'Tweet',
      caption: 'Social Media Caption',
      news: 'News Article',
      other: 'Content'
    };
    return typeMap[type] || 'Content';
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      blog: '📝',
      tweet: '🐦',
      caption: '📱',
      news: '📰',
      other: '📄'
    };
    return icons[type] || '📄';
  };

  const renderContentSpecificAnalysis = (contentType) => {
    const tips = {
      blog: [
        'Check for proper heading structure (H1, H2, H3)',
        'Ensure good paragraph length (3-4 sentences)',
        'Include internal and external links',
        'Add relevant images with alt text'
      ],
      tweet: [
        'Keep it under 240 characters for best engagement',
        'Use 1-2 relevant hashtags',
        'Include a call-to-action',
        'Consider adding a question to boost engagement'
      ],
      caption: [
        'Keep it concise and engaging',
        'Use relevant hashtags (3-5 recommended)',
        'Include emojis for better engagement',
        'Add a clear call-to-action'
      ],
      news: [
        'Use the inverted pyramid structure',
        'Include the 5 Ws in the first paragraph',
        'Keep sentences short and factual',
        'Include quotes from relevant sources'
      ],
      other: [
        'Ensure clear and concise language',
        'Use proper formatting and structure',
        'Include relevant keywords naturally',
        'Make sure the content serves its purpose'
      ]
    };

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">
          {getContentTypeIcon(contentType)} {getContentTypeLabel(contentType)} Tips:
        </h4>
        <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
          {tips[contentType]?.map((tip, index) => (
            <li key={index}>{tip}</li>
          )) || tips.other.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    );
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    try {
      console.log('Sending request to:', API_URL + '/analyze');
      console.log('Request payload:', { text, contentType });
      
      const response = await axios({
        method: 'post',
        url: `${API_URL}/analyze`,
        data: { text, contentType },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      console.log('API Response Data:', response.data);
      
      if (response.status !== 200) {
        throw new Error(`Server returned ${response.status} status`);
      }
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Handle both response formats: { data: {...} } and direct data
      const responseData = response.data.data || response.data;
      
      if (!responseData) {
        throw new Error('Invalid response format: missing data');
      }
      
      const analysisData = {
        ...responseData,
        score: Number(responseData.score) || 0,
        originalText: responseData.originalText || text, // Fallback to original text
        contentType: responseData.contentType || contentType
      };
      
      console.log('Processed analysis data:', analysisData);
      setAnalysis(analysisData);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error analyzing text:', {
        name: err.name,
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : 'No response',
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      
      let errorMessage = 'Failed to analyze text. ';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try again.';
      } else if (err.response) {
        // Server responded with an error status code
        const { status, data } = err.response;
        if (status === 400) {
          errorMessage = data.error || 'Invalid request. Please check your input.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Error: ${status} - ${data?.error || 'Unknown error'}`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsertKeyword = async (keyword) => {
    if (!analysis) return;
    
    setIsUpdating(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/add-keyword`, {
        originalText: analysis.originalText,
        keyword
      });
      
      if (response.data && response.data.success) {
        setAnalysis(prev => ({
          ...prev,
          originalText: response.data.data.updatedText
        }));
      } else {
        throw new Error(response.data?.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error adding keyword:', err);
      // Extract the error message from the server response if available
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to insert keyword. Please try again.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-very-good';
    if (score >= 70) return 'score-good';
    if (score >= 60) return 'score-fair';
    return 'score-poor';
  };

  const getScoreDescription = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const resetForm = () => {
    setText('');
    setAnalysis(null);
    setError('');
    setActiveTab('input');
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="text-center mb-6">
          <h1>SEO Content Optimizer</h1>
          <p className="text-gray-600">
            Paste your content below and get AI-powered SEO suggestions
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!analysis ? (
          <div className="card">
            <div className="p-6">
              <div className="form-group mb-4">
                <label htmlFor="content-type" className="block text-sm mb-1">
                  Content Type
                </label>
                <select
                  id="content-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="select"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="content" className="block text-sm mb-1">
                  Your Content
                </label>
                <div className="mt-1">
                  <textarea
                    id="content"
                    rows={12}
                    className="textarea"
                    placeholder={
                      contentType === 'tweet' 
                        ? 'Paste your tweet... (Max 280 characters)' 
                        : contentType === 'caption'
                        ? 'Paste your social media caption...'
                        : contentType === 'news'
                        ? 'Paste your news article...'
                        : 'Paste your content to analyze...'
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={contentType === 'tweet' ? 280 : undefined}
                  />
                  {contentType === 'tweet' && (
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {text.length}/280 characters
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={analyzeText}
                  disabled={isAnalyzing || !text.trim()}
                  className={`btn btn-primary ${(isAnalyzing || !text.trim()) ? 'opacity-70' : ''}`}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin mr-2"><ArrowPathIcon /></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2"><SparklesIcon /></span>
                      Analyze Content
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="tabs">
              <button
                onClick={() => setActiveTab('preview')}
                className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              >
                SEO Analysis
              </button>
              <button
                onClick={() => setActiveTab('keywords')}
                className={`tab ${activeTab === 'keywords' ? 'active' : ''}`}
              >
                Suggested Keywords
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'preview' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2>Content Preview</h2>
                    <div className="flex" style={{ gap: '0.75rem' }}>
                      <button
                        onClick={resetForm}
                        className="btn btn-outline flex items-center"
                      >
                        <span style={{ marginRight: '0.5rem' }}><ArrowPathIcon /></span>
                        New Analysis
                      </button>
                    </div>
                  </div>
                  
                  <div className="content-preview">
                    <h3>Original Content</h3>
                    <div className="prose">
                      {analysis.originalText.split('\n').map((paragraph, i) => (
                        <p key={i} style={{ marginBottom: '1rem' }}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  <div className="seo-analysis">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {getContentTypeIcon(analysis.contentType || 'other')} {getContentTypeLabel(analysis.contentType || 'other')} Analysis
                        </h3>
                        {analysis.contentType === 'tweet' && (
                          <p className="text-sm text-gray-500 mt-1">
                            Character count: {analysis.originalText?.length || 0}/280
                          </p>
                        )}
                      </div>
                      {analysis.score !== undefined && !isNaN(analysis.score) && (
                        <div className="seo-score-container">
                          <div className={`seo-score ${getScoreClass(analysis.score)}`}>
                            {Math.round(analysis.score)}/100
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-500">
                            {getScoreDescription(analysis.score)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="analysis-content bg-white p-4 rounded-lg border border-gray-100">
                      {analysis.analysis ? (
                        <div className="space-y-4">
                          <div className="prose max-w-none">
                            <p className="whitespace-pre-line text-gray-700">{analysis.analysis}</p>
                          </div>
                          
                          {/* Content Specific Tips */}
                          {renderContentSpecificAnalysis(analysis.contentType || 'other')}
                          
                          {/* Score Breakdown (if available) */}
                          {analysis.scoreBreakdown && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Score Breakdown</h4>
                              <div className="space-y-2">
                                {Object.entries(analysis.scoreBreakdown).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="font-medium">{value}/100</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No analysis available. Please try again.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'keywords' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Suggested Keywords</h2>
                    <button
                      onClick={resetForm}
                      className="btn btn-outline btn-sm"
                    >
                      <span className="mr-1"><ArrowPathIcon /></span>
                      New Analysis
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysis.keywords?.filter(kw => kw.keyword).map((kw, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50">
                        <span className="font-medium text-gray-800">{kw.keyword}</span>
                        <button
                          onClick={() => handleInsertKeyword(kw.keyword)}
                          disabled={isUpdating}
                          className="btn btn-sm btn-outline"
                        >
                          {isUpdating ? '...' : 'Insert'}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {!analysis.keywords?.filter(kw => kw.keyword).length && (
                    <div className="text-center py-6 text-gray-500">
                      No keywords found. Try analyzing different content.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} SEO Content Optimizer. Powered by Gemini AI.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
