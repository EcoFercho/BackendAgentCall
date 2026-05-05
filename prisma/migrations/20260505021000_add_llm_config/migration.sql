-- CreateEnum
CREATE TYPE "LlmProviderType" AS ENUM ('LOCAL', 'API');

-- CreateTable
CREATE TABLE "LlmConfig" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL DEFAULT 'default',
    "activeProvider" "LlmProviderType" NOT NULL DEFAULT 'LOCAL',
    "localBaseUrl" TEXT NOT NULL DEFAULT 'http://127.0.0.1:11434',
    "localGeneratePath" TEXT NOT NULL DEFAULT '/api/generate',
    "localModel" TEXT NOT NULL DEFAULT 'gemma4:26b',
    "localTimeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "apiProviderName" TEXT,
    "apiBaseUrl" TEXT,
    "apiGeneratePath" TEXT,
    "apiModel" TEXT,
    "apiKey" TEXT,
    "apiTimeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LlmConfig_configKey_key" ON "LlmConfig"("configKey");
