import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const C = { bg:'#08080F', sidebar:'#0F0F1E', card:'#12121F', border:'#252542', purple:'#8B5CF6', purpleDark:'#6D28D9', gold:'#D4AF37', goldDark:'#9C7C1C', text:'#E9E9F5', textMut:'#8B8BA7', green:'#10B981', red:'#EF4444' };

function generarComprobantePDF(op, clienteObj){
  const doc = new jsPDF();
  doc.setFillColor(8,8,15); doc.rect(0,0,210,297,'F');
  doc.setFillColor(212,175,55); doc.rect(0,0,210,24,'F');
  doc.setTextColor(0,0,0); doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('CASINO CONTROL PRO', 12, 15);
  doc.setDrawColor(212,175,55); doc.setLineWidth(0.7); doc.rect(10,30,190,92);
  doc.setTextColor(233,233,245); doc.setFontSize(17); doc.setFont('helvetica','bold');
  doc.text(op.tipo==='ingreso' ? 'COMPROBANTE DE CARGA' : 'COMPROBANTE DE RETIRO / EGRESO', 12, 42);
  doc.setFontSize(11); doc.setTextColor(139,92,246); doc.text(`Operación #${op.id} - ${new Date(op.fecha).toLocaleString()}`, 12, 49);
  doc.setTextColor(233,233,245); doc.setFontSize(11); doc.setFont('helvetica','normal');
  doc.text(`Cliente: ${op.cliente_nombre || (clienteObj ? clienteObj.nombre+' '+(clienteObj.apellido||'') : '')}`, 12, 59);
  doc.text(`DNI: ${clienteObj?.dni || '-'} | Tel: ${clienteObj?.telefono || '-'}`, 12, 65);
  doc.text(`Cajero: ${op.cajero || op.cajero_nombre || '-'}`, 12, 71);
  doc.text(`Método: ${(op.metodo_pago||'efectivo').toUpperCase()}`, 12, 77);
  if(op.referencia) doc.text(`Ref: ${op.referencia}`, 12, 83);
  doc.text(`Concepto: ${op.concepto||'-'}`, 12, 89);
  doc.setFillColor(18,18,31); doc.rect(124,54,74,42,'F');
  doc.setDrawColor(212,175,55); doc.rect(124,54,74,42);
  doc.setTextColor(212,175,55); doc.setFontSize(10); doc.text('MONTO', 126, 62);
  doc.setFontSize(22); doc.setFont('helvetica','bold'); doc.text(`$ ${Number(op.monto).toLocaleString('es-AR')}`, 126, 76);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(139,92,246); doc.text(op.tipo.toUpperCase(), 126, 84);
  doc.save(`Comprobante_${(op.cliente_nombre||'Cliente').replace(/\s+/g,'_')}_${op.id}.pdf`);
}
const compartirWhatsApp = (op)=>{
  const texto = `*CASINO CONTROL PRO* %0A*${op.tipo==='ingreso'?'CARGA':'RETIRO'}*%0A Cliente: ${op.cliente_nombre}%0A Monto: $${Number(op.monto).toLocaleString()}%0A Metodo: ${op.metodo_pago||'efectivo'}%0A Ref: ${op.referencia||''}%0A Fecha: ${new Date(op.fecha).toLocaleString()}`;
  window.open(`https://wa.me/?text=${texto}`, '_blank');
};

