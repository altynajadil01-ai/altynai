import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StyleAssistant } from './StyleAssistant';
import { MiniIllustration } from './FashionIllustration';
import type { BrandProduct } from './BrandProducts';
import { OutfitResultSummary } from './OutfitResultSummary';
import type { WardrobePick } from '../App';

type OutfitForm = {
  mood: string;
  season: string;
  gender: string;
  budget: string;
  place: string;
  itemType: string;
  wardrobeColor: string;
  wardrobeItemId: string;
};

type PaletteColor = {
  name: string;
  hex: string;
};

type BrandSuggestion = {
  name: string;
  reason: string;
};

type CatalogItem = {
  brand: string;
  title: string;
  itemType: string;
  colors: string[];
  budget: string;
  styles: string[];
};

type OutfitScore = {
  label: string;
  value: number;
  note: string;
};

type UploadedPhoto = {
  path: string;
  url: string;
  name: string;
};

type WardrobeItem = {
  id: string;
  name: string;
  item_type: string;
  color: string;
  season: string;
  notes: string;
  is_favorite?: boolean;
};

type ProfilePreferences = {
  city: string;
  favorite_style: string;
  budget: string;
  favorite_colors: string[];
  preferred_brands?: string[];
  avoid_dresses?: boolean;
};

function isMissingProfilePreferenceColumn(errorMessage: string) {
  return errorMessage.includes('preferred_brands') || errorMessage.includes('avoid_dresses');
}

type DetailTab = 'look' | 'photo' | 'score' | 'capsule' | 'assistant';

type WeatherInfo = {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  precipitation: number;
  description: string;
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
};

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

type RecentOutfit = {
  id: string;
  title: string;
  text: string;
  form: OutfitForm;
  createdAt: string;
};

function getHistoryKey(userId: string) {
  return `stylelab-recent-outfits-${userId}`;
}

function loadRecentOutfits(userId: string): RecentOutfit[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentOutfit[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentOutfits(userId: string, items: RecentOutfit[]) {
  localStorage.setItem(getHistoryKey(userId), JSON.stringify(items.slice(0, 5)));
}

const moodOptions = [
  'спокойное',
  'романтичное',
  'уверенное',
  'спортивное',
  'элегантное',
  'уличное',
  'минималистичное',
  'винтажное',
  'деловое',
  'праздничное',
  'дерзкое',
  'уютное',
];
const seasonOptions = ['весна', 'лето', 'осень', 'зима'];
const genderOptions = ['женский', 'мужской', 'унисекс'];
const budgetOptions = ['эконом', 'средний', 'премиум'];
const itemTypeOptions = [
  'футболка',
  'рубашка',
  'худи',
  'свитер',
  'кардиган',
  'жакет',
  'куртка',
  'пальто',
  'джинсы',
  'брюки',
  'юбка',
  'платье',
  'кроссовки',
  'ботинки',
  'сумка',
  'аксессуар',
];

const brandsByBudget: Record<string, BrandSuggestion[]> = {
  эконом: [
    { name: 'H&M', reason: 'база, футболки, рубашки и простые слои' },
    { name: 'LC Waikiki', reason: 'доступные повседневные вещи' },
    { name: 'Gloria Jeans', reason: 'деним, худи и casual-образы' },
    { name: 'DeFacto', reason: 'спокойные вещи для школы и прогулок' },
  ],
  средний: [
    { name: 'Zara', reason: 'трендовые жакеты, брюки и аксессуары' },
    { name: 'Mango', reason: 'аккуратные базовые вещи и верхняя одежда' },
    { name: 'Bershka', reason: 'молодежные акценты и яркие детали' },
    { name: 'Pull&Bear', reason: 'кеды, деним и расслабленный street style' },
  ],
  премиум: [
    { name: 'COS', reason: 'минималистичная база и качественные силуэты' },
    { name: 'Massimo Dutti', reason: 'элегантные слои, обувь и сумки' },
    { name: 'Tommy Hilfiger', reason: 'preppy-стиль и спокойные акценты' },
    { name: 'Calvin Klein', reason: 'лаконичная база без лишнего декора' },
  ],
};

const brandCatalog: CatalogItem[] = [
  { brand: 'H&M', title: 'basic cotton t-shirt', itemType: 'футболка', colors: ['белый', 'черный', 'серый'], budget: 'эконом', styles: ['спокойное', 'минималистичное', 'спортивное'] },
  { brand: 'LC Waikiki', title: 'relaxed hoodie', itemType: 'худи', colors: ['серый', 'серый шалфей', 'черный'], budget: 'эконом', styles: ['спортивное', 'уличное', 'уютное'] },
  { brand: 'Gloria Jeans', title: 'straight denim jeans', itemType: 'джинсы', colors: ['синий деним', 'черный'], budget: 'эконом', styles: ['уличное', 'спокойное', 'дерзкое'] },
  { brand: 'DeFacto', title: 'oversized shirt', itemType: 'рубашка', colors: ['белый', 'светло-серый', 'бордовый'], budget: 'эконом', styles: ['спокойное', 'деловое', 'минималистичное'] },
  { brand: 'Zara', title: 'structured blazer', itemType: 'жакет', colors: ['черный', 'графитовый', 'чернильный'], budget: 'средний', styles: ['элегантное', 'деловое', 'праздничное'] },
  { brand: 'Mango', title: 'soft knit cardigan', itemType: 'кардиган', colors: ['светло-серый', 'графитовый', 'серый'], budget: 'средний', styles: ['уютное', 'винтажное', 'романтичное'] },
  { brand: 'Bershka', title: 'cropped jacket', itemType: 'куртка', colors: ['черный', 'серый шалфей', 'чернильный'], budget: 'средний', styles: ['уличное', 'дерзкое', 'спортивное'] },
  { brand: 'Pull&Bear', title: 'cargo pants', itemType: 'брюки', colors: ['серый шалфей', 'графитовый', 'черный'], budget: 'средний', styles: ['уличное', 'спортивное', 'дерзкое'] },
  { brand: 'Nike', title: 'clean lifestyle sneakers', itemType: 'кроссовки', colors: ['белый', 'черный', 'серый'], budget: 'средний', styles: ['спортивное', 'уличное', 'дерзкое'] },
  { brand: 'Adidas', title: 'classic sneakers', itemType: 'кроссовки', colors: ['белый', 'черный', 'синий деним'], budget: 'средний', styles: ['спортивное', 'уличное', 'спокойное'] },
  { brand: 'COS', title: 'minimal wool coat', itemType: 'пальто', colors: ['серый', 'графитовый', 'черный'], budget: 'премиум', styles: ['минималистичное', 'элегантное', 'деловое'] },
  { brand: 'Massimo Dutti', title: 'leather ankle boots', itemType: 'ботинки', colors: ['черный', 'графитовый', 'чернильный'], budget: 'премиум', styles: ['элегантное', 'деловое', 'винтажное'] },
  { brand: 'Tommy Hilfiger', title: 'preppy sweater', itemType: 'свитер', colors: ['темно-синий', 'белый', 'чернильный'], budget: 'премиум', styles: ['спокойное', 'деловое', 'праздничное'] },
  { brand: 'Calvin Klein', title: 'minimal crossbody bag', itemType: 'сумка', colors: ['черный', 'светло-серый', 'графитовый'], budget: 'премиум', styles: ['минималистичное', 'элегантное', 'спокойное'] },
];

const wardrobeColors: PaletteColor[] = [
  { name: 'черный', hex: '#171717' },
  { name: 'белый', hex: '#ffffff' },
  { name: 'серый', hex: '#8f9499' },
  { name: 'светло-серый', hex: '#d7dde5' },
  { name: 'графитовый', hex: '#232832' },
  { name: 'бежевый', hex: '#d8c7ad' },
  { name: 'молочный', hex: '#f4efe7' },
  { name: 'коричневый', hex: '#6a4a35' },
  { name: 'хаки', hex: '#6f7652' },
  { name: 'синий деним', hex: '#3f6f9f' },
  { name: 'темно-синий', hex: '#1f365c' },
  { name: 'бордовый', hex: '#6f1836' },
  { name: 'сливовый', hex: '#8b6f2f' },
  { name: 'винный', hex: '#9b7a32' },
  { name: 'красный', hex: '#b83b3b' },
  { name: 'оранжевый', hex: '#d98245' },
  { name: 'желтый', hex: '#efd96f' },
  { name: 'зеленый', hex: '#4f7d57' },
  { name: 'голубой', hex: '#86b6d9' },
  { name: 'синий', hex: '#2457a6' },
  { name: 'золотой', hex: '#c9a44c' },
  { name: 'розовый', hex: '#e6a6b8' },
  { name: 'холодный мятный', hex: '#6f8f9f' },
  { name: 'серый шалфей', hex: '#7b8fa3' },
  { name: 'светло-золотой', hex: '#ead28a' },
  { name: 'чернильный', hex: '#243b5a' },
  { name: 'стальной синий', hex: '#5f6f86' },
];

const generatorDetailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'look', label: 'Образ' },
  { id: 'photo', label: 'Фото' },
  { id: 'score', label: 'Аналитика' },
  { id: 'capsule', label: 'Образы на неделю' },
  { id: 'assistant', label: 'AI' },
];

const todayDetailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'look', label: 'Сегодня' },
  { id: 'photo', label: 'Фото образа' },
  { id: 'score', label: 'Оценка' },
  { id: 'capsule', label: 'На неделю' },
  { id: 'assistant', label: 'Совет' },
];

const colorPairs: Record<string, PaletteColor[]> = {
  черный: [
    { name: 'фарфоровый', hex: '#eef3f7' },
    { name: 'серебро', hex: '#c5c8ce' },
    { name: 'чернильный', hex: '#243b5a' },
  ],
  белый: [
    { name: 'синий деним', hex: '#3f6f9f' },
    { name: 'серый шалфей', hex: '#8fa8bb' },
    { name: 'графит', hex: '#3f4652' },
  ],
  серый: [
    { name: 'светло-золотой', hex: '#ead28a' },
    { name: 'темно-синий', hex: '#1f365c' },
    { name: 'белый', hex: '#ffffff' },
  ],
  'светло-серый': [
    { name: 'серый шалфей', hex: '#7b8fa3' },
    { name: 'графитовый', hex: '#232832' },
    { name: 'бордовый', hex: '#6f1836' },
  ],
  графитовый: [
    { name: 'ледяной', hex: '#e5ebf1' },
    { name: 'деним', hex: '#557a95' },
    { name: 'дымчато-синий', hex: '#5f6f86' },
  ],
  бежевый: [
    { name: 'белый', hex: '#ffffff' },
    { name: 'синий деним', hex: '#3f6f9f' },
    { name: 'бордовый', hex: '#6f1836' },
  ],
  молочный: [
    { name: 'черный', hex: '#171717' },
    { name: 'серый шалфей', hex: '#7b8fa3' },
    { name: 'синий деним', hex: '#3f6f9f' },
  ],
  коричневый: [
    { name: 'молочный', hex: '#f4efe7' },
    { name: 'синий деним', hex: '#3f6f9f' },
    { name: 'черный', hex: '#171717' },
  ],
  хаки: [
    { name: 'белый', hex: '#ffffff' },
    { name: 'черный', hex: '#171717' },
    { name: 'бордовый', hex: '#6f1836' },
  ],
  'синий деним': [
    { name: 'белый', hex: '#ffffff' },
    { name: 'бордовый', hex: '#6f1836' },
    { name: 'стальной', hex: '#d7dde5' },
  ],
  'темно-синий': [
    { name: 'фарфоровый', hex: '#eef3f7' },
    { name: 'чернильный', hex: '#243b5a' },
    { name: 'серый', hex: '#8f9499' },
  ],
  бордовый: [
    { name: 'черный', hex: '#171717' },
    { name: 'светло-серый', hex: '#d7dde5' },
    { name: 'графитовый', hex: '#232832' },
  ],
  сливовый: [
    { name: 'черный', hex: '#171717' },
    { name: 'фарфоровый', hex: '#eef3f7' },
    { name: 'серый', hex: '#8f9499' },
  ],
  винный: [
    { name: 'черный', hex: '#171717' },
    { name: 'стальной', hex: '#d7dde5' },
    { name: 'графит', hex: '#3f4652' },
  ],
  красный: [
    { name: 'синий деним', hex: '#3f6f9f' },
    { name: 'белый', hex: '#ffffff' },
    { name: 'черный', hex: '#171717' },
  ],
  оранжевый: [
    { name: 'темно-синий', hex: '#1f365c' },
    { name: 'молочный', hex: '#f4efe7' },
    { name: 'коричневый', hex: '#6a4a35' },
  ],
  желтый: [
    { name: 'синий деним', hex: '#3f6f9f' },
    { name: 'серый', hex: '#8f9499' },
    { name: 'белый', hex: '#ffffff' },
  ],
  зеленый: [
    { name: 'белый', hex: '#ffffff' },
    { name: 'синий деним', hex: '#3f6f9f' },
    { name: 'черный', hex: '#171717' },
  ],
  голубой: [
    { name: 'белый', hex: '#ffffff' },
    { name: 'графитовый', hex: '#232832' },
    { name: 'лимонный', hex: '#efd96f' },
  ],
  синий: [
    { name: 'белый', hex: '#ffffff' },
    { name: 'серый', hex: '#8f9499' },
    { name: 'бордовый', hex: '#6f1836' },
  ],
  розовый: [
    { name: 'серый', hex: '#8f9499' },
    { name: 'белый', hex: '#ffffff' },
    { name: 'темно-синий', hex: '#1f365c' },
  ],
  'холодный мятный': [
    { name: 'ледяной', hex: '#e5ebf1' },
    { name: 'графитовый', hex: '#232832' },
    { name: 'черный', hex: '#171717' },
  ],
  'серый шалфей': [
    { name: 'светло-серый', hex: '#d7dde5' },
    { name: 'белый', hex: '#ffffff' },
    { name: 'дымчато-синий', hex: '#5f6f86' },
  ],
  'светло-золотой': [
    { name: 'серый', hex: '#8f9499' },
    { name: 'фарфоровый', hex: '#eef3f7' },
    { name: 'темно-синий', hex: '#1f365c' },
  ],
  чернильный: [
    { name: 'серый', hex: '#8f9499' },
    { name: 'ледяной', hex: '#e5ebf1' },
    { name: 'черный', hex: '#171717' },
  ],
  'стальной синий': [
    { name: 'темно-синий', hex: '#1f365c' },
    { name: 'ледяной', hex: '#e5ebf1' },
    { name: 'графитовый', hex: '#232832' },
  ],
  золотой: [
    { name: 'фарфоровый', hex: '#eef3f7' },
    { name: 'серый', hex: '#8f9499' },
    { name: 'серый шалфей', hex: '#7b8fa3' },
  ],
};

const seasonalAccents: Record<string, PaletteColor> = {
  весна: { name: 'светло-золотой', hex: '#ead28a' },
  лето: { name: 'светлый винный', hex: '#d8b4c2' },
  осень: { name: 'дымчато-синий', hex: '#5f6f86' },
  зима: { name: 'ледяной', hex: '#d9edf2' },
};

const starterResult =
  'Выбери город, конкретную вещь из гардероба и нажми "Сгенерировать образ". Генератор проверит погоду и подберет комплект под температуру, стиль и палитру.';

function getColorByName(name: string) {
  return wardrobeColors.find((color) => color.name === name) ?? wardrobeColors[0];
}

function buildPalette(form: OutfitForm): PaletteColor[] {
  const base = getColorByName(form.wardrobeColor);
  const pairs = colorPairs[base.name] ?? colorPairs.черный;
  const seasonal = seasonalAccents[form.season] ?? seasonalAccents.весна;
  return [base, ...pairs, seasonal];
}

function getWeatherDescription(code: number) {
  if (code === 0) return 'ясно';
  if ([1, 2, 3].includes(code)) return 'переменная облачность';
  if ([45, 48].includes(code)) return 'туман';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'дождь';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'снег';
  if ([95, 96, 99].includes(code)) return 'гроза';
  return 'погода без сильных особенностей';
}

async function fetchWeather(place: string): Promise<WeatherInfo | null> {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    place,
  )}&count=1&language=ru&format=json`;
  const geocodingResponse = await fetch(geocodingUrl);
  if (!geocodingResponse.ok) return null;

  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;
  const city = geocodingData.results?.[0];
  if (!city) return null;

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`;
  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) return null;

  const forecastData = (await forecastResponse.json()) as ForecastResponse;
  const current = forecastData.current;
  if (!current || current.temperature_2m === undefined) return null;

  return {
    city: city.name,
    country: city.country ?? '',
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    precipitation: current.precipitation ?? 0,
    description: getWeatherDescription(current.weather_code ?? 0),
  };
}

function getWeatherText(weather: WeatherInfo | null) {
  if (!weather) return 'Погоду найти не удалось. Ориентируйся на выбранный сезон и проверь прогноз перед выходом.';
  return `${weather.city}${weather.country ? `, ${weather.country}` : ''}: ${weather.temperature}°C, ощущается как ${
    weather.feelsLike
  }°C, ${weather.description}, ветер ${weather.windSpeed} км/ч, осадки ${weather.precipitation} мм.`;
}

