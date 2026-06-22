import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type SavedOutfit = {
  id: string;
  title: string;
  outfit_text: string;
  photo_prompt: string;
  created_at: string;
  is_favorite: boolean;
  season: string;
  mood: string;
  wardrobe_color: string;
  item_type: string;
};

type CollectionFilter = {
  season: string;
  mood: string;
  color: string;
  favoritesOnly: boolean;
};

const emptyFilter: CollectionFilter = {
  season: 'all',
  mood: 'all',
  color: 'all',
  favoritesOnly: false,
};

function uniqueValues(items: SavedOutfit[], field: keyof Pick<SavedOutfit, 'season' | 'mood' | 'wardrobe_color'>) {
  return Array.from(new Set(items.map((item) => item[field]).filter(Boolean))).sort();
}

const colorHexByName: Record<string, string> = {
  черный: '#171717',
  белый: '#ffffff',
  серый: '#8f9499',
  'светло-серый': '#d7dde5',
  графитовый: '#232832',
  бордовый: '#6f1836',
  сливовый: '#8b6f2f',
  винный: '#9b7a32',
  чернильный: '#243b5a',
  деним: '#3f6f9f',
  'синий деним': '#3f6f9f',
};

function getColorHex(color: string) {
  return colorHexByName[color] ?? '#6f1836';
}

export function SavedOutfits({ userId }: { userId: string }) {
  const [items, setItems] = useState<SavedOutfit[]>([]);
  const [filter, setFilter] = useState<CollectionFilter>(emptyFilter);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadSavedOutfits() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('saved_outfits')
      .select('id, title, outfit_text, photo_prompt, created_at, is_favorite, season, mood, wardrobe_color, item_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) setMessage('Не удалось загрузить коллекцию. Примените миграции через npm run db:push.');
    else setItems(data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadSavedOutfits();
  }, [userId]);

  const seasons = useMemo(() => uniqueValues(items, 'season'), [items]);
  const moods = useMemo(() => uniqueValues(items, 'mood'), [items]);
  const colors = useMemo(() => uniqueValues(items, 'wardrobe_color'), [items]);
  const favoriteCount = useMemo(() => items.filter((item) => item.is_favorite).length, [items]);
  const activeFilterCount = useMemo(
    () =>
      [filter.season !== 'all', filter.mood !== 'all', filter.color !== 'all', filter.favoritesOnly].filter(Boolean)
        .length,
    [filter],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter.favoritesOnly && !item.is_favorite) return false;
      if (filter.season !== 'all' && item.season !== filter.season) return false;
      if (filter.mood !== 'all' && item.mood !== filter.mood) return false;
      if (filter.color !== 'all' && item.wardrobe_color !== filter.color) return false;
      return true;
    });
  }, [filter, items]);

  function updateFilter(field: keyof CollectionFilter, value: string | boolean) {
    setFilter((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilter(emptyFilter);
  }

  async function toggleFavorite(item: SavedOutfit) {
    const { error } = await supabase
      .from('saved_outfits')
      .update({ is_favorite: !item.is_favorite })
      .eq('id', item.id);

    if (error) setMessage(error.message);
    else setItems((current) => current.map((nextItem) => (nextItem.id === item.id ? { ...nextItem, is_favorite: !item.is_favorite } : nextItem)));
  }

  async function removeOutfit(id: string) {
    const { error } = await supabase.from('saved_outfits').delete().eq('id', id);
    if (error) setMessage(error.message);
    else loadSavedOutfits();
  }

  return (
    <section className="collection-page">
      <div className="hero-band collection-hero">
        <div className="intro">
          <p className="hello">Моя коллекция</p>
          <h2 className="collection-title">
            <span>Сохраненные</span>
            <span>образы</span>
          </h2>
          <p>Фильтруй лучшие идеи по сезону, настроению и цвету, отмечай избранное и быстро возвращайся к удачным сочетаниям.</p>
        </div>
        <img className="today-hero-photo" src="/profile-sketches.jpg" alt="Fashion-эскизы для сохраненных образов" />
      </div>

      <div className="collection-filters">
        <div className="filter-illustration">
          <img className="toolbar-photo collection-season-photo" src="/collection-season-lipsticks.jpeg" alt="Fashion-иллюстрация помад" />
        </div>
        <label>
          Сезон
          <select value={filter.season} onChange={(e) => updateFilter('season', e.target.value)}>
            <option value="all">Все</option>
            {seasons.map((season) => (
              <option key={season}>{season}</option>
            ))}
          </select>
        </label>

        <label>
          Стиль
          <select value={filter.mood} onChange={(e) => updateFilter('mood', e.target.value)}>
            <option value="all">Все</option>
            {moods.map((mood) => (
              <option key={mood}>{mood}</option>
            ))}
          </select>
        </label>

        <label>
          Цвет
          <select value={filter.color} onChange={(e) => updateFilter('color', e.target.value)}>
            <option value="all">Все</option>
            {colors.map((color) => (
              <option key={color}>{color}</option>
            ))}
          </select>
        </label>

        <label className="filter-check">
          <input checked={filter.favoritesOnly} onChange={(e) => updateFilter('favoritesOnly', e.target.checked)} type="checkbox" />
          Только избранное
        </label>
      </div>

      <div className="collection-summary" aria-label="Статистика коллекции">
        <article>
          <span>Всего</span>
          <strong>{items.length}</strong>
          <small>сохраненных образов</small>
        </article>
        <article>
          <span>Избранное</span>
          <strong>{favoriteCount}</strong>
          <small>лучшие сочетания</small>
        </article>
        <article>
          <span>Показано</span>
          <strong>{filteredItems.length}</strong>
          <small>{activeFilterCount > 0 ? `${activeFilterCount} фильтра` : 'без фильтров'}</small>
        </article>
        <button className="ghost" disabled={activeFilterCount === 0} onClick={resetFilters} type="button">
          Сбросить фильтры
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {loading ? (
        <p className="empty">Загрузка...</p>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="editorial-thumb empty-thumb" aria-hidden="true">
            <span className="empty-frame" />
            <span className="empty-plus" />
          </div>
          <p>Пока пусто. Сохрани первый образ в генераторе или измени фильтры.</p>
        </div>
      ) : (
        <div className="collection-grid">
          {filteredItems.map((item) => (
            <article className={item.is_favorite ? 'saved-card favorite' : 'saved-card'} key={item.id}>
              <div className="saved-head">
                <div>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <h3>{item.title}</h3>
                </div>
                <button className="ghost" onClick={() => toggleFavorite(item)} type="button">
                  {item.is_favorite ? 'В избранном' : 'В избранное'}
                </button>
              </div>

              <div className="saved-tags">
                {item.season && <small>{item.season}</small>}
                {item.mood && <small>{item.mood}</small>}
                {item.wardrobe_color && <small>{item.wardrobe_color}</small>}
                {item.item_type && <small>{item.item_type}</small>}
              </div>

              <div className="saved-look-preview" aria-label="Мини-превью образа">
                <span className="saved-look-top" style={{ backgroundColor: getColorHex(item.wardrobe_color) }} />
                <span className="saved-look-layer" />
                <span className="saved-look-bottom" />
                <div>
                  <strong>{item.item_type || 'образ'}</strong>
                  <small>{item.mood || 'стиль'} · {item.season || 'сезон'}</small>
                </div>
              </div>

              <p>{item.outfit_text}</p>
              {item.photo_prompt && (
                <details>
                  <summary>Фото-промпт</summary>
                  <small>{item.photo_prompt}</small>
                </details>
              )}
              <button className="ghost danger" onClick={() => removeOutfit(item.id)} type="button">
                Удалить
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
