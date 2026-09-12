const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const Database = require("better-sqlite3");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const app = express();
const PORT = 3001;

const database = new Database("./prisma/dev.db");
const adapter = new PrismaBetterSqlite3(database);
const prisma = new PrismaClient({ adapter });

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
      error: "No se pudo crear la operación",
    });
  }
});

app.patch("/api/operaciones/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

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

app.listen(PORT, () => {
  console.log(
    `🚀 Casino Control backend funcionando en http://localhost:${PORT}`
  );
});