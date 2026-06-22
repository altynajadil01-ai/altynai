import { useState } from 'react';
import { supabase } from '../lib/supabase';

type OnboardingForm = {
  displayName: string;
  city: string;
  favoriteStyle: string;
  budget: string;
  favoriteColors: string[];
};

const styleOptions = ['спокойное', 'уличное', 'элегантное', 'спортивное', 'винтажное', 'минималистичное'];
const budgetOptions = ['эконом', 'средний', 'премиум'];
const colorOptions = [
  { name: 'черный', hex: '#171717' },
  { name: 'белый', hex: '#ffffff' },
  { name: 'серый', hex: '#8f9499' },
  { name: 'светло-серый', hex: '#d7dde5' },
  { name: 'графитовый', hex: '#232832' },
  { name: 'бежевый', hex: '#d8c7ad' },
  { name: 'молочный', hex: '#f4efe7' },
  { name: 'коричневый', hex: '#6a4a35' },
  { name: 'хаки', hex: '#6f7652' },
  { name: 'красный', hex: '#b83b3b' },
  { name: 'оранжевый', hex: '#d98245' },
  { name: 'желтый', hex: '#efd96f' },
  { name: 'зеленый', hex: '#4f7d57' },
  { name: 'голубой', hex: '#86b6d9' },
  { name: 'синий', hex: '#2457a6' },
  { name: 'пудрово-розовый', hex: '#f0a9bd' },
  { name: 'розовый', hex: '#e6a6b8' },
  { name: 'бордовый', hex: '#6f1836' },
  { name: 'сливовый', hex: '#8b6f2f' },
  { name: 'винный', hex: '#c95f82' },
  { name: 'чернильный', hex: '#243b5a' },
  { name: 'серый шалфей', hex: '#7b8fa3' },
  { name: 'деним', hex: '#3f6f9f' },
  { name: 'нежно-розовый', hex: '#f6cfdc' },
];

const emptyForm: OnboardingForm = {
  displayName: '',
  city: '',
  favoriteStyle: styleOptions[0],
  budget: budgetOptions[1],
  favoriteColors: [],
};

export function Onboarding({ onComplete, userId }: { onComplete: () => void; userId: string }) {
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(field: keyof Omit<OnboardingForm, 'favoriteColors'>, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleColor(color: string) {
    setForm((current) => {
      const hasColor = current.favoriteColors.includes(color);
      return {
        ...current,
        favoriteColors: hasColor
          ? current.favoriteColors.filter((item) => item !== color)
          : [...current.favoriteColors, color],
      };
    });
  }

  async function saveOnboarding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.city.trim()) {
      setMessage('Укажи город, чтобы подбор на сегодня учитывал погоду.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('profiles').upsert({
      user_id: userId,
      display_name: form.displayName.trim(),
      city: form.city.trim(),
      favorite_style: form.favoriteStyle,
      budget: form.budget,
      sizes: '',
      favorite_colors: form.favoriteColors,
      updated_at: new Date().toISOString(),
    });

    if (error) setMessage(error.message);
    else onComplete();

    setSaving(false);
  }

  return (
    <section className="onboarding-page">
      <div className="onboarding-hero">
        <p className="hello">Быстрая настройка</p>
        <h2>Соберем StyleLab под тебя</h2>
        <p>Ответь на пару вопросов, и подборы будут учитывать город, бюджет, стиль и любимые цвета.</p>
      </div>

      <form className="profile-panel" onSubmit={saveOnboarding}>
        <label>
          Имя
          <input placeholder="например: Алина" value={form.displayName} onChange={(e) => updateField('displayName', e.target.value)} />
        </label>

        <label>
          Город
          <input placeholder="например: Алматы" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
        </label>

        <label>
          Любимый стиль
          <select value={form.favoriteStyle} onChange={(e) => updateField('favoriteStyle', e.target.value)}>
            {styleOptions.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </label>

        <label>
          Бюджет
          <select value={form.budget} onChange={(e) => updateField('budget', e.target.value)}>
            {budgetOptions.map((budget) => (
              <option key={budget}>{budget}</option>
            ))}
          </select>
        </label>

        <div className="wide profile-colors">
          <p>Любимые цвета</p>
          <div className="profile-color-grid">
            {colorOptions.map((color) => (
              <button
                className={form.favoriteColors.includes(color.name) ? 'profile-color active' : 'profile-color'}
                key={color.name}
                onClick={() => toggleColor(color.name)}
                type="button"
              >
                <span style={{ backgroundColor: color.hex }} />
                {color.name}
              </button>
            ))}
          </div>
        </div>

        <button className="wide" type="submit" disabled={saving}>
          {saving ? 'Сохраняю...' : 'Начать подбор'}
        </button>
        {message && <p className="message">{message}</p>}
      </form>
    </section>
  );
}
