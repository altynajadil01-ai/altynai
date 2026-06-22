import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ProfileForm = {
  displayName: string;
  city: string;
  favoriteStyle: string;
  budget: string;
  sizes: string;
  favoriteColors: string[];
  preferredBrands: string;
  avoidDresses: boolean;
};

type ProfileRow = {
  display_name: string;
  city: string;
  favorite_style: string;
  budget: string;
  sizes: string;
  favorite_colors: string[];
  preferred_brands?: string[];
  avoid_dresses?: boolean;
};

type BaseProfilePayload = {
  user_id: string;
  display_name: string;
  city: string;
  favorite_style: string;
  budget: string;
  sizes: string;
  favorite_colors: string[];
  updated_at: string;
};

function isMissingPreferenceColumn(errorMessage: string) {
  return errorMessage.includes('preferred_brands') || errorMessage.includes('avoid_dresses');
}

const styleOptions = ['спокойный', 'уличный', 'элегантный', 'спортивный', 'винтажный', 'минимализм'];
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

const emptyProfile: ProfileForm = {
  displayName: '',
  city: '',
  favoriteStyle: styleOptions[0],
  budget: budgetOptions[1],
  sizes: '',
  favoriteColors: [],
  preferredBrands: '',
  avoidDresses: false,
};

function rowToForm(row: ProfileRow): ProfileForm {
  return {
    displayName: row.display_name,
    city: row.city,
    favoriteStyle: row.favorite_style || styleOptions[0],
    budget: row.budget || budgetOptions[1],
    sizes: row.sizes,
    favoriteColors: row.favorite_colors ?? [],
    preferredBrands: (row.preferred_brands ?? []).join(', '),
    avoidDresses: row.avoid_dresses ?? false,
  };
}

export function Profile({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setMessage('');

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, city, favorite_style, budget, sizes, favorite_colors, preferred_brands, avoid_dresses')
        .eq('user_id', userId)
        .maybeSingle<ProfileRow>();

      if (error && isMissingPreferenceColumn(error.message)) {
        const { data: baseData, error: baseError } = await supabase
          .from('profiles')
          .select('display_name, city, favorite_style, budget, sizes, favorite_colors')
          .eq('user_id', userId)
          .maybeSingle<ProfileRow>();

        if (baseError) {
          setMessage('РџСЂРѕС„РёР»СЊ РїРѕРєР° РЅРµ Р·Р°РіСЂСѓР¶РµРЅ. Р•СЃР»Рё С‚Р°Р±Р»РёС†С‹ РµС‰Рµ РЅРµС‚, РїСЂРёРјРµРЅРёС‚Рµ РјРёРіСЂР°С†РёРё.');
        } else if (baseData) {
          setForm(rowToForm(baseData));
        }
      } else if (error) {
        setMessage('Профиль пока не загружен. Если таблицы еще нет, примените миграции.');
      } else if (data) {
        setForm(rowToForm(data));
      }

      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  function updateField(field: keyof Omit<ProfileForm, 'favoriteColors' | 'avoidDresses'>, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAvoidDresses(value: boolean) {
    setForm((current) => ({ ...current, avoidDresses: value }));
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

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const basePayload: BaseProfilePayload = {
      user_id: userId,
      display_name: form.displayName.trim(),
      city: form.city.trim(),
      favorite_style: form.favoriteStyle,
      budget: form.budget,
      sizes: form.sizes.trim(),
      favorite_colors: form.favoriteColors,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert({
      ...basePayload,
      preferred_brands: form.preferredBrands
        .split(',')
        .map((brand) => brand.trim())
        .filter(Boolean),
      avoid_dresses: form.avoidDresses,
    });

    if (error && isMissingPreferenceColumn(error.message)) {
      const { error: baseError } = await supabase.from('profiles').upsert(basePayload);
      setMessage(baseError ? baseError.message : 'РџСЂРѕС„РёР»СЊ СЃРѕС…СЂР°РЅРµРЅ.');
      setSaving(false);
      return;
    }

    setMessage(error ? error.message : 'Профиль сохранен.');
    setSaving(false);
  }

  return (
    <section className="profile-page">
      <div className="hero-band">
        <div className="intro">
          <p className="hello">{userEmail}</p>
          <h2>Профиль</h2>
          <p>Заполни любимый стиль, город, бюджет и цвета. Потом эти данные можно использовать для более точных образов.</p>
        </div>
        <img className="today-hero-photo" src="/profile-city-print.jpg" alt="Городской fashion-коллаж для профиля стиля" />
      </div>

      <form className="profile-panel" onSubmit={saveProfile}>
        <label>
          Имя
          <input
            placeholder="например: Алина"
            value={form.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
          />
        </label>

        <label>
          Город
          <input
            placeholder="например: Алматы"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
          />
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

        <label className="wide">
          Размеры и заметки
          <input
            placeholder="например: oversize, обувь 38, люблю свободную посадку"
            value={form.sizes}
            onChange={(e) => updateField('sizes', e.target.value)}
          />
        </label>

        <label className="wide">
          Любимые бренды
          <input
            placeholder="например: Zara, Mango, COS"
            value={form.preferredBrands}
            onChange={(e) => updateField('preferredBrands', e.target.value)}
          />
        </label>

        <label className="wide filter-check inline">
          <input checked={form.avoidDresses} onChange={(e) => updateAvoidDresses(e.target.checked)} type="checkbox" />
          Не предлагать платья в генераторе
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

        <button className="wide" type="submit" disabled={saving || loading}>
          {saving ? 'Сохраняю...' : 'Сохранить профиль'}
        </button>

        {message && <p className="message">{message}</p>}
      </form>
    </section>
  );
}
