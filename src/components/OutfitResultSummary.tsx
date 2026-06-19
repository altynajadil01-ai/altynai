import type { BrandProduct } from './BrandProducts';

type PaletteColor = {
  name: string;
  hex: string;
};

type OutfitResultSummaryProps = {
  selectedProduct: BrandProduct | null;
  itemType: string;
  wardrobeColor: string;
  mood: string;
  season: string;
  budget: string;
  palette: PaletteColor[];
  recommendedProduct: BrandProduct | undefined;
};

function formatRecommendedProduct(product: BrandProduct | undefined) {
  return {
    title: product?.title ?? 'Добавь товары в Бренды',
    subtitle: product?.brand ?? 'и здесь появятся реальные вещи',
  };
}

export function OutfitResultSummary({
  selectedProduct,
  itemType,
  wardrobeColor,
  mood,
  season,
  budget,
  palette,
  recommendedProduct,
}: OutfitResultSummaryProps) {
  const product = formatRecommendedProduct(recommendedProduct);

  return (
    <div className="outfit-summary-grid">
      <article>
        <span>Основа</span>
        <strong>{selectedProduct ? selectedProduct.title : itemType}</strong>
        <small>{selectedProduct ? selectedProduct.brand : wardrobeColor}</small>
      </article>
      <article>
        <span>Цвет</span>
        <strong>{wardrobeColor}</strong>
        <small>{palette.map((color) => color.name).slice(1, 4).join(', ')}</small>
      </article>
      <article>
        <span>Контекст</span>
        <strong>{mood}</strong>
        <small>
          {season} · {budget}
        </small>
      </article>
      <article>
        <span>Что купить</span>
        <strong>{product.title}</strong>
        <small>{product.subtitle}</small>
      </article>
    </div>
  );
}
