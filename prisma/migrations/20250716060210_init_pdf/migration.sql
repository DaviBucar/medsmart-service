-- CreateTable
CREATE TABLE "PdfDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfResult" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "mindMapJson" JSONB NOT NULL,
    "questionsJson" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PdfResult_documentId_key" ON "PdfResult"("documentId");

-- AddForeignKey
ALTER TABLE "PdfResult" ADD CONSTRAINT "PdfResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PdfDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
