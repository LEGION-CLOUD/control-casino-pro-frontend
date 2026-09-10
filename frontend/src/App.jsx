
import { useState } from "react";
import "./App.css";

const operacionesIniciales = [
  {
    id: "OP-1048",
    cliente: "CL-82941",
    tipo: "Depósito",
    monto: 125000,
    estado: "Confirmada",
    hora: "09:24",
  },
  {
    id: "OP-1047",
    cliente: "CL-19382",
    tipo: "Retiro",
    monto: 80000,
    estado: "Pendiente",
    hora: "09:17",
  },
  {
    id: "OP-1046",
    cliente: "CL-55120",
    tipo: "Depósito",
    monto: 250000,
    estado: "Revisión",
    hora: "09:03",
  },
  {
    id: "OP-1045",
    cliente: "CL-77431",
    tipo: "Retiro",
    monto: 45000,
    estado: "Confirmada",
    hora: "08:51",
  },
];

function App() {
  const [pagina, setPagina] = useState("Dashboard");
  const [operaciones, setOperaciones] = useState(operacionesIniciales);

  const [cliente, setCliente] = useState("");
  const [tipo, setTipo] = useState("Depósito");
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const formatearMonto = (numero) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(numero);
  };

  const cambiarEstado = (id, nuevoEstado) => {
    setOperaciones((actuales) => {
      return actuales.map((operacion) => {
        if (operacion.id === id) {
          return {
            ...operacion,
            estado: nuevoEstado,
          };
        }

        return operacion;
      });
    });
  };

  const crearOperacion = (evento) => {
    evento.preventDefault();

    if (!cliente || !monto || Number(monto) <= 0) {
      alert("Completá el cliente y un monto válido.");
      return;
    }

    const ahora = new Date();

    const numeroOperacion = 1050 + operaciones.length;

    const nuevaOperacion = {
      id: "OP-" + numeroOperacion,
      cliente: cliente.toUpperCase(),
      tipo: tipo,
      monto: Number(monto),
      estado: "Pendiente",
      hora: ahora.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      nota: nota,
    };

    setOperaciones((actuales) => {
      return [nuevaOperacion, ...actuales];
    });

    setCliente("");
    setMonto("");
    setNota("");

    alert("Operación registrada correctamente.");
  };

  const operacionesFiltradas = operaciones.filter((operacion) => {
    const textoBusqueda = busqueda.toLowerCase();

    const coincideBusqueda =
      operacion.id.toLowerCase().includes(textoBusqueda) ||
      operacion.cliente.toLowerCase().includes(textoBusqueda);

    const coincideEstado =
      filtroEstado === "Todos" ||
      operacion.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const pendientes = operaciones.filter((operacion) => {
    return (
      operacion.estado === "Pendiente" ||
      operacion.estado === "Revisión"
    );
  }).length;

  const totalDepositos = operaciones
    .filter((operacion) => operacion.tipo === "Depósito")
    .reduce((total, operacion) => {
      return total + operacion.monto;
    }, 0);

  const totalRetiros = operaciones
    .filter((operacion) => operacion.tipo === "Retiro")
    .reduce((total, operacion) => {
      return total + operacion.monto;
    }, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">♠</div>

          <div>
            <strong>CASINO</strong>
            <span>CONTROL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              pagina === "Dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Dashboard")}
          >
            <span>▦</span>
            <span>Dashboard</span>
          </button>

          <button
            className={
              pagina === "Operaciones"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Operaciones")}
          >
            <span>⇄</span>
            <span>Operaciones</span>
          </button>

          <button
            className={
              pagina === "Pendientes"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Pendientes")}
          >
            <span>◷</span>
            <span>Pendientes</span>

            {pendientes > 0 && (
              <b className="nav-badge">{pendientes}</b>
            )}
          </button>

          <button
            className={
              pagina === "Historial"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Historial")}
          >
            <span>▤</span>
            <span>Historial</span>
          </button>

          <button
            className={
              pagina === "Cajeras"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Cajeras")}
          >
            <span>♙</span>
            <span>Cajeras</span>
          </button>

          <button
            className={
              pagina === "Reportes"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Reportes")}
          >
            <span>◈</span>
            <span>Reportes</span>
          </button>

          <button
            className={
              pagina === "Configuración"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPagina("Configuración")}
          >
            <span>⚙</span>
            <span>Configuración</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-box">
            <div className="user-avatar">NG</div>

            <div>
              <strong>Nicolás</strong>
              <span>Administradora</span>
            </div>
          </div>

          <button className="logout-button">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-label">
              PANEL DE ADMINISTRACIÓN
            </span>

            <h1>{pagina}</h1>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            Sistema operativo
          </div>
        </header>

        {pagina === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div>
                <span>♣ CONTROL DE CAJA</span>

                <h2>Buen día, Nicolás</h2>

                <p>
                  Tenés <strong>{pendientes} operaciones</strong>{" "}
                  que requieren atención.
                </p>
              </div>

              <div className="banner-icon">♛</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">⇄</span>

                <div>
                  <small>Operaciones hoy</small>
                  <strong>148</strong>
                  <em>+12,4% vs. 132 ayer</em>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">$</span>

                <div>
                  <small>Depósitos</small>
                  <strong>$4.280.000</strong>
                  <em>87 operaciones</em>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">↓</span>

                <div>
                  <small>Retiros</small>
                  <strong>$2.145.000</strong>
                  <em>-3,1% vs. ayer</em>
                </div>
              </div>

              <div className="stat-card attention">
                <span className="stat-icon">!</span>

                <div>
                  <small>ATENCIÓN</small>
                  <strong>{pendientes}</strong>
                  <em>Requieren revisión</em>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <span>ACTIVIDAD</span>
                  <h2>Últimas operaciones</h2>
                </div>

                <button
                  onClick={() => setPagina("Operaciones")}
                >
                  Ver todas →
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Operación</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Hora</th>
                    </tr>
                  </thead>

                  <tbody>
                    {operaciones.slice(0, 4).map((operacion) => (
                      <tr key={operacion.id}>
                        <td>
                          <strong>#{operacion.id}</strong>
                        </td>

                        <td>{operacion.cliente}</td>

                        <td>{operacion.tipo}</td>

                        <td>
                          <strong>
                            {formatearMonto(operacion.monto)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              operacion.estado === "Confirmada"
                                ? "status confirmada"
                                : operacion.estado === "Pendiente"
                                ? "status pendiente"
                                : "status revision"
                            }
                          >
                            {operacion.estado}
                          </span>
                        </td>

                        <td>{operacion.hora}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="shift-panel">
              <div>
                <span>TURNO ACTUAL</span>
                <h2>Resumen de caja</h2>
              </div>

              <div className="shift-status">
                ABIERTO
              </div>

              <div className="shift-data">
                <div>
                  <small>Total neto</small>
                  <strong>
                    {formatearMonto(
                      totalDepositos - totalRetiros
                    )}
                  </strong>
                </div>

                <div>
                  <small>Depósitos</small>
                  <strong>
                    +{formatearMonto(totalDepositos)}
                  </strong>
                </div>

                <div>
                  <small>Retiros</small>
                  <strong>
                    -{formatearMonto(totalRetiros)}
                  </strong>
                </div>

                <div>
                  <small>Cajera</small>
                  <strong>María López</strong>
                </div>

                <div>
                  <small>Inicio del turno</small>
                  <strong>08:00</strong>
                </div>
              </div>

              <button className="shift-button">
                Ver cierre de turno
              </button>
            </section>
          </>
        )}

        {pagina === "Operaciones" && (
          <section className="operations-page">
            <div className="page-heading">
              <div>
                <span>GESTIÓN DE CAJA</span>

                <h2>Operaciones</h2>

                <p>
                  Registrá, buscá y controlá todas las
                  operaciones de caja.
                </p>
              </div>

              <div className="operation-counter">
                <strong>{operaciones.length}</strong>
                <span>operaciones</span>
              </div>
            </div>

            <div className="operations-layout">
              <section className="panel operation-form-panel">
                <div className="panel-header">
                  <div>
                    <span>NUEVA OPERACIÓN</span>
                    <h2>Registrar movimiento</h2>
                  </div>
                </div>

                <form
                  onSubmit={crearOperacion}
                  className="operation-form"
                >
                  <label>
                    Cliente / ID

                    <input
                      type="text"
                      placeholder="Ej. CL-82941"
                      value={cliente}
                      onChange={(e) =>
                        setCliente(e.target.value)
                      }
                    />
                  </label>

                  <label>
                    Tipo de operación

                    <select
                      value={tipo}
                      onChange={(e) =>
                        setTipo(e.target.value)
                      }
                    >
                      <option>Depósito</option>
                      <option>Retiro</option>
                    </select>
                  </label>

                  <label>
                    Monto

                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={monto}
                      onChange={(e) =>
                        setMonto(e.target.value)
                      }
                    />
                  </label>

                  <label>
                    Nota

                    <textarea
                      rows="3"
                      placeholder="Observaciones opcionales..."
                      value={nota}
                      onChange={(e) =>
                        setNota(e.target.value)
                      }
                    />
                  </label>

                  <div className="receipt-box">
                    <span className="receipt-icon">▧</span>

                    <div>
                      <strong>Comprobante</strong>

                      <small>
                        La carga de comprobantes se agregará
                        en el próximo paso.
                      </small>
                    </div>
                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                  >
                    + Registrar operación
                  </button>
                </form>
              </section>

              <section className="panel operations-list-panel">
                <div className="panel-header">
                  <div>
                    <span>REGISTRO</span>
                    <h2>Listado de operaciones</h2>
                  </div>
                </div>

                <div className="operation-tools">
                  <input
                    type="text"
                    placeholder="Buscar operación o cliente..."
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(e.target.value)
                    }
                  />

                  <select
                    value={filtroEstado}
                    onChange={(e) =>
                      setFiltroEstado(e.target.value)
                    }
                  >
                    <option>Todos</option>
                    <option>Pendiente</option>
                    <option>Confirmada</option>
                    <option>Revisión</option>
                  </select>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Operación</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Hora</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {operacionesFiltradas.map((operacion) => (
                        <tr key={operacion.id}>
                          <td>
                            <strong>
                              #{operacion.id}
                            </strong>
                          </td>

                          <td>{operacion.cliente}</td>

                          <td>{operacion.tipo}</td>

                          <td>
                            <strong>
                              {formatearMonto(
                                operacion.monto
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                operacion.estado ===
                                "Confirmada"
                                  ? "status confirmada"
                                  : operacion.estado ===
                                    "Pendiente"
                                  ? "status pendiente"
                                  : "status revision"
                              }
                            >
                              {operacion.estado}
                            </span>
                          </td>

                          <td>{operacion.hora}</td>

                          <td>
                            <select
                              className="status-select"
                              value={operacion.estado}
                              onChange={(e) =>
                                cambiarEstado(
                                  operacion.id,
                                  e.target.value
                                )
                              }
                            >
                              <option>Pendiente</option>
                              <option>Confirmada</option>
                              <option>Revisión</option>
                            </select>
                          </td>
                        </tr>
                      ))}

                      {operacionesFiltradas.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="empty-state"
                          >
                            No se encontraron operaciones.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        )}

        {pagina !== "Dashboard" &&
          pagina !== "Operaciones" && (
            <section className="coming-soon">
              <div className="coming-icon">◈</div>

              <span>MÓDULO</span>

              <h2>{pagina}</h2>

              <p>
                Este módulo será conectado en los próximos
                pasos del sistema.
              </p>
            </section>
          )}
      </main>
    </div>
  );
}
export default App;
