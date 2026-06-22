import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { BrandProducts, type BrandProduct } from './components/BrandProducts';
import { Onboarding } from './components/Onboarding';
import { OutfitGenerator } from './components/OutfitGenerator';
import { Profile } from './components/Profile';
import { SavedOutfits } from './components/SavedOutfits';
import { Wardrobe } from './components/Wardrobe';

type AppPage = 'today' | 'generator' | 'wardrobe' | 'brands' | 'profile' | 'collection';

export type WardrobePick = {
  id: string;
  name: string;
  item_type: string;
  color: string;
  season: string;
  notes: string;
};

type ProfileCheck = {
  city: string;
  favorite_style: string;
  budget: string;
  favorite_colors: string[];
};

async function ensureProfile(userId: string, userEmail: string) {
  await supabase.from('profiles').upsert(
    {
      user_id: userId,
      display_name: userEmail.split('@')[0] ?? '',
    },
    { ignoreDuplicates: true, onConflict: 'user_id' },
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileChecking, setProfileChecking] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [page, setPage] = useState<AppPage>('today');
  const [selectedProduct, setSelectedProduct] = useState<BrandProduct | null>(null);
  const [selectedWardrobeItem, setSelectedWardrobeItem] = useState<WardrobePick | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        void ensureProfile(data.session.user.id, data.session.user.email ?? '');
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void ensureProfile(nextSession.user.id, nextSession.user.email ?? '');
      }
      if (!nextSession) {
        setPage('today');
        setNeedsOnboarding(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkProfile() {
      if (!session) return;

      setProfileChecking(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('city, favorite_style, budget, favorite_colors')
        .eq('user_id', session.user.id)
        .maybeSingle<ProfileCheck>();

      if (!error) {
        setNeedsOnboarding(!data || !data.city || !data.favorite_style || !data.budget);
      }

      setProfileChecking(false);
    }

    checkProfile();
  }, [session]);

  if (loading || profileChecking) {
    return (
      <main className="container">
        <p>Загрузка...</p>
      </main>
    );
  }

  if (session && needsOnboarding) {
    return (
      <main className="container">
        <Onboarding onComplete={() => setNeedsOnboarding(false)} userId={session.user.id} />
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div className="brand">
          <div>
            <h1>StyleLab</h1>
            <p>outfit generator</p>
          </div>
        </div>

        {session && (
          <div className="header-actions">
            <nav className="tabs" aria-label="Разделы приложения">
              <button className={page === 'today' ? 'active' : ''} onClick={() => setPage('today')} type="button">
                Сегодня
              </button>
              <button className={page === 'generator' ? 'active' : ''} onClick={() => setPage('generator')} type="button">
                Генератор
              </button>
              <button className={page === 'wardrobe' ? 'active' : ''} onClick={() => setPage('wardrobe')} type="button">
                Гардероб
              </button>
              <button className={page === 'brands' ? 'active' : ''} onClick={() => setPage('brands')} type="button">
                Бренды
              </button>
              <button className={page === 'profile' ? 'active' : ''} onClick={() => setPage('profile')} type="button">
                Профиль
              </button>
              <button className={page === 'collection' ? 'active' : ''} onClick={() => setPage('collection')} type="button">
                Коллекция
              </button>
            </nav>
          </div>
        )}
        {session && (
          <button className="ghost logout-button header-logout" onClick={() => supabase.auth.signOut()} type="button">
            Выйти
          </button>
        )}
      </header>

      {!session ? (
        <Auth />
      ) : page === 'wardrobe' ? (
        <Wardrobe
          userId={session.user.id}
          onUseItem={(item) => {
            setSelectedWardrobeItem(item);
            setSelectedProduct(null);
            setPage('generator');
          }}
        />
      ) : page === 'brands' ? (
        <BrandProducts
          userId={session.user.id}
          onUseProduct={(product) => {
            setSelectedProduct(product);
            setPage('generator');
          }}
        />
      ) : page === 'profile' ? (
        <Profile userId={session.user.id} userEmail={session.user.email ?? ''} />
      ) : page === 'collection' ? (
        <SavedOutfits userId={session.user.id} />
      ) : (
        <OutfitGenerator
          autoToday={page === 'today'}
          selectedWardrobeItem={selectedWardrobeItem}
          selectedProduct={selectedProduct}
          userId={session.user.id}
          userEmail={session.user.email ?? ''}
        />
      )}
    </main>
  );
}
