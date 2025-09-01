import React, { useState } from 'react';
import {
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Key,
  Server,
  Zap,
  Download,
  Monitor,
  Globe
} from 'lucide-react';

const AISettings = ({ aiModels, aiStatus, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedOllamaModel, setSelectedOllamaModel] = useState('');
  const [selectedOpenAIModel, setSelectedOpenAIModel] = useState('');

  // Load saved model preferences on component mount
  React.useEffect(() => {
    const ollamaModel = localStorage.getItem('preferred_ollama_model') || '';
    const openaiModel = localStorage.getItem('preferred_openai_model') || '';
    setSelectedOllamaModel(ollamaModel);
    setSelectedOpenAIModel(openaiModel);
  }, []);

  // Auto-select best default models when models are loaded
  React.useEffect(() => {
    // Auto-select Ollama model if none selected and models available
    if (!selectedOllamaModel && aiModels.ollama?.length > 0) {
      const defaultModel = aiModels.ollama.find(m => m.includes('llama3')) ||
                          aiModels.ollama.find(m => m.includes('mistral')) ||
                          aiModels.ollama[0];
      setSelectedOllamaModel(defaultModel);
      localStorage.setItem('preferred_ollama_model', defaultModel);
    }

    // Auto-select OpenAI model if none selected and models available
    if (!selectedOpenAIModel && aiModels.openai?.length > 0) {
      const defaultModel = aiModels.openai.find(m => m.includes('gpt-3.5-turbo')) ||
                          aiModels.openai[0];
      setSelectedOpenAIModel(defaultModel);
      localStorage.setItem('preferred_openai_model', defaultModel);
    }
  }, [aiModels, selectedOllamaModel, selectedOpenAIModel]);

  const handleOllamaModelChange = (model) => {
    setSelectedOllamaModel(model);
    localStorage.setItem('preferred_ollama_model', model);
  };

  const handleOpenAIModelChange = (model) => {
    setSelectedOpenAIModel(model);
    localStorage.setItem('preferred_openai_model', model);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd save this securely
    localStorage.setItem('openai_api_key', apiKey);
    setApiKey('');
    setShowApiKeyForm(false);
    handleRefresh();
  };

  const StatusIndicator = ({ status, label }) => {
    const getStatusIcon = () => {
      if (status === true) {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      } else if (status === false) {
        return <XCircle className="w-5 h-5 text-red-500" />;
      } else {
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      }
    };

    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Settings</h1>
            <p className="text-gray-600">Configure your AI providers and models</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <StatusIndicator
                status={aiStatus.ollama_available}
                label="Ollama (Local AI)"
              />
              <StatusIndicator
                status={aiStatus.openai_available}
                label="OpenAI API"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Quick Status</h3>
              {aiStatus.ollama_available || aiStatus.openai_available ? (
                <p className="text-green-700 text-sm">
                  ✅ AI services are ready for content generation
                </p>
              ) : (
                <p className="text-red-700 text-sm">
                  ❌ No AI services available. Configure at least one provider.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ollama Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ollama (Local AI)</h2>
              <p className="text-gray-600">Run AI models locally on your machine</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Model Selection</h3>
              {aiModels.ollama?.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Preferred Model for Content Generation
                    </label>
                    <select
                      value={selectedOllamaModel}
                      onChange={(e) => handleOllamaModelChange(e.target.value)}
                      className="w-full input text-sm font-medium border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Auto-select best model</option>
                      {aiModels.ollama.map((model, index) => (
                        <option key={index} value={model}>
                          {model}
                          {model.includes('llama3') ? ' (Recommended)' :
                           model.includes('mistral') ? ' (Fast)' :
                           model.includes('codellama') ? ' (Code)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedOllamaModel && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-bold text-green-800">
                          ✓ Currently Using: <span className="font-bold">{selectedOllamaModel}</span>
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          This model will be used for all content generation
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Models ({aiModels.ollama.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {aiModels.ollama.map((model, index) => (
                        <div key={index} className={`flex items-center justify-between text-xs p-2 rounded ${
                          selectedOllamaModel === model ? 'bg-green-100 border border-green-300' : 'bg-white'
                        }`}>
                          <span className={`font-mono ${
                            selectedOllamaModel === model ? 'text-green-800 font-bold' : 'text-gray-600'
                          }`}>{model}</span>
                          {selectedOllamaModel === model && (
                            <span className="text-green-700 font-bold">✓ Selected</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Popular Models to Try</h4>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div>• <code className="bg-blue-100 px-1 rounded">ollama pull llama3</code> - Best overall (Recommended)</div>
                      <div>• <code className="bg-blue-100 px-1 rounded">ollama pull mistral</code> - Fast and efficient</div>
                      <div>• <code className="bg-blue-100 px-1 rounded">ollama pull codellama</code> - Code generation</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm mb-2">No models found</p>
                  {aiStatus.ollama_available && (
                    <div className="text-xs text-gray-600">
                      <p>Install your first model:</p>
                      <code className="bg-gray-100 px-2 py-1 rounded">ollama pull llama3</code>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Status & Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Service Status</span>
                  <span className={`text-sm font-bold ${
                    aiStatus.ollama_available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {aiStatus.ollama_available ? 'Running' : 'Not Available'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Available Models</span>
                  <span className="text-sm text-gray-600 font-medium">
                    {aiModels.ollama?.length || 0} models
                  </span>
                </div>

                {!aiStatus.ollama_available && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Setup Instructions</h4>
                    <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                      <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ollama.ai</a></li>
                      <li>Run: <code className="bg-yellow-100 px-1 rounded">ollama pull llama3</code></li>
                      <li>Start the service: <code className="bg-yellow-100 px-1 rounded">ollama serve</code></li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* OpenAI Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">OpenAI</h2>
              <p className="text-gray-600">Access GPT models via OpenAI API</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Model Selection</h3>
              {aiStatus.openai_available && aiModels.openai?.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Preferred Model for Content Generation
                    </label>
                    <select
                      value={selectedOpenAIModel}
                      onChange={(e) => handleOpenAIModelChange(e.target.value)}
                      className="w-full input text-sm font-medium border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Auto-select best model</option>
                      {aiModels.openai.map((model, index) => (
                        <option key={index} value={model}>
                          {model}
                          {model.includes('gpt-3.5-turbo') ? ' (Fast & Affordable)' :
                           model.includes('gpt-4') ? ' (Most Capable)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedOpenAIModel && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-bold text-green-800">
                          ✓ Currently Using: <span className="font-bold">{selectedOpenAIModel}</span>
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          This model will be used for all content generation
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Models ({aiModels.openai.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {aiModels.openai.map((model, index) => (
                        <div key={index} className={`flex items-center justify-between text-xs p-2 rounded ${
                          selectedOpenAIModel === model ? 'bg-green-100 border border-green-300' : 'bg-white'
                        }`}>
                          <span className={`font-mono ${
                            selectedOpenAIModel === model ? 'text-green-800 font-bold' : 'text-gray-600'
                          }`}>{model}</span>
                          {selectedOpenAIModel === model && (
                            <span className="text-green-700 font-bold">✓ Selected</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Configure API key to see models</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Configuration & Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">API Status</span>
                  <span className={`text-sm font-bold ${
                    aiStatus.openai_available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {aiStatus.openai_available ? 'Connected' : 'Not Configured'}
                  </span>
                </div>

                {!aiStatus.openai_available && (
                  <div className="space-y-3">
                    {!showApiKeyForm ? (
                      <button
                        onClick={() => setShowApiKeyForm(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Add OpenAI API Key
                      </button>
                    ) : (
                      <form onSubmit={handleApiKeySubmit} className="space-y-3">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="w-full input"
                          required
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary text-sm">
                            Save Key
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowApiKeyForm(false)}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="text-xs text-gray-500">
                      <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a></p>
                      <p className="mt-1">⚠️ Your API key is stored locally and never shared</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Usage Tips</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Ollama (Local)</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Free to use with no API costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Privacy-focused (runs locally)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>May be slower on older hardware</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Requires initial model download</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">OpenAI</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>High-quality responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Fast response times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Requires API key and credits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Internet connection required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
