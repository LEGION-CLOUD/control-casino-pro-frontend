import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const Q = {
  bg: '#08080F', sidebar: '#0F0F1E', card: '#12121F', border: '#252542',
  purple: '#8B5CF6', purpleDark: '#6D28D9', gold: '#D4AF37', text: '#E9E9F5', textMut: '#8B8BA7'
};

const safeFetch = async (url, options) => {
  try {
    const r = await fetch(url, options);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

export default function App() {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('cc_user');
    return s ? JSON.parse(s) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    // LEE DIRECTO DEL DOM PARA EVITAR BUG DE AUTOCOMPLETE
    const form = e.target;
    const userInput = form.querySelector('[name="cc_username_fake"]');
    const passInput = form.querySelector('[name="cc_password_fake"]');
    const rawUser = userInput ? userInput.value : loginForm.username;
    const rawPass = passInput ? passInput.value : loginForm.password;

    const u = rawUser.trim().toLowerCase();
    const p = rawPass.trim();

    if ((u === 'admin' && p === 'admin123') || (u === 'administrador' && p === 'administrador123')) {
      const demoUser = { id: 1, username: u, nombre: 'Administrador', rol: 'admin' };
      localStorage.setItem('cc_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }
    alert('Usuario o clave incorrecta. Usá admin / admin123');
  };

  const logout = () => {
    localStorage.removeItem('cc_user');
    setUser(null);
    setLoginForm({ username: '', password: '' });
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: `radial-gradient(1200px at 20% -10%, #1E1B4B 0%, ${Q.bg} 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} autoComplete="off" style={{ background: Q.card, border: `1px solid ${Q.border}`, padding: '36px', borderRadius: '20px', width: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '50px', height: '50px', margin: '0 auto 10px', background: `linear-gradient(135deg, ${Q.purple} 0%, ${Q.gold} 100%)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>♠</div>
            <h2 style={{ color: Q.text, fontWeight: 900, margin: 0 }}>CONTROL DEL CASINO</h2>
            <p style={{ color: Q.textMut, fontSize: '12px', margin: '4px 0 0' }}>Elegante • Negro • Lila • Dorado</p>
          </div>
          
          <input
            style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${Q.border}`, background: Q.card, color: Q.text, outline: 'none', width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
            placeholder="usuario"
            autoComplete="off"
            name="cc_username_fake"
            defaultValue=""
            readOnly
            onFocus={(e) => e.target.removeAttribute('readOnly')}
            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
          />
          <input
            type="password"
            style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${Q.border}`, background: Q.card, color: Q.text, outline: 'none', width: '100%', marginBottom: '18px', boxSizing: 'border-box' }}
            placeholder="contraseña"
            autoComplete="new-password"
            name="cc_password_fake"
            defaultValue=""
            readOnly
            onFocus={(e) => e.target.removeAttribute('readOnly')}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <button type="submit" style={{ padding: '12px 16px', borderRadius: '10px', background: `linear-gradient(135deg, ${Q.purple} 0%, ${Q.purpleDark} 100%)`, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', width: '100%' }}>
            INGRESAR
          </button>
          <p style={{ color: Q.textMut, fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>administrador / administrador123<br/>ó admin / admin123</p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: Q.bg, color: Q.text, padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>♠ Bienvenido {user.nombre} - LISTO!</h1>
          <button onClick={logout} style={{ padding: '10px 16px', borderRadius: '10px', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444', fontWeight: 800, cursor: 'pointer' }}>SALIR</button>
        </div>
        <div style={{ background: Q.card, border: `1px solid ${Q.border}`, padding: '20px', borderRadius: '14px', marginTop: '20px' }}>
          <h3 style={{ color: Q.gold }}>✅ Login funcionando</h3>
          <p>Ahora aunque Chrome autocompleta, entra igual.</p>
        </div>
      </div>
    </div>
  );
}