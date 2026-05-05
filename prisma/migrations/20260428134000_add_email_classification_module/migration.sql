ALTER TYPE "MessageStatus" ADD VALUE IF NOT EXISTS 'IRRELEVANT';

ALTER TABLE "GmailConfig"
ADD COLUMN IF NOT EXISTS "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "allowedSenders" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "clientKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "incidentKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "blockedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "GmailConfig"
SET
  "allowedDomains" = COALESCE("allowedDomains", ARRAY[]::TEXT[]),
  "allowedSenders" = COALESCE("allowedSenders", ARRAY[]::TEXT[]),
  "clientKeywords" = COALESCE("clientKeywords", ARRAY[]::TEXT[]),
  "incidentKeywords" = COALESCE("incidentKeywords", ARRAY[]::TEXT[]),
  "blockedKeywords" = COALESCE("blockedKeywords", ARRAY[]::TEXT[]);

ALTER TABLE "GmailConfig"
ALTER COLUMN "allowedDomains" SET NOT NULL,
ALTER COLUMN "allowedSenders" SET NOT NULL,
ALTER COLUMN "clientKeywords" SET NOT NULL,
ALTER COLUMN "incidentKeywords" SET NOT NULL,
ALTER COLUMN "blockedKeywords" SET NOT NULL;

ALTER TABLE "EmailMessage"
ADD COLUMN IF NOT EXISTS "classificationReason" TEXT,
ADD COLUMN IF NOT EXISTS "classificationConfidence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "matchedRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "detectedClientName" TEXT;

UPDATE "EmailMessage"
SET "matchedRules" = COALESCE("matchedRules", ARRAY[]::TEXT[]);

ALTER TABLE "EmailMessage"
ALTER COLUMN "matchedRules" SET NOT NULL;
