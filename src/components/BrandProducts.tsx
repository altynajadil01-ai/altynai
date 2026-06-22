import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type BrandProduct = {
  id: string;
  brand: string;
  title: string;
  item_type: string;
  color: string;
  season: string;
  style: string;
  budget: string;
  price: number | null;
  currency: string;
  image_url: string;
  product_url: string;
  notes: string;
  is_favorite: boolean;
  created_at: string;
};

type ProductForm = {
  brand: string;
  title: string;
  itemType: string;
  color: string;
  season: string;
  style: string;
  budget: string;
  price: string;
  currency: string;
  imageUrl: string;
  productUrl: string;
  notes: string;
};

type ShopifyCatalogProduct = {
  remoteId: string;
  brand: string;
  title: string;
  itemType: string;
  color: string;
  season: string;
  style: string;
  budget: string;
  price: number | null;
  currency: string;
  imageUrl: string;
  productUrl: string;
  notes: string;
};

type ShopifyCatalogResponse = {
  products?: ShopifyCatalogProduct[];
  error?: string;
};

const itemTypes = ['футболка', 'рубашка', 'худи', 'свитер', 'кардиган', 'жакет', 'куртка', 'пальто', 'джинсы', 'брюки', 'юбка', 'платье', 'кроссовки', 'ботинки', 'сумка', 'аксессуар'];
const seasons = ['всесезон', 'весна', 'лето', 'осень', 'зима'];
const budgets = ['эконом', 'средний', 'премиум'];
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
  'золотой',
  'розовый',
  'холодный мятный',
  'серый шалфей',
  'светло-золотой',
  'чернильный',
  'стальной синий',
];
const styles = ['спокойное', 'романтичное', 'уверенное', 'спортивное', 'элегантное', 'уличное', 'минималистичное', 'винтажное', 'деловое', 'праздничное', 'дерзкое', 'уютное'];

const emptyForm: ProductForm = {
  brand: '',
  title: '',
  itemType: itemTypes[0],
  color: colors[0],
  season: seasons[0],
  style: styles[0],
  budget: budgets[1],
  price: '',
  currency: 'KZT',
  imageUrl: '',
  productUrl: '',
  notes: '',
};

function formatPrice(price: number | null, currency: string) {
  if (price === null) return 'Цена не указана';
  return `${Math.round(price).toLocaleString('ru-RU')} ${currency}`;
}

