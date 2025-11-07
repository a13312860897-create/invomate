-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceMode" TEXT NOT NULL DEFAULT 'intl',
    "modeConfig" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InvoicePaymentToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "paddlePaymentId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePaymentToken_paymentToken_key" ON "InvoicePaymentToken"("paymentToken");

-- CreateIndex
CREATE INDEX "InvoicePaymentToken_invoiceId_idx" ON "InvoicePaymentToken"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePaymentToken_paymentToken_idx" ON "InvoicePaymentToken"("paymentToken");

-- CreateIndex
CREATE INDEX "InvoicePaymentToken_expiresAt_idx" ON "InvoicePaymentToken"("expiresAt");
