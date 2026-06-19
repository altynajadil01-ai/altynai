import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MiniIllustration } from './FashionIllustration';

type AssistantContext = {
  mood: string;
  season: string;
  gender: string;
  budget: string;
  place: string;
  itemType: string;
  wardrobeColor: string;
  weather: string;
  outfit: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

type AiResponse = {
  text?: string;
  error?: string;
};

function buildAssistantPrompt(context: AssistantContext, question: string) {
  return `Ты AI-ассистент по стилю внутри приложения StyleLab.

Текущий выбор пользователя:
- настроение: ${context.mood}
- сезон: ${context.season}
- пол/посадка: ${context.gender}
- бюджет: ${context.budget}
- город или событие: ${context.place || 'не указано'}
- вещь из гардероба: ${context.itemType}
- цвет вещи: ${context.wardrobeColor}
- погода: ${context.weather}

Последний сгенерированный образ:
${context.outfit}

Вопрос пользователя:
${question}

Ответь коротко, дружелюбно и практично. Если вопрос про одежду, цвета, бренды, погоду или аксессуары, дай конкретный совет.`;
}

function buildFallbackAnswer(context: AssistantContext, question: string) {
  return `Я пока отвечу без AI.

Лучше отталкиваться от вещи "${context.itemType}" цвета "${context.wardrobeColor}". Для спокойного образа добавь нейтральную базу: белый, серый, графитовый, деним или молочный. Если хочется акцент, повтори главный цвет в аксессуаре.

Твой вопрос: "${question}"`;
}

export function StyleAssistant({ context }: { context: AssistantContext }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Привет! Я AI-ассистент StyleLab. Спроси, что поменять в образе, какие цвета добавить или как адаптировать outfit под погоду.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  async function askAssistant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: cleanQuestion }];
    setMessages(nextMessages);
    setQuestion('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<AiResponse>('ai', {
        body: {
          prompt: buildAssistantPrompt(context, cleanQuestion),
          system:
            'Ты добрый fashion AI-ассистент для подросткового outfit generator. Отвечай на русском, кратко, понятно и без сложного жаргона.',
        },
      });

      const answer =
        error || data?.error || !data?.text?.trim()
          ? buildFallbackAnswer(context, cleanQuestion)
          : data.text.trim();

      setMessages([...nextMessages, { role: 'assistant', text: answer }]);
    } catch {
      setMessages([...nextMessages, { role: 'assistant', text: buildFallbackAnswer(context, cleanQuestion) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="assistant-panel" aria-label="AI ассистент">
      <div className="assistant-head">
        <MiniIllustration variant="assistant" />
        <div>
          <h3>AI ассистент</h3>
          <p>Спроси про цвета, бренды, погоду или как улучшить образ.</p>
        </div>
        <span>StyleLab AI</span>
      </div>

      <div className="assistant-chat">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            {message.text}
          </div>
        ))}
      </div>

      <form className="assistant-form" onSubmit={askAssistant}>
        <input
          placeholder="например: сделай образ теплее или подбери аксессуары"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Думаю...' : 'Спросить'}
        </button>
      </form>
    </section>
  );
}
