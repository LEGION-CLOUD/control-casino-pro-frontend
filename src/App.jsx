import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = import.meta.env.VITE_API_URL || 'https://control-casino-pro-backend.onrender.com/api';
const C = { bg:'#08080F', sidebar:'#0F0F1E', card:'#12121F', border:'#1E1E32', purple:'#8B5CF6', purpleDark:'#6D28D9', gold:'#D4AF37', goldDark:'#9C7C1C', text:'#E9E9F5', textMut:'#8B8BA7', green:'#10B981', red:'#EF4444' };

const inputStyle={padding:'11px 12px', borderRadius:'10px', border:`1px solid ${C.border}`, background:'#18182A', color:C.text, outline:'none', fontSize:'13px'};
const btnPrimary={padding:'11px 16px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`, color:'#fff', border:'none', fontWeight:800, cursor:'pointer', fontSize:'12px'};
const btnGold={padding:'11px 16px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, color:'#000', border:'none', fontWeight:900, cursor:'pointer', fontSize:'12px'};
const btnGhost={padding:'11px 14px', borderRadius:'10px', background:'transparent', color:C.textMut, border:`1px solid ${C.border}`, fontWeight:700, cursor:'pointer', fontSize:'12px'};
const btnRed={padding:'8px 12px', borderRadius:'9px', background:'#EF444415', border:'1px solid #EF444450', color:'#EF4444', fontWeight:800, cursor:'pointer', fontSize:'11px'};
const kpiCard=(a)=>({background:C.card, padding:'14px 16px', borderRadius:'12px', border:`1px solid ${C.border}`, borderLeft:`3px solid ${a}`});
const kpiLabel={color:C.textMut, fontSize:'9px', letterSpacing:'1px', marginBottom:'4px'};
const kpiValue={fontSize:'18px', fontWeight:900};
const chartCard={background:C.card, padding:'14px', borderRadius:'12px', border:`1px solid ${C.border}`};
const chartTitle={color:C.text, fontWeight:800, marginBottom:'10px', fontSize:'12px'};

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem('cc_user');
    if (!raw) return { user: null, token: '' };
    const parsed = JSON.parse(raw);
    const user = parsed && parsed.user ? parsed.user : parsed;
    if (!user) return { user: null, token: parsed?.token || '' };
    return {
      user: {
        ...user,
        rol: String(user.rol ?? user.role ?? 'cajero').trim().toLowerCase(),
      },
      token: parsed?.token || '',
    };
  } catch {
    return { user: null, token: '' };
  }
};

const getStoredToken = () => getStoredSession().token;

