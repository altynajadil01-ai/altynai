const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
const API_VERSION = '2026-04';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ShopifyMoney = {
  amount?: string;
  currencyCode?: string;
};

type ShopifyProductNode = {
  id?: string;
  title?: string;
  vendor?: string;
  handle?: string;
  productType?: string;
  tags?: string[];
  onlineStoreUrl?: string | null;
  featuredImage?: {
    url?: string;
    altText?: string | null;
  } | null;
  priceRange?: {
    minVariantPrice?: ShopifyMoney;
  };
};

type ShopifyResponse = {
  data?: {
    products?: {
      nodes?: ShopifyProductNode[];
    };
  };
  errors?: Array<{ message?: string }>;
};

type CatalogProduct = {
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

function normalizeDomain(value: string) {
  return value.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function inferItemType(product: ShopifyProductNode) {
  const source = `${product.productType ?? ''} ${(product.tags ?? []).join(' ')} ${product.title ?? ''}`.toLowerCase();

  if (source.includes('bag') || source.includes('сум')) return 'сумка';
  if (source.includes('shoe') || source.includes('sneaker') || source.includes('крос')) return 'кроссовки';
  if (source.includes('boot') || source.includes('бот')) return 'ботинки';
  if (source.includes('jean') || source.includes('деним')) return 'джинсы';
  if (source.includes('pant') || source.includes('trouser') || source.includes('брюк')) return 'брюки';
  if (source.includes('jacket') || source.includes('blazer') || source.includes('жак')) return 'жакет';
  if (source.includes('coat') || source.includes('пальт')) return 'пальто';
  if (source.includes('hoodie') || source.includes('худи')) return 'худи';
  if (source.includes('shirt') || source.includes('руб')) return 'рубашка';
  if (source.includes('sweater') || source.includes('knit') || source.includes('свит')) return 'свитер';
  if (source.includes('accessor') || source.includes('jewelry') || source.includes('necklace')) return 'аксессуар';
  return product.productType?.trim() || 'аксессуар';
}

function mapProduct(product: ShopifyProductNode, storeDomain: string): CatalogProduct {
  const money = product.priceRange?.minVariantPrice;
  const price = money?.amount ? Number(money.amount) : null;
  const productUrl = product.onlineStoreUrl || (product.handle ? `https://${storeDomain}/products/${product.handle}` : '');

  return {
    remoteId: product.id ?? product.handle ?? product.title ?? crypto.randomUUID(),
    brand: product.vendor?.trim() || storeDomain.replace('.myshopify.com', ''),
    title: product.title?.trim() || 'Shopify product',
    itemType: inferItemType(product),
    color: 'черный',
    season: 'всесезон',
    style: 'элегантное',
    budget: 'премиум',
    price: Number.isFinite(price) ? price : null,
    currency: money?.currencyCode || 'USD',
    imageUrl: product.featuredImage?.url ?? '',
    productUrl,
    notes: 'Импортировано из Shopify',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      throw new Error(
        'Нет Shopify-секретов. Добавьте: npm run shopify:secret -- SHOPIFY_STORE_DOMAIN=store.myshopify.com SHOPIFY_STOREFRONT_ACCESS_TOKEN=token',
      );
    }

    const body = (await req.json()) as { query?: string; limit?: number };
    const query = body.query?.trim();
    if (!query) throw new Error('Нужно написать, какие товары искать.');

    const limit = Math.min(Math.max(body.limit ?? 12, 1), 24);
    const storeDomain = normalizeDomain(SHOPIFY_STORE_DOMAIN);

    const graphqlQuery = `
      query SearchProducts($first: Int!, $query: String!) {
        products(first: $first, query: $query) {
          nodes {
            id
            title
            vendor
            handle
            productType
            tags
            onlineStoreUrl
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${storeDomain}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { first: limit, query },
      }),
    });

    const data = (await response.json()) as ShopifyResponse;
    if (!response.ok || data.errors?.length) {
      throw new Error(data.errors?.[0]?.message ?? `Shopify вернул ошибку ${response.status}`);
    }

    const products = (data.data?.products?.nodes ?? []).map((product) => mapProduct(product, storeDomain));

    return new Response(JSON.stringify({ products }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