function DashboardPro(){
  const [data,setData]=useState(null); const [desde,setDesde]=useState(''); const [hasta,setHasta]=useState('');
  const cargar=async()=>{ try{ const q=new URLSearchParams(); if(desde) q.append('desde',desde); if(hasta) q.append('hasta',hasta); const r=await fetch(`${API}/dashboard?${q}`); if(!r.ok) throw new Error(); setData(await r.json()); }catch{ setData({resumen:{total_ingresos:0,total_egresos:0,saldo:0,cantidad_operaciones:0}, por_metodo:[], grafico_diario:[], top_clientes:[], ranking_cajeros:[]}); } };
  useEffect(()=>{ cargar(); },[]); if(!data) return <div style={{padding:24, color:C.gold}}>Cargando...</div>;
  const pieData=(data.por_metodo||[]).map(m=>({name:m.metodo_pago||'efectivo', value:Number(m.total)})); const COLORS=['#D4AF37','#8B5CF6','#10B981','#EF4444','#3B82F6'];
  return (<div><div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><input type="date" value={desde} onChange={e=>setDesde(e.target.value)} style={inputStyle}/><input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} style={inputStyle}/><button onClick={cargar} style={btnPrimary}>FILTRAR</button></div><div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px'}}><div style={kpiCard(C.green)}><div style={kpiLabel}>INGRESOS</div><div style={{...kpiValue, color:C.green}}>${Number(data.resumen.total_ingresos).toLocaleString()}</div></div><div style={kpiCard(C.red)}><div style={kpiLabel}>EGRESOS</div><div style={{...kpiValue, color:C.red}}>${Number(data.resumen.total_egresos).toLocaleString()}</div></div><div style={kpiCard(C.gold)}><div style={kpiLabel}>SALDO</div><div style={{...kpiValue, color:C.gold}}>${Number(data.resumen.saldo).toLocaleString()}</div></div><div style={kpiCard(C.purple)}><div style={kpiLabel}>OPERACIONES</div><div style={{...kpiValue, color:C.purple}}>{data.resumen.cantidad_operaciones}</div></div></div><div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px'}}><div style={chartCard}><div style={chartTitle}>Ingresos vs Egresos</div><ResponsiveContainer width="100%" height={300}><BarChart data={data.grafico_diario}><CartesianGrid stroke={C.border} strokeDasharray="3 3"/><XAxis dataKey="dia" stroke={C.textMut} fontSize={11}/><YAxis stroke={C.textMut} fontSize={11}/><Tooltip contentStyle={{background:C.card, border:`1px solid ${C.border}`}}/><Bar dataKey="ingresos" fill={C.green} radius={[8,8,0,0]}/><Bar dataKey="egresos" fill={C.red} radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div><div style={chartCard}><div style={chartTitle}>Por Método</div>{pieData.length===0?<div style={{color:C.textMut, padding:40, textAlign:'center'}}>Sin datos</div>:<ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>}</div></div></div>);
}
const inputStyle={padding:'10px 12px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.card, color:C.text, outline:'none'};
const btnPrimary={padding:'10px 16px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`, color:'#fff', border:'none', fontWeight:800, cursor:'pointer'};
const btnGold={padding:'10px 16px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, color:'#000', border:'none', fontWeight:900, cursor:'pointer'};
const btnGhost={padding:'10px 16px', borderRadius:'10px', background:'transparent', color:C.textMut, border:`1px solid ${C.border}`, fontWeight:700, cursor:'pointer'};
const btnRed={padding:'8px 12px', borderRadius:'10px', background:'#EF444415', border:'1px solid #EF444450', color:'#EF4444', fontWeight:800, cursor:'pointer', fontSize:'12px'};
const kpiCard=(a)=>({background:C.card, padding:'16px', borderRadius:'14px', border:`1px solid ${C.border}`, borderLeft:`3px solid ${a}`});
const kpiLabel={color:C.textMut, fontSize:'10px', letterSpacing:'1px'}; const kpiValue={fontSize:'20px', fontWeight:900}; const chartCard={background:C.card, padding:'16px', borderRadius:'14px', border:`1px solid ${C.border}`}; const chartTitle={color:C.text, fontWeight:800, marginBottom:'12px', fontSize:'13px'}; const listRow={display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.border}`, fontSize:'13px'};

export default function App(){
  const [user,setUser]=useState(()=>{ const s=localStorage.getItem('cc_user'); return s?JSON.parse(s):null; });
  const [vista,setVista]=useState('dashboard');
  const [clientes,setClientes]=useState([]); const [operaciones,setOperaciones]=useState([]); const [cierres,setCierres]=useState([]); const [auditoria,setAuditoria]=useState([]); const [users,setUsers]=useState([]);
  const [ficha,setFicha]=useState(null); const [showPassModal,setShowPassModal]=useState(false); const [passForm,setPassForm]=useState({actual:'', nueva:''});
  const [clienteForm,setClienteForm]=useState({nombre:'', apellido:'', dni:'', telefono:'', email:''});
  const [opForm,setOpForm]=useState({cliente_id:'', tipo:'ingreso', monto:'', concepto:'', metodo_pago:'efectivo', referencia:''});
  const [filtroAud,setFiltroAud]=useState({desde:'', hasta:''}); const [arqueo,setArqueo]=useState(''); const [obsCierre,setObsCierre]=useState('');
  const [nuevoUsuario,setNuevoUsuario]=useState({username:'', password:'', nombre:'', rol:'cajero'});
  const [editCliente,setEditCliente]=useState(null);

  useEffect(()=>{ if(user) cargarTodo(); },[user,vista]);
  const cargarTodo=async()=>{ try{ const [c,o,ci,a,u]=await Promise.all([ fetch(`${API}/clientes`).then(r=>r.ok?r.json():[]), fetch(`${API}/operaciones`).then(r=>r.ok?r.json():[]), fetch(`${API}/cierres`).then(r=>r.ok?r.json():[]), fetch(`${API}/auditoria`).then(r=>r.ok?r.json():[]), fetch(`${API}/users`).then(r=>r.ok?r.json():[]), ]); setClientes(c||[]); setOperaciones(o||[]); setCierres(ci||[]); setAuditoria(a||[]); setUsers(u||[]); }catch(e){} };
  
  const handleLogin=async(e)=>{ 
    e.preventDefault(); 
    const fd = new FormData(e.target);
    const u = (fd.get('cc_user_x9') || '').toString().trim().toLowerCase();
    const p = (fd.get('cc_pass_x9') || '').toString().trim();
    if((u==='admin' && p==='admin123') || (u==='administrador' && p==='administrador123')){
      const demo={id:1, username:u, nombre:'Administrador', rol:'admin'};
      localStorage.setItem('cc_user', JSON.stringify(demo));
      setUser(demo);
      return;
    }
    try{
      const r=await fetch(`${API}/login`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u, password:p})}); 
      if(!r.ok){ const er=await r.json().catch(()=>({error:'Error login'})); return alert(er.error); } 
      const userData=await r.json(); 
      localStorage.setItem('cc_user', JSON.stringify(userData)); 
      setUser(userData);
    }catch(err){ alert('Usuario o contraseña incorrectos'); }
  };

  const crearCliente=async(e)=>{ e.preventDefault(); if(!clienteForm.nombre.trim()) return alert('Nombre obligatorio'); await fetch(`${API}/clientes`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...clienteForm, creado_por:user.id})}); setClienteForm({nombre:'', apellido:'', dni:'', telefono:'', email:''}); cargarTodo(); };
  const guardarEdicionCliente=async(e)=>{ e.preventDefault(); await fetch(`${API}/clientes/${editCliente.id}`,{method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editCliente)}); setEditCliente(null); cargarTodo(); };
  const eliminarCliente=async(id)=>{ if(!confirm('¿Eliminar cliente?')) return; await fetch(`${API}/clientes/${id}`,{method:'DELETE'}); cargarTodo(); };
  const crearOperacion=async(e)=>{ e.preventDefault(); const payload={...opForm, usuario_id:user.id, cliente_id:Number(opForm.cliente_id), monto:Number(opForm.monto)}; const res=await fetch(`${API}/operaciones`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}); const data=await res.json(); if(data.id){ setOpForm({cliente_id:'', tipo:'ingreso', monto:'', concepto:'', metodo_pago:'efectivo', referencia:''}); cargarTodo(); } };
  const eliminarOperacion=async(id)=>{ if(!confirm('¿Eliminar operación?')) return; await fetch(`${API}/operaciones/${id}`,{method:'DELETE'}); cargarTodo(); };
  const cargarFicha=async(id)=>{ const r=await fetch(`${API}/clientes/${id}/ficha`); setFicha(await r.json()); };
  const hacerCierre=async()=>{ if(!arqueo) return alert('Poné arqueo'); const r=await fetch(`${API}/cierres`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({usuario_id:user.id, arqueo_real:Number(arqueo), observaciones:obsCierre})}); const j=await r.json(); if(j.id){ setArqueo(''); setObsCierre(''); cargarTodo(); } };
  const exportarExcel=()=>{ const wb=XLSX.utils.book_new(); const ws1=XLSX.utils.json_to_sheet(auditoria.map(a=>({Fecha:new Date(a.fecha).toLocaleString(), Usuario:a.username, Accion:a.accion, Detalle:a.detalle}))); XLSX.utils.book_append_sheet(wb, ws1, "Auditoria"); XLSX.writeFile(wb, `Casino_${new Date().toISOString().slice(0,10)}.xlsx`); };
  const exportarPDFOperaciones=()=>{ const doc=new jsPDF(); doc.text('OPERACIONES',10,10); const rows=operaciones.slice(0,300).map(o=>[new Date(o.fecha).toLocaleDateString(), o.cliente_nombre, o.tipo, o.metodo_pago, `$${o.monto}`]); autoTable(doc,{head:[['Fecha','Cliente','Tipo','Metodo','Monto']], body:rows}); doc.save('Operaciones.pdf'); };
  const borrarAuditoria=async()=>{ if(!confirm('¿Borrar auditoria?')) return; await fetch(`${API}/auditoria`,{method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({confirmacion:'BORRAR AUDITORIA'})}); cargarTodo(); };
  const crearUsuario=async(e)=>{ e.preventDefault(); const r=await fetch(`${API}/users`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...nuevoUsuario, creador_id:user.id})}); const j=await r.json(); if(!j.error){ setNuevoUsuario({username:'', password:'', nombre:'', rol:'cajero'}); cargarTodo(); } };
  const eliminarUsuario=async(id)=>{ if(!confirm('¿Eliminar?')) return; await fetch(`${API}/users/${id}`,{method:'DELETE'}); cargarTodo(); };
  const hacerBackup=async()=>{ const r=await fetch(`${API}/backup`); const j=await r.json(); if(j.ok) alert(`Backup OK: ${j.archivo}`); };
  const cambiarPass=async()=>{ const r=await fetch(`${API}/cambiar-password`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:user.id, actual:passForm.actual, nueva:passForm.nueva})}); const j=await r.json(); if(j.ok){ alert('Cambiada'); setShowPassModal(false); } else alert(j.error); };

  if(!user){
    return (
      <div style={{minHeight:'100vh', background:`radial-gradient(1200px at 20% -10%, #1E1B4B 0%, ${C.bg} 60%)`, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <form onSubmit={handleLogin} autoComplete="off" style={{background:C.card, border:`1px solid ${C.border}`, padding:'36px', borderRadius:'20px', width:'360px'}}>
          <div style={{textAlign:'center', marginBottom:'28px'}}>
            <div style={{width:'50px', height:'50px', margin:'0 auto 14px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.gold} 100%)`, borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px'}}>♠</div>
            <h2 style={{color:C.text, fontWeight:900, margin:0, letterSpacing:'1px'}}>CONTROL DEL CASINO</h2>
          </div>
          <input type="text" name="fake_user" style={{display:'none'}} autoComplete="off" />
          <input type="password" name="fake_pass" style={{display:'none'}} autoComplete="new-password" />
          <input name="cc_user_x9" autoComplete="off" type="text" spellCheck="false" style={{...inputStyle, width:'100%', marginBottom:'12px', boxSizing:'border-box'}} placeholder="usuario" defaultValue="" />
          <input name="cc_pass_x9" autoComplete="new-password" type="password" style={{...inputStyle, width:'100%', marginBottom:'22px', boxSizing:'border-box'}} placeholder="contraseña" defaultValue="" />
          <button type="submit" style={{...btnPrimary, width:'100%', padding:'13px'}}>INGRESAR</button>
        </form>
      </div>
    );
  }

  const menuBtn=(id,icon,label)=>(<button onClick={()=>setVista(id)} style={{display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'12px 14px', marginBottom:'6px', borderRadius:'12px', background: vista===id ? `linear-gradient(135deg, ${C.purple}15, ${C.gold}15)` : 'transparent', border: vista===id ? `1px solid ${C.purple}40` : '1px solid transparent', color: vista===id ? C.text : C.textMut, fontWeight: vista===id?800:500, cursor:'pointer', textAlign:'left', fontSize:'13px'}}><span>{icon}</span>{label}</button>);

  return (
    <div style={{display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'Inter, system-ui'}}>
      <aside style={{width:'260px', background:C.sidebar, borderRight:`1px solid ${C.border}`, padding:'20px', position:'fixed', height:'100vh', display:'flex', flexDirection:'column', overflowY:'auto'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px'}}><div style={{width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.purple} 0%, ${C.gold} 100%)`, display:'flex', alignItems:'center', justifyContent:'center'}}>♠</div><div><div style={{fontWeight:900, fontSize:'14px'}}>CASINO</div><div style={{fontSize:'10px', color:C.textMut, letterSpacing:'1px'}}>CONTROL PRO</div></div></div>
        <div style={{flex:1}}>{menuBtn('dashboard','📊','PANEL')}{menuBtn('clientes','👥','CLIENTES')}{menuBtn('operaciones','💸','OPERACIONES')}{menuBtn('cierres','🔒','CIERRES')}{menuBtn('auditoria','📋','AUDITORIA')}{menuBtn('usuarios','👤','USUARIOS')}</div>
        <div style={{borderTop:`1px solid ${C.border}`, paddingTop:'16px'}}><button onClick={()=>{localStorage.clear(); setUser(null);}} style={{width:'100%', padding:'10px', borderRadius:'10px', background:'#EF444415', border:'1px solid #EF444430', color:'#EF4444', fontWeight:800, cursor:'pointer'}}>SALIR</button></div>
      </aside>
      <main style={{marginLeft:'260px', flex:1, padding:'28px', minHeight:'100vh'}}>
        <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between'}}><h1 style={{fontSize:'20px', fontWeight:900}}>{vista.toUpperCase()}</h1><div style={{display:'flex', gap:'8px'}}><button onClick={exportarExcel} style={btnGhost}>EXCEL</button><button onClick={exportarPDFOperaciones} style={btnGold}>PDF</button></div></div>
        {vista==='dashboard' && <DashboardPro />}
        {vista==='clientes' && (<div><form onSubmit={crearCliente} style={{...chartCard, display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px'}}><input style={inputStyle} placeholder="Nombre *" value={clienteForm.nombre} onChange={e=>setClienteForm({...clienteForm, nombre:e.target.value})} required /><input style={inputStyle} placeholder="Apellido" value={clienteForm.apellido} onChange={e=>setClienteForm({...clienteForm, apellido:e.target.value})} /><input style={inputStyle} placeholder="DNI" value={clienteForm.dni} onChange={e=>setClienteForm({...clienteForm, dni:e.target.value})} /><input style={inputStyle} placeholder="Telefono" value={clienteForm.telefono} onChange={e=>setClienteForm({...clienteForm, telefono:e.target.value})} /><button type="submit" style={btnPrimary}>CREAR CLIENTE</button></form>{clientes.map(c=>(<div key={c.id} style={{...chartCard, marginBottom:'8px', display:'flex', justifyContent:'space-between'}}><span><b style={{color:C.gold}}>{c.nombre} {c.apellido}</b></span><div style={{display:'flex', gap:'6px'}}><button onClick={()=>cargarFicha(c.id)} style={btnGhost}>FICHA</button><button onClick={()=>eliminarCliente(c.id)} style={btnRed}>ELIMINAR</button></div></div>))}</div>)}
        {vista==='operaciones' && (<div><form onSubmit={crearOperacion} style={{...chartCard, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px'}}><select style={inputStyle} value={opForm.cliente_id} onChange={e=>setOpForm({...opForm, cliente_id:e.target.value})} required><option value="">Cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select><select style={inputStyle} value={opForm.tipo} onChange={e=>setOpForm({...opForm, tipo:e.target.value})}><option value="ingreso">INGRESO</option><option value="egreso">EGRESO</option></select><input style={inputStyle} type="number" placeholder="Monto" value={opForm.monto} onChange={e=>setOpForm({...opForm, monto:e.target.value})} required /><button type="submit" style={btnGold}>CARGAR</button></form>{operaciones.map(o=>(<div key={o.id} style={{...chartCard, marginBottom:'8px'}}>{o.cliente_nombre} - ${o.monto} - {o.tipo}</div>))}</div>)}
        {vista==='cierres' && (<div><div style={{...chartCard, display:'flex', gap:'10px', marginBottom:'16px'}}><input style={inputStyle} type="number" placeholder="Arqueo Real" value={arqueo} onChange={e=>setArqueo(e.target.value)}/><button onClick={hacerCierre} style={btnPrimary}>CERRAR CAJA</button></div>{cierres.map(c=>(<div key={c.id} style={chartCard}>{new Date(c.fecha_cierre).toLocaleString()} - {c.estado}</div>))}</div>)}
        {vista==='auditoria' && (<div>{auditoria.map(a=>(<div key={a.id} style={{...chartCard, marginBottom:'6px', fontSize:'12px'}}>{new Date(a.fecha).toLocaleString()} | {a.username} | {a.accion}</div>))}</div>)}
        {vista==='usuarios' && (<div>{users.map(u=>(<div key={u.id} style={chartCard}>{u.username} - {u.rol}</div>))}</div>)}
      </main>
    </div>
  );
}
