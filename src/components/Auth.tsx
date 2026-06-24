import { useState } from 'react';
import { supabase } from '../lib/supabase';

async function ensureProfile(userId: string, userEmail: string) {
  await supabase.from('profiles').upsert(
    {
      user_id: userId,
      display_name: userEmail.split('@')[0] ?? '',
    },
    { ignoreDuplicates: true, onConflict: 'user_id' },
  );
}

function getGoogleAuthMessage(errorMessage: string) {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('provider') || lowerMessage.includes('not enabled')) {
    return 'Google-вход еще не включен в Supabase. Включи Google provider в Authentication -> Providers.';
  }

  if (lowerMessage.includes('redirect') || lowerMessage.includes('not allowed')) {
    return 'Supabase не разрешает этот адрес сайта для Google-входа. Добавь localhost:5173 и адрес Vercel в Redirect URLs.';
  }

  return errorMessage;
}

function getAuthRedirectUrl() {
  return `${window.location.origin}/`;
}

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setGoogleBusy(false);
      setMessage(getGoogleAuthMessage(error.message));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setMessage(error.message);
          return;
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setMessage(signInError.message);
          return;
        }

        if (data.user) {
          await ensureProfile(data.user.id, data.user.email ?? email);
        }

        setMessage('Аккаунт создан, вход выполнен.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user) {
        await ensureProfile(data.user.id, data.user.email ?? email);
      }
    } catch {
      setMessage('Что-то пошло не так. Попробуй еще раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-screen" aria-label="Вход в StyleLab">
      <aside className="auth-side-panel auth-side-panel-left" aria-label="StyleLab notes">
        <span className="auth-side-label">STYLE NOTES</span>
        <strong>01</strong>
        <p>Гардероб, идеи и сохраненные образы в одном месте.</p>
      </aside>

      <div className="auth-hero">
        <div className="auth-kicker">StyleLab</div>
        <h2>Собирай образы быстрее и увереннее</h2>
        <p>Личный гардероб, AI-подборки, сохраненные образы и идеи для недели в одном аккуратном месте.</p>
        <img className="auth-hero-photo" src="/auth-vogue-covers.jpeg" alt="Обложки Vogue" />
        <div className="auth-feature-row" aria-label="Возможности приложения">
          <span>AI образы</span>
          <span>Гардероб</span>
          <span>Коллекция</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-card-head">
          <p>{mode === 'signin' ? 'Твой стиль начинается здесь' : 'Создай свой стиль-профиль'}</p>
          <h3>{mode === 'signin' ? 'Вход' : 'Регистрация'}</h3>
        </div>

        <button className="google-button" type="button" onClick={handleGoogleSignIn} disabled={googleBusy || busy}>
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          {googleBusy ? 'Открываем Google...' : 'Зайти через Google'}
        </button>

        <div className="auth-divider">
          <span>или через email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              placeholder="минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button className="wide" type="submit" disabled={busy || googleBusy}>
            {busy ? 'Проверяем...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <button className="auth-switch" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} type="button">
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>

      <aside className="auth-side-panel auth-side-panel-right" aria-label="StyleLab archive">
        <span className="auth-side-label">LOOK ARCHIVE</span>
        <strong>24/7</strong>
        <p>Подборки под настроение, погоду и вещи из твоего шкафа.</p>
      </aside>
    </section>
  );
}