function buildPrompt(form: OutfitForm, palette: PaletteColor[], weather: WeatherInfo | null, photo: UploadedPhoto | null) {
  const paletteText = palette.map((color) => color.name).join(', ');

  return `Создай полный outfit на русском языке.

Параметры:
- настроение: ${form.mood}
- сезон: ${form.season}
- пол/стиль посадки: ${form.gender}
- бюджет: ${form.budget}
- город или событие: ${form.place}
- погода: ${getWeatherText(weather)}
- конкретная вещь, которая уже есть в гардеробе: ${form.itemType}
- цвет вещи, которая уже есть в гардеробе: ${form.wardrobeColor}
- фото вещи: ${photo ? `пользователь загрузил фото "${photo.name}", учитывай его как главный предмет` : 'фото не загружено'}
- цвета, которые лучше всего подходят к нему: ${paletteText}

Ответ сделай ярким, дружелюбным и вдохновляющим. Используй уместные смайлики в заголовках и советах.

Структура ответа:
1. ✨ Название образа
2. 👕 Полный образ: верх, низ, обувь, верхняя одежда или слой, сумка/рюкзак
3. 🌦️ Погода и комфорт: как температура, ветер или осадки влияют на выбор вещей
4. 🎨 Почему цвета работают: объясни сочетание выбранного цвета из гардероба с остальными
5. 💫 Описание каждой вещи: материал, фасон, цвет, почему подходит
6. 👜 Аксессуары: 3-5 идей
7. 🏷️ Бренды, которые подойдут: 4 бренда под бюджет и стиль

Главное: отталкивайся от вещи "${form.itemType}" цвета "${form.wardrobeColor}", а если фото загружено, считай его главным референсом. Учитывай погоду, если она найдена.`;
}

function getBrands(form: OutfitForm) {
  const brands = brandsByBudget[form.budget] ?? brandsByBudget.средний;

  if (form.mood === 'спортивное') {
    return [
      { name: 'Nike', reason: 'кроссовки, худи и спортивные детали' },
      { name: 'Adidas', reason: 'удобная обувь и athleisure-стиль' },
      ...brands.slice(0, 2),
    ];
  }

  if (form.mood === 'элегантное') {
    return [
      { name: 'Mango', reason: 'жакеты, брюки и аккуратные силуэты' },
      { name: 'Massimo Dutti', reason: 'спокойные премиальные детали' },
      ...brands.slice(0, 2),
    ];
  }

  if (form.mood === 'уличное' || form.mood === 'дерзкое') {
    return [
      { name: 'Bershka', reason: 'яркие детали, деним и street style' },
      { name: 'Pull&Bear', reason: 'расслабленные силуэты и повседневная база' },
      { name: 'Nike', reason: 'кроссовки и спортивные акценты' },
      ...brands.slice(0, 1),
    ];
  }

  if (form.mood === 'винтажное' || form.mood === 'уютное') {
    return [
      { name: 'Uniqlo', reason: 'мягкая база, трикотаж и спокойные цвета' },
      { name: 'Mango', reason: 'кардиганы, пальто и аккуратные силуэты' },
      ...brands.slice(0, 2),
    ];
  }

  return brands;
}

function getWeatherLayer(weather: WeatherInfo | null, season: string) {
  if (!weather) {
    if (season === 'зима') return 'теплое пальто или пуховик прямого кроя';
    if (season === 'лето') return 'легкая рубашка нараспашку или тонкий кардиган';
    return 'тренч, джинсовка или мягкий жакет';
  }

  if (weather.feelsLike <= 0) return 'пуховик, теплое пальто, шарф и шапка';
  if (weather.feelsLike <= 10) return 'пальто, плотный жакет или утепленная куртка';
  if (weather.feelsLike <= 18) return 'тренч, джинсовка или кардиган';
  if (weather.feelsLike >= 28) return 'легкая рубашка, лен или хлопок без тяжелых слоев';
  return 'легкий слой, который можно снять днем';
}

function buildFallbackOutfit(form: OutfitForm, palette: PaletteColor[], weather: WeatherInfo | null) {
  const layer = getWeatherLayer(weather, form.season);
  const shoes =
    weather?.precipitation && weather.precipitation > 0
      ? 'закрытая обувь с нескользкой подошвой'
      : form.mood === 'спортивное'
        ? 'чистые кроссовки'
        : form.mood === 'элегантное'
          ? 'лоферы или аккуратные ботинки'
          : 'удобные кеды или ботинки';
  const [baseColor, secondColor, thirdColor, accessoryColor] = palette;
  const brandText = getBrands(form)
    .map((brand) => `- ${brand.name}: ${brand.reason}`)
    .join('\n');

  return `✨ Название образа
${form.mood} образ вокруг цвета "${baseColor.name}" — выглядит собранно, свежо и подходит под погоду 😎

👕 Полный образ
Вещь из гардероба: оставь главным акцентом ${form.itemType} цвета "${baseColor.name}".
Верх: базовая футболка, рубашка или лонгслив в оттенке "${secondColor.name}".
Низ: прямые джинсы, брюки или юбка в цвете "${thirdColor.name}".
Слой: ${layer}.
Обувь: ${shoes}.
Сумка: компактная сумка или рюкзак с деталью цвета "${accessoryColor.name}".

🌦️ Погода и комфорт
${getWeatherText(weather)}
Если на улице прохладно или ветрено, добавь плотный слой. Если жарко, выбирай хлопок, лен и свободную посадку. При дождe лучше взять закрытую обувь и сумку, которую не жалко намочить.

🎨 Почему цвета подходят
${baseColor.name} остается главным цветом, а "${secondColor.name}" делает образ спокойнее и дороже на вид.
"${thirdColor.name}" добавляет баланс, чтобы комплект не выглядел случайным.
"${accessoryColor.name}" лучше использовать точечно: сумка, ремень, украшение или носки ✨

💫 Описание вещей
Верх выбирай из хлопка или мягкого трикотажа: он будет удобным и не перетянет внимание на себя.
Низ лучше взять прямого кроя: такой силуэт легко носить и в школу, и на прогулку.
Слой помогает сделать outfit более продуманным, особенно если погода меняется в течение дня.
Обувь должна быть удобной: красивый образ сразу становится лучше, когда в нем реально можно ходить 🙂

👜 Аксессуары
1. Ремень в цвет обуви.
2. Украшение или часы без лишнего блеска.
3. Сумка простой формы.
4. Маленький акцент в цвете "${accessoryColor.name}".

🏷️ Бренды, которые подойдут
${brandText}

🌦️ Маленький совет
Для бюджета "${form.budget}" сначала используй вещь, которая уже есть в гардеробе, а докупай только базу: верх, обувь или аксессуар.`;
}

function buildPhotoPrompt(form: OutfitForm, palette: PaletteColor[], weather: WeatherInfo | null, photo: UploadedPhoto | null) {
  const brands = getBrands(form)
    .map((brand) => brand.name)
    .join(', ');
  const colors = palette.map((color) => color.name).join(', ');
  const catalogItems = getCatalogItems(form, palette);
  const catalogText = catalogItems
    .map((item) => `${item.brand} ${item.title} (${item.itemType}, цвета: ${item.colors.join('/')})`)
    .join('; ');

  return `Фотореалистичный fashion lookbook снимок, полный рост, современный подростковый outfit.
Стиль: ${form.mood}. Сезон: ${form.season}. Посадка/пол: ${form.gender}. Бюджет: ${form.budget}.
Место или событие: ${form.place || 'городская прогулка'}. Погода: ${getWeatherText(weather)}.
Главная вещь из гардероба: ${form.itemType}. Главный цвет: ${form.wardrobeColor}. Подходящая палитра: ${colors}.
Фото вещи пользователя: ${photo ? `загружено фото "${photo.name}", одежда должна быть максимально похожа на эту вещь` : 'нет загруженного фото'}.
Используй только вещи из брендового каталога: ${catalogText}.
Одежда должна выглядеть как реальный комплект из этих брендовых вещей: верх, низ, слой по погоде, обувь, сумка и аксессуары.
Подходящие бренды по вайбу: ${brands}.
Белый чистый фон, мягкий дневной свет, детальная фактура ткани, натуральная поза, editorial street style, high detail, realistic photo, no text, no watermark.`;
}

function getCatalogItems(form: OutfitForm, palette: PaletteColor[]) {
  const paletteNames = palette.map((color) => color.name);
  const exact = brandCatalog.filter(
    (item) =>
      item.itemType === form.itemType &&
      (item.budget === form.budget || form.budget === 'премиум') &&
      item.colors.some((color) => color === form.wardrobeColor || paletteNames.includes(color)),
  );
  const styled = brandCatalog.filter(
    (item) =>
      item.itemType !== form.itemType &&
      (item.budget === form.budget || form.budget === 'премиум') &&
      item.styles.includes(form.mood) &&
      item.colors.some((color) => paletteNames.includes(color)),
  );
  const basics = brandCatalog.filter(
    (item) =>
      ['футболка', 'рубашка', 'джинсы', 'брюки', 'кроссовки', 'сумка'].includes(item.itemType) &&
      item.colors.some((color) => paletteNames.includes(color)),
  );

  const unique = [...exact, ...styled, ...basics].filter(
    (item, index, items) => items.findIndex((candidate) => candidate.brand === item.brand && candidate.title === item.title) === index,
  );

  return unique.slice(0, 6);
}

