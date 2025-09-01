// Preferences Service - Manages user preferences like selected AI models

class PreferencesService {
  // Get preferred model for a given AI provider
  getPreferredModel(provider) {
    return localStorage.getItem(`preferred_${provider}_model`) || '';
  }

  // Set preferred model for a given AI provider
  setPreferredModel(provider, model) {
    localStorage.setItem(`preferred_${provider}_model`, model);
  }

  // Get the best model to use for content generation
  getBestModelForProvider(provider, availableModels) {
    const preferred = this.getPreferredModel(provider);

    // If user has a preference and it's available, use it
    if (preferred && availableModels.includes(preferred)) {
      return preferred;
    }

    // Otherwise, auto-select the best default
    if (provider === 'ollama') {
      return availableModels.find(m => m.includes('llama3')) ||
             availableModels.find(m => m.includes('mistral')) ||
             availableModels[0] || '';
    } else if (provider === 'openai') {
      return availableModels.find(m => m.includes('gpt-3.5-turbo')) ||
             availableModels[0] || '';
    }

    return availableModels[0] || '';
  }

  // Get all preferences
  getAllPreferences() {
    return {
      ollama_model: this.getPreferredModel('ollama'),
      openai_model: this.getPreferredModel('openai')
    };
  }

  // Clear all preferences (useful for reset)
  clearAllPreferences() {
    localStorage.removeItem('preferred_ollama_model');
    localStorage.removeItem('preferred_openai_model');
  }
}

// Export singleton instance
export const preferencesService = new PreferencesService();
