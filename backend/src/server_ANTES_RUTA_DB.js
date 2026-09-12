const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const multer = require("multer");
const path = require("path");
const app = express();
const PORT = 3001;

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, nombre);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(cors());
app.use(express.json());

app.use(cors());
app.use(express.json());

app.get("/api/salud", (req, res) => {
  res.json({
    ok: true,
    sistema: "Casino Control",
    mensaje: "Backend funcionando correctamente",
  });
});

app.get("/api/operaciones", async (req, res) => {
  try {
    const operaciones = await prisma.operacion.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(operaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudieron obtener las operaciones",
    });
  }
});

app.post("/api/operaciones", async (req, res) => {
  try {
    const { cliente, tipo, monto, nota } = req.body;

    if (!cliente || !tipo || !monto) {
      return res.status(400).json({
        error: "Cliente, tipo y monto son obligatorios",
      });
    }

    const ultima = await prisma.operacion.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    const siguienteNumero = ultima ? ultima.id + 1049 : 1049;

    const operacion = await prisma.operacion.create({
      data: {
        numero: `OP-${siguienteNumero}`,
        cliente: cliente.toUpperCase(),
        tipo,
        monto: Number(monto),
        estado: "Pendiente",
        nota: nota || null,
      },
    });

    res.status(201).json(operacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudo crear la operaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n",
    });
  }
});

app.patch("/api/operaciones/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    const estadosPermitidos = ["Pendiente", "Confirmada", "RevisiÃƒÆ’Ã‚Â³n"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        error: "Estado no vÃƒÆ’Ã‚Â¡lido",
      });
    }

    const operacion = await prisma.operacion.update({
      where: {
        id,
      },
      data: {
        estado,
      },
    });

    res.json(operacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudo actualizar el estado",
    });
  }
});
app.post("/api/operaciones/:id/comprobante", upload.single("comprobante"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({
        error: "No se recibiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ ningÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn comprobante",
      });
    }

    const operacion = await prisma.operacion.update({
      where: {
        id,
      },
      data: {
        comprobante: `/uploads/${req.file.filename}`,
      },
    });

    res.json(operacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudo guardar el comprobante",
    });
  }
});

app.listen(PORT, () => {  console.log(
    `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Casino Control backend funcionando en http://localhost:${PORT}`
  );
});
