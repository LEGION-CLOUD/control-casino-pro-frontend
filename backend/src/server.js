const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3001;

const adapter = new PrismaBetterSqlite3({
  url: "file:D:/CasinoControl/backend/prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

app.get("/api/operaciones", async (req, res) => {
  try {
    const operaciones = await prisma.operacion.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(operaciones);
  } catch (err) {
    console.error("ERROR REAL en GET /api/operaciones:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.post("/api/operaciones", async (req, res) => {
  try {
    const { cliente, tipo, monto, nota } = req.body;
    if (!cliente || !tipo || !monto) {
      return res.status(400).json({ error: "Cliente, tipo y monto son obligatorios" });
    }
    const ultima = await prisma.operacion.findFirst({ orderBy: { id: "desc" } });
    const siguienteNumero = ultima ? ultima.id + 1049 : 1049;
    const operacion = await prisma.operacion.create({
      data: {
        numero: `OP-${siguienteNumero}`,
        cliente: cliente.toUpperCase(),
        tipo,
        monto: Number(monto),
        nota,
        estado: "Pendiente",
      },
    });
    res.status(201).json(operacion);
  } catch (err) {
    console.error("ERROR REAL en POST:", err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/operaciones/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;
    const estadosPermitidos = ["Pendiente", "Revision", "Aprobado", "Rechazado"];
    const operacion = await prisma.operacion.update({
      where: { id },
      data: { estado },
    });
    res.json(operacion);
  } catch (err) {
    console.error("ERROR REAL en PATCH estado:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/operaciones/:id/comprobante", upload.single("comprobante"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!req.file) return res.status(400).json({ error: "No se recibio comprobante" });
    const operacion = await prisma.operacion.update({
      where: { id },
      data: { comprobante: req.file.filename },
    });
    res.json(operacion);
  } catch (err) {
    console.error("ERROR REAL comprobante:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Casino Control backend funcionando en http://localhost:${PORT}`);
});