function getRecommendedBrandProducts(products: BrandProduct[], form: OutfitForm, palette: PaletteColor[]) {
  const paletteNames = palette.map((color) => color.name);
  const scored = products.map((product) => {
    let score = 0;
    if (product.item_type === form.itemType) score += 4;
    if (product.color === form.wardrobeColor || paletteNames.includes(product.color)) score += 3;
    if (product.budget === form.budget) score += 2;
    if (product.style === form.mood) score += 2;
    if (product.season === form.season || product.season === 'всесезон') score += 1;
    return { product, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product)
    .slice(0, 6);
}

function formatProductPrice(price: number | null, currency: string) {
  if (price === null) return 'Цена не указана';
  return `${Math.round(price).toLocaleString('ru-RU')} ${currency}`;
}

const remakeOptions = [
  { label: 'Теплее', instruction: 'сделай образ теплее, добавь слой, закрытую обувь и уютные аксессуары' },
  { label: 'Дешевле', instruction: 'сделай образ дешевле, оставь стиль, но предложи доступные альтернативы' },
  { label: 'Наряднее', instruction: 'сделай образ наряднее, добавь праздничные детали и более аккуратные силуэты' },
  { label: 'В школу', instruction: 'адаптируй образ для школы: удобно, аккуратно, без перегруза' },
  { label: 'Дерзко', instruction: 'сделай образ более дерзким: контраст, street style, заметные аксессуары' },
];

const todayActionOptions = [
  { label: 'Теплее', mood: 'уютное', itemType: 'свитер' },
  { label: 'Наряднее', mood: 'элегантное', itemType: 'жакет' },
  { label: 'В школу', mood: 'спокойное', itemType: 'рубашка' },
];

const eventOptions = [
  { label: 'Школа', place: 'школа', mood: 'спокойное', itemType: 'рубашка' },
  { label: 'Прогулка', place: 'городская прогулка', mood: 'уличное', itemType: 'джинсы' },
  { label: 'Свидание', place: 'свидание', mood: 'романтичное', itemType: 'жакет' },
  { label: 'День рождения', place: 'день рождения', mood: 'праздничное', itemType: 'жакет' },
  { label: 'Ресторан', place: 'ресторан', mood: 'элегантное', itemType: 'брюки' },
  { label: 'Поездка', place: 'поездка', mood: 'уютное', itemType: 'худи' },
];

function withoutDresses(options: string[], avoidDresses?: boolean) {
  return avoidDresses ? options.filter((option) => option !== 'платье') : options;
}

function buildDailyTip(form: OutfitForm, weather: WeatherInfo | null, profile: ProfilePreferences | null) {
  const brandText = profile?.preferred_brands?.length ? ` Из брендов сначала смотри: ${profile.preferred_brands.slice(0, 3).join(', ')}.` : '';
  if (weather?.precipitation && weather.precipitation > 0) {
    return `Сегодня лучше взять закрытую обувь и сумку, которую не страшно намочить.${brandText}`;
  }
  if (weather && weather.feelsLike <= 8) {
    return `Добавь теплый слой: пальто, плотный жакет или свитер. Образ останется аккуратным, если низ будет спокойным.${brandText}`;
  }
  if (weather && weather.feelsLike >= 27) {
    return `Выбирай легкий верх и свободную посадку. Один контрастный аксессуар сделает образ дороже.${brandText}`;
  }
  return `Для "${form.mood}" образа держи один главный акцент: ${form.itemType} ${form.wardrobeColor}, а остальное сделай спокойнее.${brandText}`;
}

function buildWardrobeAudit(items: WardrobeItem[]) {
  const itemTypes = new Set(items.map((item) => item.item_type));
  const colors = new Set(items.map((item) => item.color));
  const suggestions: string[] = [];

  if (items.length === 0) suggestions.push('Добавь хотя бы 5-7 вещей: верх, низ, обувь, слой и сумку.');
  if (!itemTypes.has('жакет') && !itemTypes.has('кардиган')) suggestions.push('Не хватает аккуратного слоя: жакет или кардиган сильно расширит варианты.');
  if (!itemTypes.has('брюки') && !itemTypes.has('джинсы')) suggestions.push('Добавь базовый низ: прямые джинсы или брюки.');
  if (!itemTypes.has('кроссовки') && !itemTypes.has('ботинки')) suggestions.push('Нужна удобная обувь, чтобы образы были носибельными.');
  if (!itemTypes.has('сумка')) suggestions.push('Сумка делает комплект законченным, добавь хотя бы одну базовую.');
  if (colors.size <= 2 && items.length >= 4) suggestions.push('Палитра слишком узкая: добавь один светлый или акцентный цвет.');

  return suggestions.slice(0, 4);
}

function buildWeekCalendar(form: OutfitForm, palette: PaletteColor[]) {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const events = ['школа', 'прогулка', 'дела', 'встреча', 'пятница', 'выходной', 'спокойный день'];
  return days.map((day, index) => ({
    day,
    event: events[index],
    title: index % 2 === 0 ? `${form.itemType} + ${palette[index % palette.length].name}` : `${form.mood} база`,
  }));
}

function buildRemakePrompt(
  form: OutfitForm,
  palette: PaletteColor[],
  weather: WeatherInfo | null,
  currentOutfit: string,
  instruction: string,
) {
  return `Переделай текущий outfit на русском языке.

Задача: ${instruction}.

Параметры:
- настроение: ${form.mood}
- сезон: ${form.season}
- бюджет: ${form.budget}
- город или событие: ${form.place}
- погода: ${getWeatherText(weather)}
- главная вещь: ${form.itemType}
- цвет главной вещи: ${form.wardrobeColor}
- палитра: ${palette.map((color) => color.name).join(', ')}

Текущий образ:
${currentOutfit}

Дай новый вариант по разделам: название, полный образ, что поменялось, аксессуары, бренды, маленький совет. Пиши ярко, коротко и со смайликами.`;
}

function buildRemakeFallback(form: OutfitForm, palette: PaletteColor[], weather: WeatherInfo | null, label: string) {
  const [baseColor, secondColor, thirdColor, accentColor] = palette;
  const layer = getWeatherLayer(weather, form.season);

  return `✨ Новый вариант: ${label}

Главная вещь остается: ${form.itemType} цвета "${baseColor.name}".

👕 Что надеть
Верх/основа: ${form.itemType} в цвете "${baseColor.name}".
Низ: джинсы, брюки или юбка в оттенке "${thirdColor.name}".
Слой: ${layer}.
Обувь: удобная пара в спокойном цвете, чтобы не спорить с главным акцентом.
Акцент: "${accentColor.name}" через сумку, украшение или ремень.

🎨 Цвета
"${secondColor.name}" смягчит образ, а "${thirdColor.name}" добавит баланс.

🌦️ Комфорт
${getWeatherText(weather)}

🏷️ Бренды
${getBrands(form)
  .map((brand) => `- ${brand.name}: ${brand.reason}`)
  .join('\n')}`;
}

function buildCapsulePlan(form: OutfitForm, palette: PaletteColor[], weather: WeatherInfo | null) {
  const [baseColor, secondColor, thirdColor, accentColor, seasonalColor] = palette;
  const layer = getWeatherLayer(weather, form.season);

  return [
    {
      day: 'Понедельник',
      title: 'спокойная база',
      text: `${form.itemType} цвета "${baseColor.name}" + низ "${thirdColor.name}" + ${layer}.`,
    },
    {
      day: 'Вторник',
      title: 'городская прогулка',
      text: `${form.itemType} + деним/брюки + акцент "${accentColor.name}" в сумке или ремне.`,
    },
    {
      day: 'Среда',
      title: 'аккуратный день',
      text: `Добавь верх или слой "${secondColor.name}", простую обувь и минимальные аксессуары.`,
    },
    {
      day: 'Четверг',
      title: 'чуть ярче',
      text: `Повтори "${baseColor.name}" дважды: в главной вещи и маленьком аксессуаре.`,
    },
    {
      day: 'Пятница',
      title: 'выходной вайб',
      text: `Смешай "${thirdColor.name}" и "${seasonalColor.name}", добавь удобную обувь и сумку.`,
    },
  ];
}

function getOutfitScores(form: OutfitForm, weather: WeatherInfo | null): OutfitScore[] {
  const weatherScore = !weather
    ? 74
    : weather.feelsLike < -5 || weather.feelsLike > 32 || weather.precipitation > 3
      ? 72
      : weather.feelsLike < 8 || weather.feelsLike > 27 || weather.windSpeed > 25
        ? 82
        : 94;
  const comfortScore = ['спортивное', 'спокойное', 'уютное', 'уличное'].includes(form.mood) ? 92 : 84;
  const budgetScore = form.budget === 'эконом' ? 95 : form.budget === 'средний' ? 88 : 78;
  const styleScore = ['элегантное', 'праздничное', 'дерзкое', 'уличное'].includes(form.mood) ? 94 : 87;

  return [
    {
      label: 'Стиль',
      value: styleScore,
      note: styleScore > 90 ? 'образ выглядит выразительно' : 'можно добавить акцентный аксессуар',
    },
    {
      label: 'Комфорт',
      value: comfortScore,
      note: comfortScore > 90 ? 'удобно на каждый день' : 'проверь посадку и обувь',
    },
    {
      label: 'Погода',
      value: weatherScore,
      note: weather ? 'учтены температура и осадки' : 'точная погода пока не найдена',
    },
    {
      label: 'Бюджет',
      value: budgetScore,
      note: budgetScore > 90 ? 'легко собрать из базы' : 'лучше докупить 1-2 ключевые вещи',
    },
  ];
}

function getStyleVerdict(scores: OutfitScore[]) {
  const average = Math.round(scores.reduce((sum, score) => sum + score.value, 0) / scores.length);
  if (average >= 90) return `Сильный образ: ${average}/100. Можно смело сохранять в коллекцию.`;
  if (average >= 82) return `Хороший образ: ${average}/100. Один аксессуар сделает его заметнее.`;
  return `База есть: ${average}/100. Попробуй кнопку "Наряднее" или "Дерзко".`;
}

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month === 11 || month <= 1) return 'зима';
  if (month >= 2 && month <= 4) return 'весна';
  if (month >= 5 && month <= 7) return 'лето';
  return 'осень';
}