export function BrandProducts({ onUseProduct, userId }: { onUseProduct: (product: BrandProduct) => void; userId: string }) {
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [filter, setFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopifyQuery, setShopifyQuery] = useState('black blazer');
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyResults, setShopifyResults] = useState<ShopifyCatalogProduct[]>([]);
  const [message, setMessage] = useState('');

  async function loadProducts() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('brand_products')
      .select('id, brand, title, item_type, color, season, style, budget, price, currency, image_url, product_url, notes, is_favorite, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Каталог пока не загрузился. Примените миграции через npm run db:push.');
      setProducts([]);
    } else {
      setProducts(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, [userId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (favoritesOnly && !product.is_favorite) return false;
      if (filter === 'all') return true;
      return product.item_type === filter || product.brand === filter || product.budget === filter;
    });
  }, [favoritesOnly, filter, products]);

  const filterOptions = useMemo(() => {
    const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();
    return [...budgets, ...itemTypes, ...brands];
  }, [products]);

  function updateField(field: keyof ProductForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const brand = form.brand.trim();
    const title = form.title.trim();
    const productUrl = form.productUrl.trim();
    const price = form.price.trim() ? Number(form.price) : null;

    if (!brand || !title || !productUrl) {
      setMessage('Заполните бренд, название и ссылку на товар.');
      return;
    }

    if (price !== null && Number.isNaN(price)) {
      setMessage('Цена должна быть числом.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('brand_products').insert({
      user_id: userId,
      brand,
      title,
      item_type: form.itemType,
      color: form.color,
      season: form.season,
      style: form.style,
      budget: form.budget,
      price,
      currency: form.currency.trim() || 'KZT',
      image_url: form.imageUrl.trim(),
      product_url: productUrl,
      notes: form.notes.trim(),
    });

    if (error) setMessage(error.message);
    else {
      setForm(emptyForm);
      setMessage('Товар добавлен в каталог.');
      await loadProducts();
    }

    setSaving(false);
  }

  async function removeProduct(id: string) {
    const { error } = await supabase.from('brand_products').delete().eq('id', id);
    if (error) setMessage(error.message);
    else await loadProducts();
  }

  async function toggleFavorite(product: BrandProduct) {
    const { error } = await supabase
      .from('brand_products')
      .update({ is_favorite: !product.is_favorite })
      .eq('id', product.id);

    if (error) setMessage(error.message);
    else {
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, is_favorite: !product.is_favorite } : item)),
      );
    }
  }

  async function searchShopifyProducts(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = shopifyQuery.trim();
    if (!query) {
      setMessage('Напишите, что найти в Shopify.');
      return;
    }

    setShopifyLoading(true);
    setMessage('');

    const { data, error } = await supabase.functions.invoke<ShopifyCatalogResponse>('shopify-products', {
      body: { query, limit: 12 },
    });

    if (error || data?.error) {
      setMessage(data?.error ?? error?.message ?? 'Shopify пока не ответил.');
      setShopifyResults([]);
    } else {
      setShopifyResults(data?.products ?? []);
      if ((data?.products ?? []).length === 0) setMessage('Shopify ничего не нашел по этому запросу.');
    }

    setShopifyLoading(false);
  }

  async function addShopifyProduct(product: ShopifyCatalogProduct) {
    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('brand_products').insert({
      user_id: userId,
      brand: product.brand,
      title: product.title,
      item_type: product.itemType,
      color: product.color,
      season: product.season,
      style: product.style,
      budget: product.budget,
      price: product.price,
      currency: product.currency,
      image_url: product.imageUrl,
      product_url: product.productUrl,
      notes: product.notes,
    });

    if (error) setMessage(error.message);
    else {
      setMessage('Товар из Shopify добавлен в каталог.');
      await loadProducts();
    }

    setSaving(false);
  }

  return (
    <section className="brand-products-page">
      <div className="hero-band">
        <div className="intro">
          <p className="hello">Реальные бренды</p>
          <h2>Каталог товаров для образов</h2>
          <p>Добавляй настоящие вещи из магазинов: ссылку на товар, цену и картинку. Генератор сможет подбирать их под стиль, цвет и бюджет.</p>
        </div>
        <img className="today-hero-photo" src="/brand-catalog-labels.jpg" alt="Лейблы модных брендов крупным планом" />
      </div>

      <section className="shopify-panel">
        <div className="catalog-head">
          <h3>Найти товары из Shopify</h3>
          <p>Введи запрос на английском или русском: jacket, bag, sneakers, black jeans. Найденные товары можно сразу добавить в каталог.</p>
        </div>
        <form className="shopify-search" onSubmit={searchShopifyProducts}>
          <input value={shopifyQuery} onChange={(e) => setShopifyQuery(e.target.value)} placeholder="например: black blazer" />
          <button type="submit" disabled={shopifyLoading}>
            {shopifyLoading ? 'Ищу...' : 'Найти товары'}
          </button>
        </form>
        {shopifyResults.length > 0 && (
          <div className="product-grid compact">
            {shopifyResults.map((product) => (
              <article className="product-card" key={product.remoteId}>
                {product.imageUrl ? (
                  <img alt={product.title} src={product.imageUrl} />
                ) : (
                  <div className="product-image-placeholder">{product.itemType}</div>
                )}
                <div className="product-card-body">
                  <span>{product.brand}</span>
                  <h3>{product.title}</h3>
                  <p>{formatPrice(product.price, product.currency)}</p>
                  <div className="saved-tags">
                    <small>{product.itemType}</small>
                    <small>{product.style}</small>
                    <small>{product.budget}</small>
                  </div>
                </div>
                <div className="product-actions">
                  <button type="button" onClick={() => addShopifyProduct(product)} disabled={saving}>
                    Добавить
                  </button>
                  {product.productUrl && (
                    <a href={product.productUrl} rel="noreferrer" target="_blank">
                      Открыть
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <form className="brand-products-form" onSubmit={addProduct}>
        <label>
          Бренд
          <input placeholder="например: Zara" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} />
        </label>

        <label>
          Название
          <input placeholder="например: structured blazer" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
        </label>

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
          <select value={form.color} onChange={(e) => updateField('color', e.target.value)}>
            {colors.map((color) => (
              <option key={color}>{color}</option>
            ))}
          </select>
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
          Стиль
          <select value={form.style} onChange={(e) => updateField('style', e.target.value)}>
            {styles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </label>

        <label>
          Бюджет
          <select value={form.budget} onChange={(e) => updateField('budget', e.target.value)}>
            {budgets.map((budget) => (
              <option key={budget}>{budget}</option>
            ))}
          </select>
        </label>

        <label>
          Цена
          <input inputMode="numeric" placeholder="например: 29990" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
        </label>

        <label>
          Валюта
          <input placeholder="KZT" value={form.currency} onChange={(e) => updateField('currency', e.target.value)} />
        </label>

        <label className="wide">
          Ссылка на товар
          <input placeholder="https://..." value={form.productUrl} onChange={(e) => updateField('productUrl', e.target.value)} />
        </label>

        <label className="wide">
          Ссылка на картинку
          <input placeholder="https://...jpg" value={form.imageUrl} onChange={(e) => updateField('imageUrl', e.target.value)} />
        </label>

        <label className="wide">
          Заметки
          <input placeholder="например: хорошая база для школы и прогулок" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
        </label>

        <button className="wide" type="submit" disabled={saving}>
          {saving ? 'Добавляю...' : 'Добавить товар'}
        </button>
        {message && <p className="message">{message}</p>}
      </form>

      <div className="wardrobe-toolbar">
        <div className="toolbar-title">
          <img className="toolbar-photo product-toolbar-photo" src="/brand-empty-shopping-bags.jpeg" alt="Иллюстрация с пакетами модных брендов" />
          <strong>{products.length} товаров</strong>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Все товары</option>
          {filterOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <label className="filter-check inline">
          <input checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} type="checkbox" />
          Избранные
        </label>
      </div>

      {loading ? (
        <p className="empty">Загрузка...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>Пока нет товаров. Добавь первую реальную вещь выше.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className={product.is_favorite ? 'product-card favorite' : 'product-card'} key={product.id}>
              {product.image_url ? (
                <img alt={product.title} src={product.image_url} />
              ) : (
                <div className="product-image-placeholder">{product.item_type}</div>
              )}

              <div className="product-card-body">
                <span>{product.brand}</span>
                <h3>{product.title}</h3>
                <p>{formatPrice(product.price, product.currency)}</p>
                <div className="saved-tags">
                  <small>{product.item_type}</small>
                  <small>{product.color}</small>
                  <small>{product.budget}</small>
                  <small>{product.style}</small>
                </div>
                {product.notes && <small>{product.notes}</small>}
              </div>

              <div className="product-actions">
                <button type="button" onClick={() => onUseProduct(product)}>
                  Использовать в генераторе
                </button>
                <button className="ghost" type="button" onClick={() => toggleFavorite(product)}>
                  {product.is_favorite ? 'В избранном' : 'В избранное'}
                </button>
                <a href={product.product_url} rel="noreferrer" target="_blank">
                  Открыть магазин
                </a>
                <button className="ghost danger" type="button" onClick={() => removeProduct(product.id)}>
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
