import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const C = { bg:'#08080F', sidebar:'#0F0F1E', card:'#12121F', border:'#252542', purple:'#8B5CF6', purpleDark:'#6D28D9', gold:'#D4AF37', goldDark:'#9C7C1C', text:'#E9E9F5', textMut:'#8B8BA7', green:'#10B981', red:'#EF4444' };
const inputStyle={padding:'10px 12px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.card, color:C.text, outline:'none'};
const btnPrimary={padding:'10px 16px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`, color:'#fff', border:'none', fontWeight:800, cursor:'pointer'};

export default function App(){
  const [user,setUser]=useState(()=>{ const s=localStorage.getItem('cc_user'); return s?JSON.parse(s):null; });
  const [vista,setVista]=useState('dashboard');
  const [clientes,setClientes]=useState([]); const [operaciones,setOperaciones]=useState([]);

  useEffect(()=>{ if(user) cargar(); },[user]);
  const cargar=async()=>{
    try{
      const [c,o]=await Promise.all([
        fetch(`${API}/clientes`).then(r=>r.ok?r.json():[]),
        fetch(`${API}/operaciones`).then(r=>r.ok?r.json():[]),
      ]);
      setClientes(c||[]); setOperaciones(o||[]);
    }catch{}
  };

  const handleLogin=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const u=(fd.get('cc_user_x9')||'').toString().trim().toLowerCase();
    const p=(fd.get('cc_pass_x9')||'').toString().trim();
    if((u==='admin' && p==='admin123') || (u==='administrador' && p==='administrador123')){
      const demo={id:1, username:u, nombre:'Administrador', rol:'admin'};
      localStorage.setItem('cc_user', JSON.stringify(demo));
      setUser(demo);
      return;
    }
    try{
      const r=await fetch(`${API}/login`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p})});
      if(!r.ok) throw new Error();
      const data=await r.json();
      localStorage.setItem('cc_user', JSON.stringify(data));
      setUser(data);
    }catch{ alert('Usuario o contraseña incorrectos'); }
  };

  if(!user){
    return (
      <div style={{minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <form onSubmit={handleLogin} autoComplete="off" style={{background:C.card, border:`1px solid ${C.border}`, padding:'36px', borderRadius:'20px', width:'360px'}}>
          <div style={{textAlign:'center', marginBottom:'28px'}}>
            <div style={{width:'50px', height:'50px', margin:'0 auto 14px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.gold} 100%)`, borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px'}}>♠</div>
            <h2 style={{color:C.text, fontWeight:900, margin:0}}>CONTROL DEL CASINO</h2>
          </div>
          <input type="text" name="fake" style={{display:'none'}} />
          <input name="cc_user_x9" autoComplete="off" type="text" style={{...inputStyle, width:'100%', marginBottom:'12px', boxSizing:'border-box'}} placeholder="usuario" />
          <input name="cc_pass_x9" autoComplete="new-password" type="password" style={{...inputStyle, width:'100%', marginBottom:'22px', boxSizing:'border-box'}} placeholder="contraseña" />
          <button type="submit" style={{...btnPrimary, width:'100%', padding:'13px'}}>INGRESAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text}}>
      <aside style={{width:'260px', background:C.sidebar, padding:'20px', position:'fixed', height:'100vh'}}>
        <div style={{fontWeight:900, marginBottom:'20px'}}>CASINO CONTROL</div>
        <button onClick={()=>setVista('dashboard')} style={{width:'100%', padding:'10px', marginBottom:'6px', background: vista==='dashboard'?C.purple:'transparent', border:'none', color:C.text, cursor:'pointer', borderRadius:'8px'}}>PANEL</button>
        <button onClick={()=>setVista('clientes')} style={{width:'100%', padding:'10px', marginBottom:'6px', background: vista==='clientes'?C.purple:'transparent', border:'none', color:C.text, cursor:'pointer', borderRadius:'8px'}}>CLIENTES ({clientes.length})</button>
        <button onClick={()=>setVista('operaciones')} style={{width:'100%', padding:'10px', marginBottom:'6px', background: vista==='operaciones'?C.purple:'transparent', border:'none', color:C.text, cursor:'pointer', borderRadius:'8px'}}>OPERACIONES ({operaciones.length})</button>
        <button onClick={()=>{localStorage.clear(); setUser(null);}} style={{width:'100%', marginTop:'20px', padding:'10px', background:'#EF444420', border:'1px solid #EF444430', color:'#EF4444', cursor:'pointer', borderRadius:'8px'}}>SALIR - {user.username}</button>
      </aside>
      <main style={{marginLeft:'260px', padding:'28px', flex:1}}>
        <h1>{vista.toUpperCase()}</h1>
        {vista==='dashboard' && <div>Ingresos: {clientes.length} clientes, {operaciones.length} ops - Sistema funcionando</div>}
        {vista==='clientes' && <div>{clientes.map(c=><div key={c.id} style={{padding:'8px', borderBottom:`1px solid ${C.border}`}}>{c.nombre} {c.apellido} - DNI:{c.dni}</div>)}</div>}
        {vista==='operaciones' && <div>{operaciones.map(o=><div key={o.id} style={{padding:'8px', borderBottom:`1px solid ${C.border}`}}>{o.cliente_nombre} - ${o.monto} - {o.tipo}</div>)}</div>}
      </main>
    </div>
  );
}