function getMoodFromProfileStyle(style: string) {
  const styleMap: Record<string, string> = {
    спокойный: 'спокойное',
    уличный: 'уличное',
    элегантный: 'элегантное',
    спортивный: 'спортивное',
    винтажный: 'винтажное',
    минимализм: 'минималистичное',
  };

  return moodOptions.includes(style) ? style : styleMap[style] ?? moodOptions[0];
}

function getColorFromProfile(colors: string[]) {
  return colors.find((color) => wardrobeColors.some((option) => option.name === color)) ?? wardrobeColors[0].name;
}

function getTodayBaseItem(season: string) {
  if (season === 'зима') return 'свитер';
  if (season === 'лето') return 'футболка';
  if (season === 'осень') return 'куртка';
  return 'рубашка';
}

function getTodayWardrobeItem(items: WardrobeItem[], season: string, colors: string[]) {
  const preferredColors = colors.filter(Boolean);
  return (
    items.find((item) => item.season === season && preferredColors.includes(item.color)) ??
    items.find((item) => item.season === 'всесезон' && preferredColors.includes(item.color)) ??
    items.find((item) => item.season === season) ??
    items.find((item) => item.season === 'всесезон') ??
    items[0] ??
    null
  );
}

export function OutfitGenerator({
  autoToday = false,
  selectedWardrobeItem,
  selectedProduct,
  userId,
  userEmail,
}: {
  autoToday?: boolean;
  selectedWardrobeItem: WardrobePick | null;
  selectedProduct: BrandProduct | null;
  userId: string;
  userEmail: string;
}) {
  const [form, setForm] = useState<OutfitForm>({
    mood: moodOptions[0],
    season: seasonOptions[0],
    gender: genderOptions[2],
    budget: budgetOptions[1],
    place: '',
    itemType: itemTypeOptions[0],
    wardrobeColor: wardrobeColors[0].name,
    wardrobeItemId: '',
  });
  const [result, setResult] = useState(starterResult);
  const [error, setError] = useState('');
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [weatherStatus, setWeatherStatus] = useState('Погода появится после генерации, если в поле указан город.');
  const [photoPrompt, setPhotoPrompt] = useState('');
  const [photoReady, setPhotoReady] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhoto | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayLoading, setTodayLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profilePreferences, setProfilePreferences] = useState<ProfilePreferences | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([]);
  const [remakeLoading, setRemakeLoading] = useState('');
  const [capsulePlan, setCapsulePlan] = useState<Array<{ day: string; title: string; text: string }>>([]);
  const [detailTab, setDetailTab] = useState<DetailTab>('look');
  const [recentOutfits, setRecentOutfits] = useState<RecentOutfit[]>(() => loadRecentOutfits(userId));
  const resultRef = useRef<HTMLElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const autoTodayStartedRef = useRef(false);

  const palette = useMemo(() => buildPalette(form), [form]);
  const brands = useMemo(() => {
    const preferred = profilePreferences?.preferred_brands ?? [];
    const preferredSuggestions = preferred.map((name) => ({ name, reason: 'любимый бренд из профиля' }));
    const base = getBrands(form).filter((brand) => !preferred.includes(brand.name));
    return [...preferredSuggestions, ...base].slice(0, 4);
  }, [form, profilePreferences]);
  const catalogItems = useMemo(() => getCatalogItems(form, palette), [form, palette]);
  const recommendedProducts = useMemo(() => getRecommendedBrandProducts(brandProducts, form, palette), [brandProducts, form, palette]);
  const outfitScores = useMemo(() => getOutfitScores(form, weatherInfo), [form, weatherInfo]);
  const modeDetailTabs = autoToday ? todayDetailTabs : generatorDetailTabs;
  const visibleItemTypeOptions = useMemo(
    () => withoutDresses(itemTypeOptions, profilePreferences?.avoid_dresses),
    [profilePreferences?.avoid_dresses],
  );
  const wardrobeAudit = useMemo(() => buildWardrobeAudit(wardrobeItems), [wardrobeItems]);
  const weekCalendar = useMemo(() => buildWeekCalendar(form, palette), [form, palette]);
  const dailyTip = useMemo(() => buildDailyTip(form, weatherInfo, profilePreferences), [form, weatherInfo, profilePreferences]);
  const activeWardrobeItem = useMemo(
    () => wardrobeItems.find((item) => item.id === form.wardrobeItemId) ?? null,
    [form.wardrobeItemId, wardrobeItems],
  );

  useEffect(() => {
    setRecentOutfits(loadRecentOutfits(userId));
  }, [userId]);

  useEffect(() => {
    if (!profilePreferences?.avoid_dresses || form.itemType !== 'платье') return;
    setForm((current) => ({ ...current, itemType: 'жакет' }));
  }, [form.itemType, profilePreferences?.avoid_dresses]);

  useEffect(() => {
    async function loadProfilePreferences() {
      setProfileLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('city, favorite_style, budget, favorite_colors, preferred_brands, avoid_dresses')
        .eq('user_id', userId)
        .maybeSingle<ProfilePreferences>();

      if (error && isMissingProfilePreferenceColumn(error.message)) {
        const { data: baseData } = await supabase
          .from('profiles')
          .select('city, favorite_style, budget, favorite_colors')
          .eq('user_id', userId)
          .maybeSingle<ProfilePreferences>();

        setProfilePreferences(baseData ?? null);
      } else {
        setProfilePreferences(data ?? null);
      }
      setProfileLoading(false);
    }

    loadProfilePreferences();
  }, [userId]);

  useEffect(() => {
    async function loadWardrobeItems() {
      const { data } = await supabase
        .from('wardrobe_items')
        .select('id, name, item_type, color, season, notes, is_favorite')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      setWardrobeItems(data ?? []);
    }

    loadWardrobeItems();
  }, [userId]);

  useEffect(() => {
    async function loadBrandProducts() {
      const { data } = await supabase
        .from('brand_products')
        .select('id, brand, title, item_type, color, season, style, budget, price, currency, image_url, product_url, notes, is_favorite, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setBrandProducts(data ?? []);
    }

    loadBrandProducts();
  }, [userId]);

  useEffect(() => {
    if (!selectedProduct) return;

    setForm((current) => ({
      ...current,
      mood: selectedProduct.style || current.mood,
      season: selectedProduct.season === 'всесезон' ? current.season : selectedProduct.season,
      budget: selectedProduct.budget || current.budget,
      itemType: selectedProduct.item_type,
      wardrobeColor: selectedProduct.color,
      wardrobeItemId: '',
    }));
    setDetailTab('look');
    setPhotoReady(false);

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedWardrobeItem) return;

    setForm((current) => ({
      ...current,
      itemType: selectedWardrobeItem.item_type,
      wardrobeColor: selectedWardrobeItem.color,
      season: selectedWardrobeItem.season === 'всесезон' ? current.season : selectedWardrobeItem.season,
      wardrobeItemId: selectedWardrobeItem.id,
    }));
    setDetailTab('look');
    setPhotoReady(false);
    setSaveMessage(`Выбрана вещь: ${selectedWardrobeItem.name}`);

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [selectedWardrobeItem]);

  function updateField(field: keyof OutfitForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setPhotoReady(false);
  }

  function moveToResult(nextTab: DetailTab = 'look') {
    setDetailTab(nextTab);
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function openDetailTab(nextTab: DetailTab) {
    setDetailTab(nextTab);
    if (nextTab === 'photo' && !photoReady) generatePhotoReference();
    if (nextTab === 'capsule' && capsulePlan.length === 0) generateCapsule();

    window.setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function selectWardrobeItem(itemId: string) {
    const item = wardrobeItems.find((wardrobeItem) => wardrobeItem.id === itemId);
    const nextItemType = profilePreferences?.avoid_dresses && item?.item_type === 'платье' ? 'жакет' : item?.item_type;
    setForm((current) => ({
      ...current,
      wardrobeItemId: itemId,
      itemType: nextItemType ?? current.itemType,
      wardrobeColor: item?.color ?? current.wardrobeColor,
      season: item && item.season !== 'всесезон' ? item.season : current.season,
    }));
    setPhotoReady(false);
  }

  function applyEventOption(option: (typeof eventOptions)[number]) {
    const nextItemType = profilePreferences?.avoid_dresses && option.itemType === 'платье' ? 'жакет' : option.itemType;
    setForm((current) => ({
      ...current,
      mood: option.mood,
      place: current.place.trim() ? `${current.place.trim()}, ${option.place}` : option.place,
      itemType: nextItemType,
    }));
    setPhotoReady(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function generatePhotoReference() {
    setPhotoPrompt(buildPhotoPrompt(form, palette, weatherInfo, uploadedPhoto));
    setPhotoReady(true);
  }

  async function uploadWardrobePhoto(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Можно загрузить только картинку.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('wardrobe-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      setError(`Фото не загрузилось: ${uploadError.message}`);
      setUploadingPhoto(false);
      return;
    }

    const { data } = await supabase.storage.from('wardrobe-photos').createSignedUrl(path, 60 * 60);
    setUploadedPhoto({ path, url: data?.signedUrl ?? '', name: file.name });
    setUploadingPhoto(false);
  }

  async function saveCurrentOutfit() {
    setSaveMessage('');

    const title = `${form.itemType} ${form.wardrobeColor} · ${form.mood}`;
    const { error: saveError } = await supabase.from('saved_outfits').insert({
      user_id: userId,
      title,
      outfit_text: result,
      photo_prompt: photoPrompt,
      season: form.season,
      mood: form.mood,
      wardrobe_color: form.wardrobeColor,
      item_type: form.itemType,
      form: {
        ...form,
        uploadedPhotoPath: uploadedPhoto?.path ?? '',
        uploadedPhotoName: uploadedPhoto?.name ?? '',
      },
    });

    setSaveMessage(saveError ? saveError.message : 'Образ сохранен в коллекцию.');
  }

  async function remakeOutfit(label: string, instruction: string) {
    setRemakeLoading(label);
    setError('');

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ text?: string; error?: string }>(
        'ai',
        {
          body: {
            prompt: buildRemakePrompt(form, palette, weatherInfo, result, instruction),
            system:
              'Ты fashion-стилист. Переделываешь уже созданный образ под конкретную задачу. Отвечай на русском, ярко, практично и кратко.',
          },
        },
      );

      if (invokeError || data?.error || !data?.text?.trim()) {
        setResult(buildRemakeFallback(form, palette, weatherInfo, label));
        setError('AI сейчас недоступен, поэтому я переделал образ без него.');
        return;
      }

      setResult(data.text.trim());
    } catch {
      setResult(buildRemakeFallback(form, palette, weatherInfo, label));
      setError('AI сейчас недоступен, поэтому я переделал образ без него.');
    } finally {
      setRemakeLoading('');
    }
  }

  function generateCapsule() {
    setCapsulePlan(buildCapsulePlan(form, palette, weatherInfo));
  }

  function rememberOutfit(nextForm: OutfitForm, text: string) {
    const nextItem: RecentOutfit = {
      id: `${Date.now()}`,
      title: `${nextForm.itemType} ${nextForm.wardrobeColor}`,
      text,
      form: nextForm,
      createdAt: new Date().toISOString(),
    };
    const nextItems = [nextItem, ...recentOutfits].slice(0, 5);
    setRecentOutfits(nextItems);
    saveRecentOutfits(userId, nextItems);
  }

  function restoreRecentOutfit(item: RecentOutfit) {
    setForm(item.form);
    setResult(item.text);
    setPhotoReady(false);
    setSaveMessage(`Вернули образ: ${item.title}`);
    moveToResult('look');
  }

  async function generateOutfitFromForm(baseForm: OutfitForm, mode: 'manual' | 'today') {
    const cleanPlace = baseForm.place.trim();

    if (!cleanPlace) {
      setError(
        mode === 'today'
          ? 'Чтобы собрать образ на сегодня, заполни город в профиле или в поле генератора.'
          : 'Напиши город или событие, чтобы образ был точнее.',
      );
      return;
    }

    const preparedForm = { ...baseForm, place: cleanPlace };
    const preparedPalette = buildPalette(preparedForm);

    if (mode === 'today') setTodayLoading(true);
    else setLoading(true);

    setError('');
    setWeatherStatus('Проверяю погоду...');
    setForm(preparedForm);

    const weather = await fetchWeather(cleanPlace).catch(() => null);
    setWeatherInfo(weather);
    setWeatherStatus(weather ? getWeatherText(weather) : 'Город не найден, поэтому образ собран без точной погоды.');

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ text?: string; error?: string }>(
        'ai',
        {
          body: {
            prompt: buildPrompt(preparedForm, preparedPalette, weather, uploadedPhoto),
            system:
              'Ты fashion-стилист. Подбираешь образ вокруг цвета из гардероба и обязательно учитываешь погоду, если она дана. Пиши красочно, дружелюбно, с уместными смайликами. Добавь бренды под бюджет и стиль.',
          },
        },
      );

      if (invokeError || data?.error || !data?.text?.trim()) {
        const fallback = buildFallbackOutfit(preparedForm, preparedPalette, weather);
        setResult(fallback);
        rememberOutfit(preparedForm, fallback);
        setError('AI сейчас недоступен, поэтому я собрал образ без него.');
        return;
      }

      const generated = data.text.trim();
      setResult(generated);
      rememberOutfit(preparedForm, generated);
    } catch {
      const fallback = buildFallbackOutfit(preparedForm, preparedPalette, weather);
      setResult(fallback);
      rememberOutfit(preparedForm, fallback);
      setError('AI сейчас недоступен, поэтому я собрал образ без него.');
    } finally {
      if (mode === 'today') setTodayLoading(false);
      else setLoading(false);
      moveToResult('look');
    }
  }

  async function generateOutfit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await generateOutfitFromForm(form, 'manual');
  }

  async function generateTodayOutfit() {
    if (profileLoading) {
      setError('Профиль еще загружается. Попробуй через пару секунд.');
      return;
    }

    const city = profilePreferences?.city.trim() || form.place.trim();
    const season = getCurrentSeason();
    const profileColors = profilePreferences?.favorite_colors ?? [form.wardrobeColor];
    const usableWardrobeItems = profilePreferences?.avoid_dresses
      ? wardrobeItems.filter((item) => item.item_type !== 'платье')
      : wardrobeItems;
    const wardrobeItem = getTodayWardrobeItem(usableWardrobeItems, season, profileColors);
    const todayForm: OutfitForm = {
      ...form,
      mood: getMoodFromProfileStyle(profilePreferences?.favorite_style ?? form.mood),
      season,
      budget: budgetOptions.includes(profilePreferences?.budget ?? '') ? profilePreferences?.budget ?? form.budget : form.budget,
      place: city,
      itemType: wardrobeItem?.item_type ?? getTodayBaseItem(season),
      wardrobeColor: wardrobeItem?.color ?? getColorFromProfile(profileColors),
      wardrobeItemId: wardrobeItem?.id ?? '',
    };

    await generateOutfitFromForm(todayForm, 'today');
  }

  async function generateTodayVariant(mood: string, itemType: string) {
    const city = profilePreferences?.city.trim() || form.place.trim();
    const season = getCurrentSeason();
    const profileColors = profilePreferences?.favorite_colors ?? [form.wardrobeColor];
    const usableWardrobeItems = profilePreferences?.avoid_dresses
      ? wardrobeItems.filter((item) => item.item_type !== 'платье')
      : wardrobeItems;
    const wardrobeItem = getTodayWardrobeItem(
      usableWardrobeItems.filter((item) => item.item_type === itemType || item.season === season),
      season,
      profileColors,
    );

    await generateOutfitFromForm(
      {
        ...form,
        mood,
        season,
        budget: budgetOptions.includes(profilePreferences?.budget ?? '') ? profilePreferences?.budget ?? form.budget : form.budget,
        place: city,
        itemType: wardrobeItem?.item_type ?? (profilePreferences?.avoid_dresses && itemType === 'платье' ? 'жакет' : itemType),
        wardrobeColor: wardrobeItem?.color ?? getColorFromProfile(profileColors),
        wardrobeItemId: wardrobeItem?.id ?? '',
      },
      'today',
    );
  }

  useEffect(() => {
    if (!autoToday || autoTodayStartedRef.current || profileLoading) return;

    autoTodayStartedRef.current = true;
    generateTodayOutfit();
  }, [autoToday, profileLoading]);

  return (
    <section className="outfit-shell">
      <div className="hero-band">
        <div className="intro">
          <p className="hello">Привет, {userEmail}</p>
          <h2 className={autoToday ? 'today-title' : undefined}>{autoToday ? 'Образ на сегодня' : 'Собрать образ'}</h2>
          <p>
            {autoToday
              ? 'Быстрый подбор сам берет данные из профиля, учитывает погоду и сразу предлагает готовый вариант на день.'
              : 'Выбери город, настроение, конкретную вещь и цвет. Генератор учтет погоду, палитру и стиль.'}
          </p>
        </div>
        {autoToday ? (
          <img className="today-hero-photo" src="/today-accessories.jpg" alt="Коллекция брендовых сумок и аксессуаров" />
        ) : (
          <img className="today-hero-photo" src="/generator-magazines.jpg" alt="Глянцевые fashion-журналы на витрине" />
        )}
      </div>

      {autoToday && (
      <section className="today-panel" aria-label="Образ на сегодня">
        <div className="panel-copy-with-illustration">
          <img className="toolbar-photo today-panel-photo" src="/today-panel-magazines.jpeg" alt="Стопки fashion-журналов" />
          <div>
            <h3>Что надеть сегодня</h3>
            <p>
              Быстрый подбор возьмет город, стиль, бюджет и любимые цвета из профиля. Если город в профиле не заполнен,
              использует поле ниже.
            </p>
            <div className="today-tags">
              <span>{profilePreferences?.city || form.place || 'город не выбран'}</span>
              <span>{getMoodFromProfileStyle(profilePreferences?.favorite_style ?? form.mood)}</span>
              <span>{profilePreferences?.budget || form.budget}</span>
              <span>{wardrobeItems.length > 0 ? `${wardrobeItems.length} вещей` : 'гардероб пуст'}</span>
            </div>
            <div className="today-mini-board" aria-label="Параметры сегодняшнего образа">
              <article>
                <span>Погода</span>
                <strong>{weatherInfo ? `${weatherInfo.temperature}°C` : 'проверим'}</strong>
                <small>{weatherInfo?.description ?? 'после подбора'}</small>
              </article>
              <article>
                <span>Основа</span>
                <strong>{activeWardrobeItem?.name ?? form.itemType}</strong>
                <small>{activeWardrobeItem ? `${activeWardrobeItem.color} · ${activeWardrobeItem.season}` : form.wardrobeColor}</small>
              </article>
              <article>
                <span>Оценка</span>
                <strong>{Math.round(outfitScores.reduce((sum, score) => sum + score.value, 0) / outfitScores.length)}/100</strong>
                <small>{form.mood}</small>
              </article>
            </div>
          </div>
        </div>
        <div className="today-actions">
          <button type="button" onClick={generateTodayOutfit} disabled={todayLoading || loading || profileLoading}>
            {todayLoading ? 'Подбираю...' : 'Подобрать на сегодня'}
          </button>
          <div className="today-quick-actions">
            {todayActionOptions.map((option) => (
              <button
                className="ghost"
                disabled={todayLoading || loading || profileLoading}
                key={option.label}
                onClick={() => generateTodayVariant(option.mood, option.itemType)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      )}

      <form className="generator-panel" onSubmit={generateOutfit} ref={formRef}>
        <label>
          Настроение
          <select value={form.mood} onChange={(e) => updateField('mood', e.target.value)}>
            {moodOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Сезон
          <select value={form.season} onChange={(e) => updateField('season', e.target.value)}>
            {seasonOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Пол
          <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
            {genderOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Бюджет
          <select value={form.budget} onChange={(e) => updateField('budget', e.target.value)}>
            {budgetOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="wide event-panel">
          <p>Подбор по событию</p>
          <div className="event-options">
            {eventOptions.map((option) => (
              <button className="ghost" key={option.label} onClick={() => applyEventOption(option)} type="button">
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="wide">
          Город или событие
          <input
            placeholder="например: Алматы, Астана, свидание, школа"
            value={form.place}
            onChange={(e) => updateField('place', e.target.value)}
          />
        </label>

        <label className="wide">
          Какая вещь уже есть
          <select value={form.wardrobeItemId} onChange={(e) => selectWardrobeItem(e.target.value)}>
            <option value="">Выбрать вручную</option>
            {wardrobeItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.item_type} · {item.color}
              </option>
            ))}
          </select>
        </label>

        <label className="wide">
          Какая вещь уже есть
          <select value={form.itemType} onChange={(e) => updateField('itemType', e.target.value)}>
            {visibleItemTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="wide">
          Фото этой вещи
          <input
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadWardrobePhoto(file);
            }}
            type="file"
          />
        </label>

        {(uploadingPhoto || uploadedPhoto) && (
          <div className="wide upload-preview">
            {uploadedPhoto?.url && <img alt="Загруженная вещь" src={uploadedPhoto.url} />}
            <div>
              <strong>{uploadingPhoto ? 'Загружаю фото...' : 'Фото вещи загружено'}</strong>
              <p>{uploadedPhoto?.name ?? 'Подождите немного'}</p>
            </div>
          </div>
        )}

        <div className="wide color-picker">
          <p>Цвет вещи из гардероба</p>
          <div className="color-grid">
            {wardrobeColors.map((color) => (
              <button
                className={form.wardrobeColor === color.name ? 'color-choice active' : 'color-choice'}
                key={color.name}
                onClick={() => updateField('wardrobeColor', color.name)}
                type="button"
              >
                <span style={{ backgroundColor: color.hex }} />
                {color.name}
              </button>
            ))}
          </div>
        </div>

        <button className="wide" type="submit" disabled={loading}>
          {loading ? 'Проверяю погоду и генерирую...' : 'Сгенерировать образ'}
        </button>
      </form>

      {error && <p className="message">{error}</p>}

      <section className="daily-tip-panel" aria-label="AI-совет дня">
        <img className="toolbar-photo daily-tip-photo" src="/daily-tip-fashion-books.jpeg" alt="Книги о моде и брендах" />
        <div>
          <h3>Совет дня</h3>
          <p>{dailyTip}</p>
        </div>
      </section>

      <section className="wardrobe-audit-panel" aria-label="Оценка гардероба">
        <div>
          <h3>Оценка гардероба</h3>
          <p>{wardrobeItems.length} вещей в базе. Чем больше реальных вещей, тем точнее подбор.</p>
        </div>
        <div className="audit-list">
          {(wardrobeAudit.length > 0 ? wardrobeAudit : ['Гардероб выглядит сбалансированно: можно собирать образы по событию и погоде.']).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="week-calendar-panel" aria-label="Календарь образов">
        <div>
          <h3>Календарь образов</h3>
          <p>Быстрый план недели из текущего настроения, сезона и палитры.</p>
        </div>
        <div className="week-calendar-grid">
          {weekCalendar.map((item) => (
            <article key={item.day}>
              <span>{item.day}</span>
              <strong>{item.title}</strong>
              <small>{item.event}</small>
            </article>
          ))}
        </div>
      </section>

      {recentOutfits.length > 0 && (
        <section className="recent-outfits-panel" aria-label="Последние генерации">
          <div className="panel-copy-with-illustration">
            <MiniIllustration variant="save" />
            <div>
              <h3>Последние генерации</h3>
              <p>Можно быстро вернуть образ, даже если ты не успел сохранить его в коллекцию.</p>
            </div>
          </div>
          <div className="recent-outfits-list">
            {recentOutfits.map((item) => (
              <button className="ghost" key={item.id} onClick={() => restoreRecentOutfit(item)} type="button">
                <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                <strong>{item.title}</strong>
                <small>
                  {item.form.mood} · {item.form.season}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}

      <article className="result-panel featured-result" ref={resultRef}>
        <div className="result-head">
          <div className="panel-copy-with-illustration">
            <img className="toolbar-photo result-head-photo" src="/generator-ready-look-clothes-rack.jpeg" alt="Fashion-иллюстрация для готового образа" />
            <h3>Готовый образ</h3>
          </div>
          <button type="button" onClick={saveCurrentOutfit}>
            Сохранить образ
          </button>
        </div>
        {selectedProduct && (
          <div className="selected-product-note">
            <span>{selectedProduct.brand}</span>
            <strong>{selectedProduct.title}</strong>
            <small>Этот товар используется как основа подбора.</small>
          </div>
        )}
        {saveMessage && <p className="message">{saveMessage}</p>}
        <OutfitResultSummary
          budget={form.budget}
          itemType={form.itemType}
          mood={form.mood}
          palette={palette}
          recommendedProduct={recommendedProducts[0]}
          season={form.season}
          selectedProduct={selectedProduct}
          wardrobeColor={form.wardrobeColor}
        />
        <div className="outfit-visual-card" aria-label="Визуальная карточка образа">
          <div className="outfit-visual-look">
            <span className="visual-top" style={{ backgroundColor: palette[0].hex }} />
            <span className="visual-layer" style={{ backgroundColor: palette[1].hex }} />
            <span className="visual-bottom" style={{ backgroundColor: palette[2].hex }} />
            <span className="visual-shoes" style={{ backgroundColor: palette[3].hex }} />
            <span className="visual-bag" style={{ backgroundColor: palette[4].hex }} />
          </div>
          <div>
            <span>{form.mood}</span>
            <strong>{form.itemType} · {form.wardrobeColor}</strong>
            <small>{form.season} · {form.budget}</small>
          </div>
        </div>
        <p>{result}</p>
      </article>

      <div className="details-tabs" aria-label="Детали образа" ref={detailsRef}>
        {modeDetailTabs.map((tab) => (
          <button
            className={detailTab === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => openDetailTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {detailTab === 'look' && (
        <>
      <section className="remake-panel" aria-label="Переделать образ">
        <div className="panel-copy-with-illustration">
          <img className="toolbar-photo remake-panel-photo" src="/remake-look-dresses.jpeg" alt="Платья на вешалках для переделки образа" />
          <div>
            <h3>Переделать образ</h3>
            <p>Быстро измени текущий outfit под ситуацию.</p>
          </div>
        </div>
        <div className="remake-actions">
          {remakeOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => remakeOutfit(option.label, option.instruction)}
              type="button"
              disabled={Boolean(remakeLoading)}
            >
              {remakeLoading === option.label ? '...' : option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="weather-card" aria-label="Погода">
        <img className="toolbar-photo weather-panel-photo" src="/weather-panel-rainy.jpeg" alt="Иллюстрация погоды rainy day" />
        <div>
          <h3>Погода</h3>
          <p>{weatherStatus}</p>
        </div>
        {weatherInfo && (
          <div className="weather-stats">
            <span>{weatherInfo.temperature}°C</span>
            <small>ощущается {weatherInfo.feelsLike}°C</small>
          </div>
        )}
      </section>

      <section className="look-preview" aria-label="Картинка образа">
        <div className="look-visual">
          <div className="hanger-line" />
          <div className="clothes-grid">
            <div className="clothing-item top" style={{ backgroundColor: palette[0].hex }}>
              <span>верх</span>
            </div>
            <div className="clothing-item layer" style={{ backgroundColor: palette[1].hex }}>
              <span>слой</span>
            </div>
            <div className="clothing-item bottom" style={{ backgroundColor: palette[2].hex }}>
              <span>низ</span>
            </div>
            <div className="clothing-item shoes" style={{ backgroundColor: palette[3].hex }}>
              <span>обувь</span>
            </div>
            <div className="clothing-item bag" style={{ backgroundColor: palette[4].hex }}>
              <span>сумка</span>
            </div>
          </div>
        </div>

        <div className="brand-panel">
          <img className="brand-panel-photo" src="/today-style-brands-fabric.jpeg" alt="Ткани и принты брендов для подбора стиля" />
          <h3>Бренды под стиль</h3>
          <div className="brand-list">
            {brands.map((brand) => (
              <div className="brand-chip" key={`${brand.name}-${brand.reason}`}>
                <strong>{brand.name}</strong>
                <span>{brand.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

        </>
      )}

      {detailTab === 'photo' && (
        <>
      <section className="photo-reference" aria-label="Фото-референс образа">
        <div className={photoReady ? 'photo-frame ready' : 'photo-frame'}>
          {photoReady ? (
            <>
              <div className="photo-badge">Фото готово</div>
              <div className="photo-person">
                <span className="photo-head" />
                <span className="photo-torso" style={{ backgroundColor: palette[0].hex }} />
                <span className="photo-coat" style={{ backgroundColor: palette[1].hex }} />
                <span className="photo-legs" style={{ backgroundColor: palette[2].hex }} />
                <span className="photo-shoes" style={{ backgroundColor: palette[3].hex }} />
                <span className="photo-bag" style={{ backgroundColor: palette[4].hex }} />
              </div>
            </>
          ) : (
            <div className="photo-placeholder">
              <strong>Здесь появится фото-референс</strong>
              <span>Выбери стиль и нажми кнопку справа</span>
            </div>
          )}
        </div>

        <div className="photo-copy">
          <MiniIllustration variant="photo" />
          <h3>📸 Фото-референс</h3>
          <p>Нажми кнопку, и приложение соберет точное описание для фотореалистичной картинки по выбранному стилю, цветам, погоде и брендам.</p>
          <button type="button" onClick={generatePhotoReference}>
            {photoReady ? 'Обновить фото-референс' : 'Сгенерировать фото-референс'}
          </button>
          {photoReady && <p className="photo-success">Готово: референс собран по твоим выбранным цветам, стилю и погоде.</p>}
          {photoPrompt && <textarea readOnly value={photoPrompt} />}
        </div>
      </section>

      <section className="catalog-panel" aria-label="Вещи из брендов">
        <div className="catalog-head">
          <h3>Вещи из брендов</h3>
          <p>Фото-референс собирается только из этих брендовых позиций и похожих вещей.</p>
        </div>
        {recommendedProducts.length > 0 ? (
          <div className="product-grid compact">
            {recommendedProducts.map((product) => (
              <article className="product-card" key={product.id}>
                {product.image_url ? (
                  <img alt={product.title} src={product.image_url} />
                ) : (
                  <div className="product-image-placeholder">{product.item_type}</div>
                )}
                <div className="product-card-body">
                  <span>{product.brand}</span>
                  <h3>{product.title}</h3>
                  <p>{formatProductPrice(product.price, product.currency)}</p>
                  <div className="saved-tags">
                    <small>{product.item_type}</small>
                    <small>{product.color}</small>
                    <small>{product.budget}</small>
                  </div>
                </div>
                <a href={product.product_url} rel="noreferrer" target="_blank">
                  Открыть магазин
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-grid">
            {catalogItems.map((item) => (
              <article className="catalog-item" key={`${item.brand}-${item.title}`}>
                <span>{item.brand}</span>
                <h4>{item.title}</h4>
                <p>{item.itemType}</p>
                <div className="catalog-colors">
                  {item.colors.map((color) => (
                    <small key={color}>{color}</small>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

        </>
      )}

      {detailTab === 'score' && (
        <>
      <div className="palette-row" aria-label="Подходящая цветовая палитра">
        <div className="palette-title">
          <MiniIllustration variant="palette" />
          <strong>Палитра образа</strong>
        </div>
        {palette.map((color) => (
          <div className="swatch" key={`${color.name}-${color.hex}`}>
            <span style={{ backgroundColor: color.hex }} />
            <small>{color.name}</small>
          </div>
        ))}
      </div>

      <section className="score-panel" aria-label="Оценка образа">
        <div className="score-head">
          <div className="panel-copy-with-illustration">
            <MiniIllustration variant="score" />
            <div>
              <h3>Оценка образа</h3>
              <p>{getStyleVerdict(outfitScores)}</p>
            </div>
          </div>
          <span>{Math.round(outfitScores.reduce((sum, score) => sum + score.value, 0) / outfitScores.length)}/100</span>
        </div>

        <div className="score-grid">
          {outfitScores.map((score) => (
            <div className="score-item" key={score.label}>
              <div>
                <strong>{score.label}</strong>
                <span>{score.value}/100</span>
              </div>
              <meter max="100" min="0" value={score.value} />
              <small>{score.note}</small>
            </div>
          ))}
        </div>
      </section>

        </>
      )}

      {detailTab === 'capsule' && (
      <section className="capsule-panel" aria-label="Образы на неделю">
        <div className="capsule-head">
          <div className="panel-copy-with-illustration">
            <MiniIllustration variant="week" />
            <div>
              <h3>Образы на неделю</h3>
              <p>5 образов из выбранной вещи, палитры и погоды.</p>
            </div>
          </div>
          <button type="button" onClick={generateCapsule}>
            Создать образы на неделю
          </button>
        </div>

        {capsulePlan.length > 0 && (
          <div className="capsule-grid">
            {capsulePlan.map((item) => (
              <article className="capsule-day" key={item.day}>
                <span>{item.day}</span>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {detailTab === 'assistant' && (
      <StyleAssistant
        context={{
          mood: form.mood,
          season: form.season,
          gender: form.gender,
          budget: form.budget,
          place: form.place,
          itemType: form.itemType,
          wardrobeColor: form.wardrobeColor,
          weather: weatherStatus,
          outfit: result,
        }}
      />
      )}
    </section>
  );
}
