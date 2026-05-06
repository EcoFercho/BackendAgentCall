ALTER TABLE "EmailMessage"
ADD COLUMN "incidentSummaryError" TEXT,
ADD COLUMN "incidentSummaryLastAttemptAt" TIMESTAMP(3);
