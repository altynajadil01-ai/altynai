import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AppRatingProps = {
  userId: string;
};

type SavedRating = {
  rating: number;
  feedback: string;
};

const ratingLabels = ['Очень слабо', 'Можно лучше', 'Нормально', 'Классно', 'Супер'];

export function AppRating({ userId }: AppRatingProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadRating() {
      setLoading(true);

      const { data, error } = await supabase
        .from('app_ratings')
        .select('rating, feedback')
        .eq('user_id', userId)
        .maybeSingle<SavedRating>();

      if (error) {
        setMessage('Не получилось загрузить оценку.');
      }

      if (data) {
        setRating(data.rating);
        setFeedback(data.feedback);
      }

      setLoading(false);
    }

    void loadRating();
  }, [userId]);

  async function saveRating() {
    if (!rating) {
      setMessage('Выбери оценку от 1 до 5.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('app_ratings').upsert(
      {
        user_id: userId,
        rating,
        feedback: feedback.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      setMessage('Не получилось сохранить оценку. Попробуй еще раз.');
    } else {
      setMessage('Спасибо! Оценка сохранена.');
    }

    setSaving(false);
  }

  return (
    <section className="card rating-panel" aria-label="Оценка приложения">
      <div className="rating-head">
        <p>Твое мнение</p>
        <h2>Оцени StyleLab</h2>
        <span>{rating ? ratingLabels[rating - 1] : 'Выбери звезды'}</span>
      </div>

      <div className="rating-stars" role="radiogroup" aria-label="Оценка от 1 до 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            aria-checked={rating === value}
            aria-label={`${value} из 5`}
            className={value <= rating ? 'active' : ''}
            disabled={loading || saving}
            key={value}
            onClick={() => setRating(value)}
            role="radio"
            type="button"
          >
            ★
          </button>
        ))}
      </div>

      <label className="rating-feedback">
        Что можно улучшить?
        <textarea
          maxLength={500}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Напиши короткий отзыв..."
          value={feedback}
        />
      </label>

      <div className="rating-actions">
        <button disabled={loading || saving} onClick={saveRating} type="button">
          {saving ? 'Сохраняем...' : 'Отправить оценку'}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </section>
  );
}
