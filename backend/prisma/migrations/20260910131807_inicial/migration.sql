-- CreateTable
CREATE TABLE "Operacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "nota" TEXT,
    "comprobante" TEXT,
    "creadoPor" TEXT,
    "modificadoPor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Operacion_numero_key" ON "Operacion"("numero");
