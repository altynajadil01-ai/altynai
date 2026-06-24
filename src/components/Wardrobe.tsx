import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { WardrobePick } from '../App';

type WardrobeItem = {
  id: string;
  name: string;
  item_type: string;
  color: string;
  season: string;
  photo_path: string;
  notes: string;
  is_favorite: boolean;
  created_at: string;
};

type WardrobeForm = {
  name: string;
  itemType: string;
  color: string;
  season: string;
  notes: string;
};

const itemTypes = ['футболка', 'рубашка', 'худи', 'свитер', 'жакет', 'куртка', 'джинсы', 'брюки', 'юбка', 'платье', 'кроссовки', 'ботинки', 'сумка', 'аксессуар'];
const seasons = ['всесезон', 'весна', 'лето', 'осень', 'зима'];
const colors = [
  'черный',
  'белый',
  'серый',
  'светло-серый',
  'графитовый',
  'бежевый',
  'молочный',
  'коричневый',
  'хаки',
  'синий деним',
  'темно-синий',
  'бордовый',
  'сливовый',
  'винный',
  'красный',
  'оранжевый',
  'желтый',
  'зеленый',
  'голубой',
  'синий',
  'пудрово-розовый',
  'розовый',
  'холодный мятный',
  'серый шалфей',
  'нежно-розовый',
  'чернильный',
  'стальной синий',
];

const colorHexByName: Record<string, string> = {
  черный: '#171717',
  белый: '#ffffff',
  серый: '#8f9499',
  'светло-серый': '#d7dde5',
  графитовый: '#232832',
  бежевый: '#d8c7ad',
  молочный: '#f4efe7',
  коричневый: '#6a4a35',
  хаки: '#6f7652',
  'синий деним': '#3f6f9f',
  'темно-синий': '#1f365c',
  бордовый: '#6f1836',
  сливовый: '#8b6f2f',
  винный: '#c95f82',
  красный: '#b83b3b',
  оранжевый: '#d98245',
  желтый: '#efd96f',
  зеленый: '#4f7d57',
  голубой: '#86b6d9',
  синий: '#2457a6',
  'пудрово-розовый': '#f0a9bd',
  розовый: '#e6a6b8',
  'холодный мятный': '#6f8f9f',
  'серый шалфей': '#7b8fa3',
  'нежно-розовый': '#f6cfdc',
  чернильный: '#243b5a',
  'стальной синий': '#5f6f86',
};

function getColorHex(color: string) {
  return colorHexByName[color] ?? '#d7dde5';
}

const emptyForm: WardrobeForm = {
  name: '',
  itemType: itemTypes[0],
  color: colors[0],
  season: seasons[0],
  notes: '',
};

