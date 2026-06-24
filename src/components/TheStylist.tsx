import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const dummyJsonCategories = [
  'mens-shirts',
  'mens-shoes',
  'tops',
  'womens-bags',
  'womens-dresses',
  'womens-shoes',
] as const;

type DummyJsonCategory = (typeof dummyJsonCategories)[number];

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

export type ClothingProduct = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  rating?: number;
  stock?: number;
  brand?: string;
  source: 'dummyjson';
};

type OutfitItem = {
  id: string;
  title: string;
  category: string;
  image: string;
  reason: string;
};

type StylistOutfit = {
  outfitName: string;
  styleSummary: string;
  items: OutfitItem[];
};

type AiFunctionResponse = {
  text?: string;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function mapProduct(product: DummyJsonProduct): ClothingProduct {
  const images = product.images ?? [];
  const image = product.thumbnail || images[0] || '';

  return {
    id: String(product.id),
    title: product.title,
    category: product.category,
    description: product.description,
    price: product.price,
    image,
    images,
    rating: product.rating,
    stock: product.stock,
    brand: product.brand,
    source: 'dummyjson',
  };
}

async function fetchCategory(category: DummyJsonCategory) {
  const response = await fetch(`https://dummyjson.com/products/category/${category}`);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить категорию ${category}`);
  }

  const data = (await response.json()) as DummyJsonResponse;
  return data.products.map(mapProduct);
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI не вернул JSON.');
  }

  return withoutFence.slice(start, end + 1);
}

function parseOutfit(text: string, products: ClothingProduct[]): StylistOutfit {
  const parsed: unknown = JSON.parse(extractJson(text));
  const productById = new Map(products.map((product) => [product.id, product]));

  if (!isRecord(parsed)) {
    throw new Error('Ответ AI пришел в неправильном формате.');
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items = rawItems
    .filter(isRecord)
    .map((item) => {
      const id = getString(item.id);
      const product = productById.get(id);

      if (!product) return null;

      return {
        id: product.id,
        title: product.title,
        category: product.category,
        image: product.image,
        reason: getString(item.reason, 'Выбрано из доступного каталога DummyJSON.'),
      };
    })
    .filter((item): item is OutfitItem => item !== null);

  if (items.length === 0) {
    throw new Error('AI не выбрал товары из загруженного списка.');
  }

  return {
    outfitName: getString(parsed.outfitName, 'Образ от AI-стилиста'),
    styleSummary: getString(parsed.styleSummary, 'Образ составлен из загруженных товаров DummyJSON.'),
    items,
  };
}

function buildPrompt(products: ClothingProduct[], userRequest: string) {
  return `You are a fashion stylist for an app called The Stylist.

Your task:
Create a stylish outfit using only the products listed below.

Rules:
1. Use only products from the provided list.
2. Do not invent product names.
3. Return the selected product ids, titles, categories, image URLs, and a short styling explanation.
4. If the requested style cannot be made from the available products, choose the closest possible outfit and explain briefly.
5. Prefer matching categories, colors, and occasion based on title and description.
6. Return only valid JSON. Do not wrap it in markdown.

Available products:
${JSON.stringify(products, null, 2)}

User request:
${userRequest}

Return JSON in this format:
{
  "outfitName": "string",
  "styleSummary": "string",
  "items": [
    {
      "id": "string",
      "title": "string",
      "category": "string",
      "image": "string",
      "reason": "string"
    }
  ]
}`;
}

export function TheStylist() {
  const [products, setProducts] = useState<ClothingProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [request, setRequest] = useState('Собери мне стильный повседневный образ.');
  const [outfit, setOutfit] = useState<StylistOutfit | null>(null);
  const [rawAiText, setRawAiText] = useState('');
  const [styling, setStyling] = useState(false);
  const [stylistError, setStylistError] = useState('');

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((counts, product) => {
      return { ...counts, [product.category]: (counts[product.category] ?? 0) + 1 };
    }, {});
  }, [products]);

  useEffect(() => {
    async function loadProducts() {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const productGroups = await Promise.all(dummyJsonCategories.map(fetchCategory));
        setProducts(productGroups.flat());
      } catch (error) {
        setCatalogError(error instanceof Error ? error.message : 'Не удалось загрузить одежду из DummyJSON.');
      } finally {
        setCatalogLoading(false);
      }
    }

    void loadProducts();
  }, []);

  async function createOutfit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (products.length === 0) {
      setStylistError('Сначала нужно загрузить каталог DummyJSON.');
      return;
    }

    setStyling(true);
    setStylistError('');
    setRawAiText('');
    setOutfit(null);

    const prompt = buildPrompt(products, request);

    try {
      const { data, error } = await supabase.functions.invoke<AiFunctionResponse>('ai', {
        body: {
          system:
            'You are The Stylist. You must create outfits only from the provided product JSON. Return valid JSON only.',
          prompt,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const text = data?.text ?? '';
      setRawAiText(text);
      setOutfit(parseOutfit(text, products));
    } catch (error) {
      setStylistError(error instanceof Error ? error.message : 'AI-стилист не смог собрать образ.');
    } finally {
      setStyling(false);
    }
  }

  return (
    <section className="stylist-page">
      <section className="hero-band stylist-hero">
        <div className="intro">
          <p className="hello">Каталог одежды DummyJSON + AI-стилист</p>
          <h2>Стилист</h2>
          <p>
            Приложение сначала загружает демо-товары с одеждой, а потом просит AI собрать образ только из этого
            списка.
          </p>
        </div>
        <img className="today-hero-photo stylist-hero-photo" src="/stylist-acne-studios.jpeg" alt="Acne Studios fashion campaign" />
      </section>

      <section className="stylist-workspace">
        <form className="generator-panel stylist-form" onSubmit={createOutfit}>
          <div>
            <h3>Опиши образ</h3>
            <p>
              Например: повседневный образ для школы, элегантный look на ужин, летний outfit, street style или образ
              для дождливой погоды.
            </p>
          </div>
          <textarea
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder="Собери мне стильный повседневный образ."
            rows={5}
            required
          />
          <button type="submit" disabled={catalogLoading || styling || products.length === 0}>
            {styling ? 'Собираю образ...' : 'Создать образ с AI'}
          </button>
          {stylistError && <p className="message">{stylistError}</p>}
        </form>

        <aside className="stylist-catalog-panel">
          <div>
            <h3>Загруженная одежда</h3>
            <p>{catalogLoading ? 'Загружаю товары DummyJSON...' : `${products.length} товаров загружено из DummyJSON.`}</p>
          </div>
          {catalogError && <p className="message">{catalogError}</p>}
          <div className="stylist-category-grid">
            {dummyJsonCategories.map((category) => (
              <span key={category}>
                {category}
                <strong>{categoryCounts[category] ?? 0}</strong>
              </span>
            ))}
          </div>
        </aside>
      </section>

      {outfit && (
        <section className="result-panel stylist-result">
          <div className="result-head">
            <div>
              <h3>{outfit.outfitName}</h3>
              <p>{outfit.styleSummary}</p>
            </div>
          </div>
          <div className="stylist-outfit-grid">
            {outfit.items.map((item) => (
              <article className="product-card stylist-item-card" key={item.id}>
                <img src={item.image} alt={item.title} />
                <div className="product-card-body">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.reason}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="catalog-panel stylist-products-panel">
        <div className="catalog-head">
          <h3>Каталог DummyJSON</h3>
          <p>Именно эти товары отправляются в AI-запрос. Образ должен использовать id только из этого списка.</p>
        </div>
        <div className="product-grid compact">
          {products.slice(0, 12).map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.image} alt={product.title} />
              <div className="product-card-body">
                <span>{product.category}</span>
                <h3>{product.title}</h3>
                <p>${product.price}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {rawAiText && (
        <details className="stylist-raw">
          <summary>JSON-ответ AI</summary>
          <pre>{rawAiText}</pre>
        </details>
      )}
    </section>
  );
}