function DashboardPro(){
  const [data,setData]=useState(null); const [error,setError]=useState(''); const [desde,setDesde]=useState(''); const [hasta,setHasta]=useState('');
  const cargar=async()=>{
    const q=new URLSearchParams();
    if(desde) q.append('desde',desde);
    if(hasta) q.append('hasta',hasta);
    const token = getStoredToken();
    const r=await fetch(`${API}/dashboard?${q}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const payload = await r.json().catch(() => null);
    if(!r.ok) {
      setError(payload?.error || 'Error al cargar dashboard');
      setData(null);
      return;
    }
    if(!payload || typeof payload !== 'object') {
      setError('Respuesta del dashboard inválida');
      setData(null);
      return;
    }
    setError('');
    setData(payload);
  };
  useEffect(()=>{ cargar().catch((error)=>{ console.error('Dashboard auth error:', error.message); setError('No se pudo cargar el dashboard'); setData(null); }); },[]);

  if(!data) {
    return <div style={{padding:20, color:C.gold, fontSize:12}}>{error || 'Cargando...'}</div>;
  }

  const resumen = (data && typeof data === 'object' && data.resumen && typeof data.resumen === 'object') ? data.resumen : data;
  const totalIngresos = Number(resumen.total_ingresos ?? resumen.totalIngresos ?? data?.totalIngresos ?? data?.total_ingresos ?? 0);
  const totalEgresos = Number(resumen.total_egresos ?? resumen.totalEgresos ?? data?.totalEgresos ?? data?.total_egresos ?? 0);
  const balance = Number(resumen.balance ?? data?.balance ?? (totalIngresos - totalEgresos));
  const totalClientes = Number(resumen.total_clientes ?? resumen.totalClientes ?? data?.totalClientes ?? data?.total_clientes ?? 0);
  const totalUsuarios = Number(resumen.total_usuarios ?? resumen.totalUsuarios ?? data?.totalUsuarios ?? data?.total_usuarios ?? 0);
  const totalOperaciones = Number(resumen.total_operaciones ?? resumen.totalOperaciones ?? data?.totalOperaciones ?? data?.total_operaciones ?? 0);
  const ultimasOperaciones = Array.isArray(data.ultimasOperaciones) ? data.ultimasOperaciones : (Array.isArray(data.ultimas_operaciones) ? data.ultimas_operaciones : (Array.isArray(resumen.ultimasOperaciones) ? resumen.ultimasOperaciones : (Array.isArray(resumen.ultimas_operaciones) ? resumen.ultimas_operaciones : [])));
  const pieData = Array.isArray(data.por_metodo) ? data.por_metodo.map((m) => ({ name: m.metodo_pago || 'efectivo', value: Number(m.total) })) : [];
  const chartData = Array.isArray(data.grafico_diario) ? data.grafico_diario : [];
  const topClientes = Array.isArray(data.top_clientes) ? data.top_clientes : [];
  const COLORS=['#D4AF37','#8B5CF6','#10B981','#EF4444','#3B82F6'];

  return (
    <div style={{display:'grid', gap:'12px'}}>
      <div style={{...chartCard, display:'flex', gap:'8px', flexWrap:'wrap'}}><input type="date" value={desde} onChange={e=>setDesde(e.target.value)} style={inputStyle}/><input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} style={inputStyle}/><button onClick={cargar} style={btnPrimary}>FILTRAR</button><button onClick={()=>{setDesde(''); setHasta(''); setTimeout(cargar,80)}} style={btnGhost}>LIMPIAR</button></div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px'}}>
        <div style={kpiCard(C.green)}><div style={kpiLabel}>INGRESOS</div><div style={{...kpiValue, color:C.green}}>${Number(totalIngresos).toLocaleString()}</div></div>
        <div style={kpiCard(C.red)}><div style={kpiLabel}>EGRESOS</div><div style={{...kpiValue, color:C.red}}>${Number(totalEgresos).toLocaleString()}</div></div>
        <div style={kpiCard(C.gold)}><div style={kpiLabel}>SALDO</div><div style={{...kpiValue, color:C.gold}}>${Number(balance).toLocaleString()}</div></div>
        <div style={kpiCard(C.purple)}><div style={kpiLabel}>OPERACIONES</div><div style={{...kpiValue, color:C.purple}}>{Number(totalOperaciones)}</div></div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        <div style={chartCard}><div style={chartTitle}>Ingresos vs Egresos</div>{chartData.length===0 ? <div style={{color:C.textMut, padding:30, textAlign:'center', fontSize:12}}>Sin datos</div> : <ResponsiveContainer width="100%" height={220}><BarChart data={chartData}><CartesianGrid stroke={C.border} strokeDasharray="3 3"/><XAxis dataKey="dia" stroke={C.textMut} fontSize={10}/><YAxis stroke={C.textMut} fontSize={10}/><Tooltip contentStyle={{background:C.card, border:`1px solid ${C.border}`, fontSize:11}}/><Bar dataKey="ingresos" fill={C.green} radius={[6,6,0,0]}/><Bar dataKey="egresos" fill={C.red} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>}</div>
        <div style={chartCard}><div style={chartTitle}>Por Método</div>{pieData.length===0?<div style={{color:C.textMut, padding:30, textAlign:'center', fontSize:12}}>Sin datos</div>:<ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer>}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        <div style={chartCard}><div style={chartTitle}>Top 5 Clientes</div>{topClientes.length===0 ? <div style={{color:C.textMut, padding:30, textAlign:'center', fontSize:12}}>Sin datos</div> : topClientes.map((c,i)=><div key={c.id || i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:11}}><span>{i+1}. {c.nombre || ''} {c.apellido || ''}</span><span style={{color:C.gold}}>${Number(c.movimiento_total || 0).toLocaleString()}</span></div>)}</div>
        <div style={chartCard}><div style={chartTitle}>Últimas operaciones</div>{ultimasOperaciones.length===0 ? <div style={{color:C.textMut, padding:30, textAlign:'center', fontSize:12}}>Sin datos</div> : ultimasOperaciones.slice(0,5).map((op,i)=><div key={op.id || i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:11}}><span>{op.tipo || 'operación'}</span><span style={{color: op.tipo === 'egreso' ? C.red : C.green}}>${Number(op.monto || 0).toLocaleString()}</span></div>)}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        <div style={chartCard}><div style={chartTitle}>Clientes</div><div style={{...kpiValue, color:C.purple}}>{Number(totalClientes)}</div></div>
        <div style={chartCard}><div style={chartTitle}>Usuarios</div><div style={{...kpiValue, color:C.gold}}>{Number(totalUsuarios)}</div></div>
      </div>
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(()=> getStoredSession().user);
  const [vista,setVista]=useState('dashboard');
  const [menuOpen,setMenuOpen]=useState(false);
  const [clientes,setClientes]=useState([]); const [operaciones,setOperaciones]=useState([]); const [cierres,setCierres]=useState([]); const [auditoria,setAuditoria]=useState([]); const [users,setUsers]=useState([]);
  const [clienteForm,setClienteForm]=useState({nombre:'', apellido:'', dni:'', telefono:''});
  const [opForm,setOpForm]=useState({cliente_id:'', tipo:'ingreso', monto:'', medio:'efectivo', banco:'', estado:'confirmado', observaciones:'', comprobante:''});
  const [filtroAud,setFiltroAud]=useState({desde:'', hasta:''}); const [arqueo,setArqueo]=useState(''); const [obsCierre,setObsCierre]=useState('');
  const [nuevoUsuario,setNuevoUsuario]=useState({username:'', password:'', nombre:'', rol:'cajero'});

  const role = String(user?.rol ?? user?.role ?? 'cajero').trim().toLowerCase();
  const isAdmin = role === 'admin';
  const allowedViews = isAdmin
    ? ['dashboard', 'clientes', 'operaciones', 'cierres', 'auditoria', 'usuarios']
    : ['dashboard', 'clientes', 'operaciones', 'cierres'];

  useEffect(() => {
    if (!allowedViews.includes(vista)) {
      setVista(allowedViews[0]);
    }
  }, [role, vista]);

  const apiFetch = async (path, options = {}) => {
    const token = getStoredToken();
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed: ${response.status}`);
    }
    return payload;
  };

  useEffect(()=>{ if(user) cargarTodo(); },[user,vista]);
  const cargarTodo=async()=>{ 
    try{ 
      const requests = [
        apiFetch('/clientes').catch(()=>[]),
        apiFetch('/operaciones').catch(()=>[]),
        apiFetch('/cierres').catch(()=>[]),
      ];
      if (role === 'admin') {
        requests.push(apiFetch('/auditoria').catch(()=>[]));
        requests.push(apiFetch('/users').catch(()=>[]));
      }

      const [c,o,ci,a,u]=await Promise.all(requests);
      setClientes(Array.isArray(c)?c:[]); setOperaciones(Array.isArray(o)?o:[]); setCierres(Array.isArray(ci)?ci:[]); setAuditoria(Array.isArray(a)?a:[]); setUsers(Array.isArray(u)?u:[]);
    }catch(e){ console.error('Load data error:', e.message); }
  };
  
  const handleLogin=async(e)=>{ 
    e.preventDefault(); 
    const fd = new FormData(e.target);
    const username = (fd.get('cc_user_x9') || '').toString().trim();
    const password = (fd.get('cc_pass_x9') || '').toString().trim();

    if(!username || !password){
      return alert('Ingresá usuario y contraseña');
    }

    try{
      const r=await fetch(`${API}/login`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username, password})});
      const result = await r.json().catch(()=>({ error: 'Error de autenticación' }));
      if(!r.ok){
        throw new Error(result.error || 'Credenciales inválidas');
      }
      const token = result.token || '';
      const userData = result.user || result;
      const normalizedUser = {
        ...userData,
        rol: String(userData?.rol ?? userData?.role ?? 'cajero').trim().toLowerCase(),
      };
      const session = { user: normalizedUser, token };
      localStorage.setItem('cc_user', JSON.stringify(session));
      setUser(normalizedUser);
    }catch(err){
      alert(err.message || 'Usuario o contraseña incorrectos');
    }
  };

  const crearCliente=async(e)=>{ 
    e.preventDefault(); 
    if(!clienteForm.nombre.trim()) return alert('Nombre obligatorio'); 
    try{ 
      const payload = {
        nombre: (clienteForm.nombre + ' ' + clienteForm.apellido).trim(),
        apellido: clienteForm.apellido,
        dni: clienteForm.dni,
        telefono: clienteForm.telefono,
        email: '',
        creado_por: user?.id||1
      };
      await apiFetch('/clientes', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      setClienteForm({nombre:'', apellido:'', dni:'', telefono:''}); 
      cargarTodo(); 
    }catch(err){ alert('Error creando cliente: '+err.message); } 
  };
  const eliminarCliente=async(id)=>{ if(!confirm('¿Eliminar cliente?')) return; await apiFetch(`/clientes/${id}`,{method:'DELETE'}); cargarTodo(); };
  const cargarFicha=async(id)=>{ const j = await apiFetch(`/clientes/${id}/ficha`); if(j && j.cliente) alert(`FICHA ${j.cliente.nombre}\nSaldo: $${j.cliente.saldo}\nOps: ${Array.isArray(j.historial) ? j.historial.length : 0}`); };
  
  const crearOperacion=async(e)=>{ 
    e.preventDefault(); 
    if(!opForm.cliente_id || !opForm.monto) return alert('Falta cliente o monto');
    const monto = Number(opForm.monto);
    if (!Number.isFinite(monto) || monto <= 0) return alert('El monto debe ser mayor a cero');
    try{
      const payload={
        cliente_id:Number(opForm.cliente_id),
        tipo:opForm.tipo,
        monto,
        medio:opForm.medio,
        banco:opForm.banco,
        estado:opForm.estado,
        observaciones:opForm.observaciones,
        comprobante:opForm.comprobante,
        usuario_id:user?.id||1,
      };
      await apiFetch('/operaciones', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      setOpForm({cliente_id:'', tipo:'ingreso', monto:'', medio:'efectivo', banco:'', estado:'confirmado', observaciones:'', comprobante:''});
      cargarTodo(); 
    }catch(err){ alert('Error cargando operación: '+err.message); }
  };
  
  const hacerCierre=async()=>{ if(!arqueo) return alert('Poné arqueo'); const j = await apiFetch('/cierres', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({usuario_id:user.id, arqueo_real:Number(arqueo), observaciones:obsCierre})}); if(j && j.id){ setArqueo(''); setObsCierre(''); cargarTodo(); alert(`Caja cerrada: ${j.estado}`); } };
  const exportarExcel=()=>{ const wb=XLSX.utils.book_new(); const ws1=XLSX.utils.json_to_sheet(auditoria.map(a=>({Fecha:new Date(a.fecha).toLocaleString(), Usuario:a.username||a.usuario, Accion:a.accion}))); XLSX.utils.book_append_sheet(wb, ws1, "Auditoria"); XLSX.writeFile(wb, `Casino_${new Date().toISOString().slice(0,10)}.xlsx`); };
  const exportarPDFCierre=()=>{ const cierre = Array.isArray(cierres) && cierres.length ? cierres[0] : null; if (!cierre) { alert('No hay cierre para exportar'); return; } const doc=new jsPDF(); doc.setFontSize(18); doc.text('CONTROL CASINO PRO', 14, 18); doc.setFontSize(12); doc.text('CIERRE DE CAJA', 14, 28); doc.setFontSize(10); doc.text(`Cajero: ${cierre.usuario || 'Sistema'}`, 14, 40); doc.text(`Fecha: ${new Date(cierre.created_at || cierre.fecha || Date.now()).toLocaleString()}`, 14, 48); doc.text(`Total ingresos: $${Number(cierre.total_ingresos || 0).toLocaleString()}`, 14, 58); doc.text(`Total egresos: $${Number(cierre.total_egresos || 0).toLocaleString()}`, 14, 66); doc.text(`Saldo esperado: $${Number(cierre.saldo_esperado || cierre.total || 0).toLocaleString()}`, 14, 74); doc.text(`Arqueo real: $${Number(cierre.arqueo_real || 0).toLocaleString()}`, 14, 82); doc.text(`Diferencia: $${Number(cierre.diferencia || 0).toLocaleString()}`, 14, 90); doc.text(`Estado: ${cierre.estado || 'CAJA OK'}`, 14, 98); doc.text(`Observaciones: ${cierre.observaciones || 'Sin observaciones'}`, 14, 106); const detalle = operaciones.slice(0, 25).map((o) => [new Date(o.created_at || o.fecha).toLocaleDateString(), o.cliente_nombre || `Cliente ${o.cliente_id}`, o.tipo.toUpperCase(), '$' + Number(o.monto || 0).toLocaleString(), o.medio || 'efectivo']); autoTable(doc,{startY:120, head:[['Fecha','Cliente','Tipo','Monto','Medio']], body:detalle, styles:{fontSize:8}, headStyles:{fillColor:[139,92,246]}, alternateRowStyles:{fillColor:[245,245,245]}}); doc.save(`Cierre_${new Date(cierre.created_at || Date.now()).toISOString().slice(0,10)}.pdf`); };
  const hacerBackup=async()=>{ if (role !== 'admin') return alert('Permiso denegado'); try{ const j = await apiFetch('/backup'); alert(j.archivo?`Backup: ${j.archivo}`:'Backup OK'); }catch(err){ alert('Error de backup: '+err.message); } };
  const borrarAuditoria=async()=>{ if (role !== 'admin') return alert('Permiso denegado'); if(!confirm('¿Borrar toda la auditoria?')) return; await apiFetch('/auditoria', {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({confirmacion:'BORRAR AUDITORIA'})}); cargarTodo(); };
  const crearUsuario=async(e)=>{ if (role !== 'admin') return alert('Permiso denegado'); e.preventDefault(); try{ const j = await apiFetch('/users', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...nuevoUsuario, creador_id:user.id})}); if(j && j.error) throw new Error(j.error); setNuevoUsuario({username:'', password:'', nombre:'', rol:'cajero'}); cargarTodo(); }catch(err){ alert('Error: '+err.message); } };
  const eliminarUsuario=async(id)=>{ if (role !== 'admin') return alert('Permiso denegado'); if(id===1) return alert('No se puede eliminar admin'); if(!confirm('¿Eliminar usuario?')) return; await apiFetch(`/users/${id}`,{method:'DELETE'}); cargarTodo(); };

  if(!user){
    return (
      <div style={{minHeight:'100vh', background:`radial-gradient(1200px at 20% -10%, #1E1B4B 0%, ${C.bg} 60%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
        <form onSubmit={handleLogin} autoComplete="off" style={{background:C.card, border:`1px solid ${C.border}`, padding:'32px', borderRadius:'16px', width:'100%', maxWidth:340}}>
          <div style={{textAlign:'center', marginBottom:'24px'}}>
            <div style={{width:'44px', height:'44px', margin:'0 auto 12px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.gold} 100%)`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>♠</div>
            <h2 style={{color:C.text, fontWeight:900, margin:0, fontSize:16, letterSpacing:1}}>CONTROL DEL CASINO</h2>
            <div style={{color:C.textMut, fontSize:10, marginTop:4, letterSpacing:1}}>CONTROL PRO</div>
          </div>
          <input name="cc_user_x9" autoComplete="off" type="text" style={{...inputStyle, width:'100%', marginBottom:'10px', boxSizing:'border-box'}} placeholder="usuario" defaultValue="" />
          <input name="cc_pass_x9" autoComplete="new-password" type="password" style={{...inputStyle, width:'100%', marginBottom:'18px', boxSizing:'border-box'}} placeholder="contraseña" defaultValue="" />
          <button type="submit" style={{...btnPrimary, width:'100%', padding:'12px'}}>INGRESAR</button>
        </form>
      </div>
    );
  }

  const menuBtn=(id,icon,label)=>(<button onClick={()=>{ if (!allowedViews.includes(id)) return; setVista(id); setMenuOpen(false); }} style={{display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'11px 12px', marginBottom:'4px', borderRadius:'10px', background: vista===id ? `linear-gradient(135deg, ${C.purple}15, ${C.gold}15)` : 'transparent', border: vista===id ? `1px solid ${C.purple}30` : '1px solid transparent', color: vista===id ? C.text : C.textMut, fontWeight: vista===id?800:500, cursor:'pointer', textAlign:'left', fontSize:'12px'}}><span style={{fontSize:13}}>{icon}</span>{label}</button>);

  const visibleMenu = isAdmin
    ? ['dashboard','clientes','operaciones','cierres','auditoria','usuarios']
    : ['dashboard','clientes','operaciones','cierres'];

  const renderMenu = () => {
    const menuMap = {
      dashboard: { icon: '📊', label: 'PANEL' },
      clientes: { icon: '👥', label: 'CLIENTES' },
      operaciones: { icon: '💸', label: 'OPERACIONES' },
      cierres: { icon: '🔒', label: 'CIERRES' },
      auditoria: { icon: '📋', label: 'AUDITORIA' },
      usuarios: { icon: '👤', label: 'USUARIOS' },
    };

    return visibleMenu.map((id) => menuBtn(id, menuMap[id].icon, menuMap[id].label));
  };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Inter, system-ui'}}>
      {menuOpen && <div onClick={()=>setMenuOpen(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:90}} />}
      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); transition: transform 0.25s ease; }
          aside.open { transform: translateX(0) !important; }
          main { margin-left: 0 !important; padding: 12px !important; }
          .hamburger { display: block !important; }
        }
        @media (min-width: 769px) { .hamburger { display: none !important; } }
      `}</style>
      <aside className={menuOpen ? 'open' : ''} style={{width:'260px', background:C.sidebar, borderRight:`1px solid ${C.border}`, padding:'18px', position:'fixed', height:'100vh', display:'flex', flexDirection:'column', overflowY:'auto', zIndex:100}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}><div style={{width:'34px', height:'34px', borderRadius:'9px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.gold} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>♠</div><div><div style={{fontWeight:900, fontSize:'13px'}}>CASINO</div><div style={{fontSize:'9px', color:C.textMut, letterSpacing:'1px'}}>CONTROL PRO</div></div></div>
        <div style={{flex:1}}>{renderMenu()}</div>
        <div style={{borderTop:`1px solid ${C.border}`, paddingTop:'14px'}}><button onClick={()=>{localStorage.clear(); setUser(null);}} style={{width:'100%', padding:'10px', borderRadius:'9px', background:'#EF444415', border:'1px solid #EF444430', color:'#EF4444', fontWeight:800, cursor:'pointer', fontSize:12}}>SALIR</button></div>
      </aside>
      <main style={{marginLeft:'260px', flex:1, padding:'16px', minHeight:'100vh', maxWidth:900}}>
        <div style={{marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}><button onClick={()=>setMenuOpen(!menuOpen)} className="hamburger" style={{padding:'8px 10px', borderRadius:9, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontWeight:800, fontSize:12}}>☰</button><h1 style={{fontSize:'15px', fontWeight:900, margin:0, letterSpacing:0.5}}>{vista.toUpperCase()}</h1></div>
          <div style={{display:'flex', gap:'6px'}}><button onClick={exportarExcel} style={{...btnGhost, padding:'8px 10px', fontSize:11}}>EXCEL</button><button onClick={exportarPDFCierre} style={{...btnGold, padding:'8px 10px', fontSize:11}}>PDF</button><button onClick={hacerBackup} style={{...btnGhost, padding:'8px 10px', fontSize:11, borderColor:C.gold, color:C.gold}}>BACKUP</button></div>
        </div>

        {vista==='dashboard' && <DashboardPro />}
        
        {vista==='clientes' && (
          <div style={{display:'grid', gap:'10px'}}>
            <form onSubmit={crearCliente} style={{...chartCard, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <input style={{...inputStyle, gridColumn:'1 / -1'}} placeholder="Nombre *" value={clienteForm.nombre} onChange={e=>setClienteForm({...clienteForm, nombre:e.target.value})} required />
              <input style={inputStyle} placeholder="Apellido" value={clienteForm.apellido} onChange={e=>setClienteForm({...clienteForm, apellido:e.target.value})} />
              <input style={inputStyle} placeholder="DNI" value={clienteForm.dni} onChange={e=>setClienteForm({...clienteForm, dni:e.target.value})} />
              <input style={{...inputStyle, gridColumn:'1 / -1'}} placeholder="Teléfono" value={clienteForm.telefono} onChange={e=>setClienteForm({...clienteForm, telefono:e.target.value})} />
              <button type="submit" style={{...btnPrimary, gridColumn:'1 / -1'}}>CREAR CLIENTE</button>
            </form>
            <div style={chartCard}>{clientes.length===0 ? <div style={{color:C.textMut, textAlign:'center', padding:16, fontSize:12}}>Sin clientes - creá el primero arriba</div> : clientes.map(c=>(<div key={c.id} style={{display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.border}`, fontSize:12}}><span><b style={{color:C.gold}}>{c.nombre} {c.apellido}</b> <span style={{color:C.textMut, fontSize:10}}>{c.dni||''}</span></span><div style={{display:'flex', gap:'6px'}}><button onClick={()=>cargarFicha(c.id)} style={{...btnGhost, padding:'6px 10px', fontSize:10}}>FICHA</button><button onClick={()=>eliminarCliente(c.id)} style={btnRed}>ELIMINAR</button></div></div>))}</div>
          </div>
        )}

        {vista==='operaciones' && (
          <div style={{display:'grid', gap:'10px'}}>
            <form onSubmit={crearOperacion} style={{...chartCard, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <select style={{...inputStyle, gridColumn:'1 / -1'}} value={opForm.cliente_id} onChange={e=>setOpForm({...opForm, cliente_id:e.target.value})} required><option value="">Seleccioná cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}</select>
              <select style={inputStyle} value={opForm.tipo} onChange={e=>setOpForm({...opForm, tipo:e.target.value})}><option value="ingreso">INGRESO</option><option value="egreso">EGRESO</option></select>
              <input style={inputStyle} type="number" placeholder="Monto" value={opForm.monto} onChange={e=>setOpForm({...opForm, monto:e.target.value})} required />
              <select style={inputStyle} value={opForm.medio} onChange={e=>setOpForm({...opForm, medio:e.target.value})}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="billetera">Billetera</option><option value="cheque">Cheque</option><option value="otro">Otro</option></select>
              <input style={inputStyle} placeholder="Banco / billetera" value={opForm.banco} onChange={e=>setOpForm({...opForm, banco:e.target.value})} />
              <select style={inputStyle} value={opForm.estado} onChange={e=>setOpForm({...opForm, estado:e.target.value})}><option value="confirmado">Confirmado</option><option value="pendiente">Pendiente</option><option value="anulado">Anulado</option></select>
              <input style={{...inputStyle, gridColumn:'1 / -1'}} placeholder="Observaciones" value={opForm.observaciones} onChange={e=>setOpForm({...opForm, observaciones:e.target.value})} />
              <input style={{...inputStyle, gridColumn:'1 / -1'}} placeholder="Comprobante / Nº" value={opForm.comprobante} onChange={e=>setOpForm({...opForm, comprobante:e.target.value})} />
              <button type="submit" style={{...btnGold, gridColumn:'1 / -1'}}>CARGAR OPERACIÓN</button>
            </form>
            <div style={chartCard}>{operaciones.length===0 ? <div style={{color:C.textMut, textAlign:'center', padding:16, fontSize:12}}>Sin operaciones</div> : operaciones.map(o=>(<div key={o.id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:11}}><span><b>{o.cliente_nombre||'CL-'+o.cliente_id}</b> • {o.tipo} • {o.medio || 'efectivo'} • {o.estado || 'confirmado'}</span><b style={{color:o.tipo==='ingreso'?C.green:C.red}}>${Number(o.monto).toLocaleString()}</b></div>))}</div>
          </div>
        )}

        {vista==='cierres' && (
          <div style={{display:'grid', gap:'10px'}}>
            <div style={{...chartCard, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}><input style={inputStyle} type="number" placeholder="Arqueo Real" value={arqueo} onChange={e=>setArqueo(e.target.value)}/><input style={inputStyle} placeholder="Observaciones" value={obsCierre} onChange={e=>setObsCierre(e.target.value)}/><button onClick={hacerCierre} style={{...btnPrimary, gridColumn:'1 / -1'}}>CERRAR CAJA</button></div>
            <div style={chartCard}>{cierres.length===0 ? <div style={{color:C.textMut, textAlign:'center', padding:16, fontSize:12}}>Sin cierres</div> : cierres.map(c=>(<div key={c.id} style={{padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:11}}>{new Date(c.fecha_cierre).toLocaleString()} • {c.estado} • Real: ${c.arqueo_real}</div>))}</div>
          </div>
        )}

        {role === 'admin' && vista==='auditoria' && (
          <div style={{display:'grid', gap:'10px'}}>
            <div style={{...chartCard, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <input type="date" style={inputStyle} value={filtroAud.desde} onChange={e=>setFiltroAud({...filtroAud, desde:e.target.value})}/>
              <input type="date" style={inputStyle} value={filtroAud.hasta} onChange={e=>setFiltroAud({...filtroAud, hasta:e.target.value})}/>
              <div style={{display:'flex', gap:'6px', gridColumn:'1 / -1'}}><button onClick={()=>{setFiltroAud({desde:'', hasta:''})}} style={{...btnGhost, flex:1}}>LIMPIAR</button><button onClick={exportarExcel} style={{...btnPrimary, flex:1, background:'#10B981'}}>EXCEL</button><button onClick={borrarAuditoria} style={{...btnRed, flex:1, padding:'11px'}}>BORRAR</button></div>
            </div>
            <div style={{...chartCard, maxHeight:'60vh', overflow:'auto'}}>{auditoria.length===0 ? <div style={{color:C.textMut, textAlign:'center', padding:16, fontSize:12}}>Sin registros</div> : auditoria.filter(a=>{ if(!filtroAud.desde && !filtroAud.hasta) return true; const d=new Date(a.fecha).toISOString().slice(0,10); if(filtroAud.desde && d < filtroAud.desde) return false; if(filtroAud.hasta && d > filtroAud.hasta) return false; return true; }).map(a=>(<div key={a.id} style={{padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:11}}>{new Date(a.fecha).toLocaleString()} | <b style={{color:C.purple}}>{a.username||a.usuario||'-'}</b> | {a.accion}</div>))}</div>
          </div>
        )}

        {role === 'admin' && vista==='usuarios' && (
          <div style={{display:'grid', gap:'10px'}}>
            <form onSubmit={crearUsuario} style={{...chartCard, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <input style={inputStyle} placeholder="usuario *" value={nuevoUsuario.username} onChange={e=>setNuevoUsuario({...nuevoUsuario, username:e.target.value})} required/>
              <input style={inputStyle} placeholder="password *" type="password" value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} required/>
              <input style={inputStyle} placeholder="Nombre" value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})}/>
              <select style={inputStyle} value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})}><option value="cajero">cajero</option><option value="admin">admin</option></select>
              <button type="submit" style={{...btnGold, gridColumn:'1 / -1'}}>CREAR USUARIO</button>
            </form>
            <div style={chartCard}>{users.length===0 ? <div style={{color:C.textMut, textAlign:'center', padding:16, fontSize:12}}>Sin usuarios</div> : users.map(u=>(<div key={u.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.border}`, fontSize:12}}><span><b style={{color:C.gold}}>{u.username}</b> • {u.nombre||'-'} • <span style={{color:C.purple, fontSize:11}}>{u.rol}</span></span>{u.id!==1 && <button onClick={()=>eliminarUsuario(u.id)} style={btnRed}>ELIMINAR</button>}</div>))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