export function Wardrobe({ userId, onUseItem }: { userId: string; onUseItem: (item: WardrobePick) => void }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [form, setForm] = useState<WardrobeForm>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadItems() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('id, name, item_type, color, season, photo_path, notes, is_favorite, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Гардероб пока не загрузился. Примените новую миграцию через npm run db:push.');
      setItems([]);
    } else {
      setItems(data ?? []);
      await loadPhotoUrls(data ?? []);
    }

    setLoading(false);
  }

  async function loadPhotoUrls(nextItems: WardrobeItem[]) {
    const paths = nextItems.filter((item) => item.photo_path).map((item) => item.photo_path);
    if (paths.length === 0) {
      setPhotoUrls({});
      return;
    }

    const entries = await Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage.from('wardrobe-photos').createSignedUrl(path, 3600);
        return [path, data?.signedUrl ?? ''] as const;
      }),
    );

    setPhotoUrls(Object.fromEntries(entries.filter(([, url]) => url)));
  }

  useEffect(() => {
    loadItems();
  }, [userId]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'favorites') return items.filter((item) => item.is_favorite);
    return items.filter((item) => item.item_type === filter || item.season === filter);
  }, [filter, items]);

  const wardrobeStats = useMemo(() => {
    const withPhoto = items.filter((item) => item.photo_path).length;
    const favorites = items.filter((item) => item.is_favorite).length;
    const seasonsCount = new Set(items.map((item) => item.season)).size;
    const mostUsedType = itemTypes
      .map((type) => ({ type, count: items.filter((item) => item.item_type === type).length }))
      .sort((a, b) => b.count - a.count)[0];

    return {
      withPhoto,
      favorites,
      seasonsCount,
      mostUsedType: mostUsedType?.count ? mostUsedType.type : 'пока нет',
    };
  }, [items]);

  function updateField(field: keyof WardrobeForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = `${form.itemType} ${form.color} ${form.season}`;

    setSaving(true);
    setMessage('');

    let photoPath = '';
    if (photoFile) {
      const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      photoPath = `${userId}/wardrobe-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('wardrobe-photos').upload(photoPath, photoFile, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        setMessage(`Фото не загрузилось: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from('wardrobe_items').insert({
      user_id: userId,
      name,
      item_type: form.itemType,
      color: form.color,
      season: form.season,
      photo_path: photoPath,
      notes: form.notes.trim(),
      is_favorite: false,
    });

    if (error) setMessage(error.message);
    else {
      setForm(emptyForm);
      setPhotoFile(null);
      setPhotoPreviewUrl('');
      setMessage('Вещь добавлена в гардероб.');
      await loadItems();
    }

    setSaving(false);
  }

  async function removeItem(item: WardrobeItem) {
    const { error } = await supabase.from('wardrobe_items').delete().eq('id', item.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    if (item.photo_path) await supabase.storage.from('wardrobe-photos').remove([item.photo_path]);
    await loadItems();
  }

  async function toggleFavorite(item: WardrobeItem) {
    const { error } = await supabase
      .from('wardrobe_items')
      .update({ is_favorite: !item.is_favorite })
      .eq('id', item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((current) =>
      current.map((nextItem) => (nextItem.id === item.id ? { ...nextItem, is_favorite: !item.is_favorite } : nextItem)),
    );
  }

  function useItem(item: WardrobeItem) {
    onUseItem({
      id: item.id,
      name: item.name,
      item_type: item.item_type,
      color: item.color,
      season: item.season,
      notes: item.notes,
    });
  }

  return (
    <section className="wardrobe-page">
      <div className="hero-band wardrobe-hero">
        <div className="intro">
          <p className="hello">Мой гардероб</p>
          <h2>
            Вещи, из которых собираются образы
          </h2>
          <p>Добавляй одежду, обувь и аксессуары. Генератор сможет опираться на реальные вещи, а не только на общий стиль.</p>
        </div>
        <img className="today-hero-photo wardrobe-hero-photo" src="/wardrobe-closet.jpg" alt="Гардероб с обувью, сумками и одеждой" />
      </div>

      <form className="wardrobe-panel" onSubmit={addItem}>
        <label>
          Тип
          <select value={form.itemType} onChange={(e) => updateField('itemType', e.target.value)}>
            {itemTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Цвет
          <div className="color-select-row">
            <select value={form.color} onChange={(e) => updateField('color', e.target.value)}>
              {colors.map((color) => (
                <option key={color}>{color}</option>
              ))}
            </select>
            <span className="color-preview-dot" style={{ backgroundColor: getColorHex(form.color) }} aria-hidden="true" />
          </div>
        </label>

        <label>
          Сезон
          <select value={form.season} onChange={(e) => updateField('season', e.target.value)}>
            {seasons.map((season) => (
              <option key={season}>{season}</option>
            ))}
          </select>
        </label>

        <label>
          Фото
          <input accept="image/*" type="file" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        </label>

        <div className="wardrobe-upload-preview">
          {photoPreviewUrl ? (
            <img alt="Превью вещи перед добавлением" src={photoPreviewUrl} />
          ) : (
            <div className="wardrobe-photo-placeholder">фото</div>
          )}
          <div>
            <strong>{photoFile ? photoFile.name : 'Фото вещи'}</strong>
            <p>{photoFile ? 'Так карточка будет выглядеть в гардеробе.' : 'Добавь снимок, чтобы генератору было проще опираться на реальные вещи.'}</p>
          </div>
        </div>

        <label>
          Дополнительные желания
          <input placeholder="например: oversize, теплая, для школы" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
        </label>

        <button className="wide" type="submit" disabled={saving}>
          {saving ? 'Добавляю...' : 'Добавить вещь'}
        </button>
        {message && <p className="message">{message}</p>}
      </form>

      <div className="wardrobe-toolbar">
        <div className="toolbar-title">
          <img className="toolbar-photo wardrobe-count-photo" src="/wardrobe-count-shoes.jpeg" alt="Fashion-иллюстрация туфель" />
          <strong>{items.length} вещей</strong>
        </div>
        <div className="wardrobe-stats" aria-label="Статистика гардероба">
          <span>{wardrobeStats.withPhoto} с фото</span>
          <span>{wardrobeStats.favorites} любимых</span>
          <span>{wardrobeStats.seasonsCount} сезонов</span>
          <span>{wardrobeStats.mostUsedType}</span>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Все</option>
          <option value="favorites">Избранные</option>
          {seasons.map((season) => (
            <option key={season} value={season}>{season}</option>
          ))}
          {itemTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="empty">Загрузка...</p>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="editorial-thumb empty-thumb" aria-hidden="true">
            <span className="empty-frame" />
            <span className="empty-plus" />
          </div>
          <p>Пока пусто. Добавь первую вещь выше.</p>
        </div>
      ) : (
        <div className="wardrobe-grid">
          {filteredItems.map((item) => (
            <article className={item.is_favorite ? 'wardrobe-card favorite' : 'wardrobe-card'} key={item.id}>
              {item.photo_path && photoUrls[item.photo_path] ? (
                <img alt={item.name} src={photoUrls[item.photo_path]} />
              ) : (
                <div className="wardrobe-photo-placeholder">{item.item_type}</div>
              )}
              <div>
                <div className="wardrobe-meta-list">
                  <span>{item.item_type}</span>
                  <span>{item.color}</span>
                  <span>{item.season}</span>
                </div>
                {item.notes && <small>{item.notes}</small>}
              </div>
              <div className="wardrobe-card-actions">
                <button className="ghost" type="button" onClick={() => useItem(item)}>
                  Собрать образ
                </button>
                <button className="ghost" type="button" onClick={() => toggleFavorite(item)}>
                  {item.is_favorite ? 'В избранном' : 'В избранное'}
                </button>
                <button className="ghost danger" type="button" onClick={() => removeItem(item)}>
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
