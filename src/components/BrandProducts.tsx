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

type DummyJsonProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail?: string;
  images?: string[];
  rating?: number;
  stock?: number;
  brand?: string;
};

type DummyJsonResponse = {
  products: DummyJsonProduct[];
};

type DummyJsonCatalogProduct = {
  remoteId: string;
  brand: string;
  title: string;
  category: string;
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
  'пудрово-розовый',
  'розовый',
  'холодный мятный',
  'серый шалфей',
  'нежно-розовый',
  'чернильный',
  'стальной синий',
];
const styles = ['спокойное', 'романтичное', 'уверенное', 'спортивное', 'элегантное', 'уличное', 'минималистичное', 'винтажное', 'деловое', 'праздничное', 'дерзкое', 'уютное'];
const dummyJsonCategories = ['mens-shirts', 'mens-shoes', 'tops', 'womens-bags', 'womens-dresses', 'womens-shoes'];

const fallbackDummyProducts: DummyJsonCatalogProduct[] = [
  {
    remoteId: 'dummyjson-fallback-dress',
    brand: 'DummyJSON',
    title: 'Pink Campaign Dress',
    category: 'womens-dresses',
    itemType: 'платье',
    color: 'розовый',
    season: 'всесезон',
    style: 'романтичное',
    budget: 'средний',
    price: 79,
    currency: 'USD',
    imageUrl: '/look-preview-sephora-pink.jpeg',
    productUrl: 'https://dummyjson.com/products/category/womens-dresses',
    notes: 'Запасной демо-товар для прототипа, если DummyJSON временно не загрузился.',
  },
  {
    remoteId: 'dummyjson-fallback-bag',
    brand: 'DummyJSON',
    title: 'Pink Fashion Bag',
    category: 'womens-bags',
    itemType: 'сумка',
    color: 'пудрово-розовый',
    season: 'всесезон',
    style: 'уличное',
    budget: 'средний',
    price: 49,
    currency: 'USD',
    imageUrl: '/stylist-acne-studios.jpeg',
    productUrl: 'https://dummyjson.com/products/category/womens-bags',
    notes: 'Запасной демо-товар для прототипа, если DummyJSON временно не загрузился.',
  },
  {
    remoteId: 'dummyjson-fallback-shoes',
    brand: 'DummyJSON',
    title: 'Pink Editorial Shoes',
    category: 'womens-shoes',
    itemType: 'кроссовки',
    color: 'нежно-розовый',
    season: 'всесезон',
    style: 'элегантное',
    budget: 'средний',
    price: 59,
    currency: 'USD',
    imageUrl: '/look-preview-pink-campaign.jpeg',
    productUrl: 'https://dummyjson.com/products/category/womens-shoes',
    notes: 'Запасной демо-товар для прототипа, если DummyJSON временно не загрузился.',
  },
];

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

function getItemTypeFromDummyCategory(category: string) {
  if (category.includes('shirt')) return 'рубашка';
  if (category.includes('shoe')) return 'кроссовки';
  if (category.includes('bag')) return 'сумка';
  if (category.includes('dress')) return 'платье';
  if (category === 'tops') return 'футболка';
  return 'аксессуар';
}

function mapDummyProduct(product: DummyJsonProduct): DummyJsonCatalogProduct {
  const imageUrl = product.thumbnail || product.images?.[0] || '';

  return {
    remoteId: `dummyjson-${product.id}`,
    brand: product.brand || 'DummyJSON',
    title: product.title,
    category: product.category,
    itemType: getItemTypeFromDummyCategory(product.category),
    color: 'пудрово-розовый',
    season: 'всесезон',
    style: 'уличное',
    budget: product.price <= 40 ? 'эконом' : product.price <= 90 ? 'средний' : 'премиум',
    price: product.price,
    currency: 'USD',
    imageUrl,
    productUrl: `https://dummyjson.com/products/${product.id}`,
    notes: `${product.description} Источник: DummyJSON, категория ${product.category}.`,
  };
}

async function fetchDummyProducts() {
  const groups = await Promise.all(
    dummyJsonCategories.map(async (category) => {
      const response = await fetch(`https://dummyjson.com/products/category/${category}`);
      if (!response.ok) throw new Error(`Не удалось загрузить ${category}`);
      const data = (await response.json()) as DummyJsonResponse;
      return data.products.map(mapDummyProduct);
    }),
  );

  return groups.flat();
}

export function BrandProducts({ onUseProduct, userId }: { onUseProduct: (product: BrandProduct) => void; userId: string }) {
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [filter, setFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dummyQuery, setDummyQuery] = useState('dress');
  const [dummyLoading, setDummyLoading] = useState(false);
  const [dummyCatalog, setDummyCatalog] = useState<DummyJsonCatalogProduct[]>([]);
  const [dummyResults, setDummyResults] = useState<DummyJsonCatalogProduct[]>([]);
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
      image_url: '',
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

  async function searchDummyProducts(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = dummyQuery.trim().toLowerCase();

    setDummyLoading(true);
    setMessage('');

    try {
      const catalog = dummyCatalog.length > 0 ? dummyCatalog : await fetchDummyProducts();
      setDummyCatalog(catalog);

      const results = query
        ? catalog.filter((product) =>
            [product.title, product.brand, product.category, product.itemType, product.notes].some((value) =>
              value.toLowerCase().includes(query),
            ),
          )
        : catalog;

      const visibleResults = results.length > 0 ? results : catalog;
      setDummyResults(visibleResults.slice(0, 18));
      if (results.length === 0) setMessage('По запросу ничего не нашлось, поэтому показаны все товары DummyJSON.');
    } catch (error) {
      setDummyCatalog(fallbackDummyProducts);
      setDummyResults(fallbackDummyProducts);
      setMessage(
        error instanceof Error
          ? `${error.message}. Показаны запасные демо-товары.`
          : 'DummyJSON пока не ответил. Показаны запасные демо-товары.',
      );
    }

    setDummyLoading(false);
  }

  async function addDummyProduct(product: DummyJsonCatalogProduct) {
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
      setMessage('Товар из DummyJSON добавлен в каталог.');
      await loadProducts();
    }

    setSaving(false);
  }

  return (
    <section className="brand-products-page">
      <div className="hero-band">
        <div className="intro">
          <p className="hello">Реальные бренды</p>
          <h2 className="catalog-title">
            <span>Каталог</span>
            <span>товаров для</span>
            <span>образов</span>
          </h2>
          <p>Добавляй настоящие вещи из магазинов: ссылку на товар, цену и картинку. Генератор сможет подбирать их под стиль, цвет и бюджет.</p>
        </div>
        <img className="today-hero-photo" src="/brand-catalog-hero-miu.jpeg" alt="Лейблы модных брендов крупным планом" />
      </div>

      <section className="api-products-panel">
        <div className="catalog-head">
          <h3>Товары из DummyJSON</h3>
          <p>Загрузи демо-одежду из API: рубашки, обувь, топы, сумки и платья. Можно оставить поле пустым, чтобы увидеть все товары.</p>
        </div>
        <form className="api-products-search" onSubmit={searchDummyProducts}>
          <input value={dummyQuery} onChange={(e) => setDummyQuery(e.target.value)} placeholder="например: dress, shoes, bag" />
          <button type="submit" disabled={dummyLoading}>
            {dummyLoading ? 'Загружаю...' : 'Загрузить товары'}
          </button>
        </form>
        {dummyResults.length > 0 && (
          <div className="product-grid compact">
            {dummyResults.map((product) => (
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
                  <button type="button" onClick={() => addDummyProduct(product)} disabled={saving}>
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
          Цена (не обязательно)
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
