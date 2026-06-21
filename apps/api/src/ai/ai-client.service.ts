import { Injectable, Logger } from '@nestjs/common';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);

  private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private readonly ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

  // Groq free-tier fallback for deployed environments
  private readonly groqApiKey = process.env.GROQ_API_KEY;
  private readonly groqModel = process.env.GROQ_MODEL || 'llama3-8b-8192';

  // Hugging Face fallback
  private readonly hfApiKey = process.env.HF_API_KEY;

  async chat(messages: AiMessage[]): Promise<string> {
    // Try Ollama (local dev) first
    if (await this.isOllamaAvailable()) {
      return this.chatWithOllama(messages);
    }

    // Try Groq (free tier cloud)
    if (this.groqApiKey) {
      return this.chatWithGroq(messages);
    }

    // Fallback: Hugging Face Inference API (free)
    if (this.hfApiKey) {
      return this.chatWithHuggingFace(messages);
    }

    // Final fallback: rule-based response
    this.logger.warn('No AI provider configured — using rule-based fallback');
    return this.ruleBasedFallback(messages);
  }

  private async isOllamaAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async chatWithOllama(messages: AiMessage[]): Promise<string> {
    const res = await fetch(`${this.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        messages,
        stream: false,
        options: { temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.statusText}`);
    }

    const data: any = await res.json();
    return data.message?.content || '';
  }

  private async chatWithGroq(messages: AiMessage[]): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqApiKey}`,
      },
      body: JSON.stringify({
        model: this.groqModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err: any = await res.json();
      throw new Error(`Groq error: ${err.error?.message || res.statusText}`);
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async chatWithHuggingFace(messages: AiMessage[]): Promise<string> {
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hfApiKey}`,
        },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512, temperature: 0.7 } }),
      },
    );

    if (!res.ok) {
      throw new Error(`HuggingFace error: ${res.statusText}`);
    }

    const data: any = await res.json();
    const generated = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!generated) return '';
    // Strip the prompt prefix from the response
    return generated.replace(prompt, '').trim();
  }

  /**
   * Rule-based fallback when no AI provider is configured.
   * Returns structured genre-based playlist queries.
   */
  private ruleBasedFallback(messages: AiMessage[]): string {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

    if (lastUserMsg.includes('workout') || lastUserMsg.includes('gym') || lastUserMsg.includes('exercise')) {
      return JSON.stringify({
        playlistTitle: 'Aura Workout Mix',
        description: 'High-energy tracks to power your training session.',
        searchQueries: ['upbeat gym workout music', 'high energy electronic workout', 'motivational hip hop beats', 'fast tempo running music', 'EDM workout mix']
      });
    }

    if (lastUserMsg.includes('study') || lastUserMsg.includes('focus') || lastUserMsg.includes('coding')) {
      return JSON.stringify({
        playlistTitle: 'Deep Focus Flow',
        description: 'Ambient and lofi tracks for maximum concentration.',
        searchQueries: ['lofi hip hop study beats', 'ambient coding music', 'focus instrumental music', 'Hans Zimmer study music', 'classical piano study']
      });
    }

    if (lastUserMsg.includes('relax') || lastUserMsg.includes('chill') || lastUserMsg.includes('sleep')) {
      return JSON.stringify({
        playlistTitle: 'Aura Relaxation',
        description: 'Soothing sounds to help you unwind.',
        searchQueries: ['relaxing ambient music', 'chill lofi beats', 'sleep meditation music', 'nature sounds relaxing', 'soft piano relaxing music']
      });
    }

    if (lastUserMsg.includes('party') || lastUserMsg.includes('dance') || lastUserMsg.includes('happy')) {
      return JSON.stringify({
        playlistTitle: 'Aura Party Mix',
        description: 'Feel-good beats to get the party started.',
        searchQueries: ['party hits 2024', 'best dance songs', 'upbeat pop party music', 'feel good pop songs', 'EDM party mix']
      });
    }

    // Generic fallback
    return JSON.stringify({
      playlistTitle: 'Aura Daily Mix',
      description: 'A curated selection of great tracks just for you.',
      searchQueries: ['best songs 2024', 'popular hits music', 'feel good music mix', 'chill vibes playlist', 'indie pop hits']
    });
  }
}
