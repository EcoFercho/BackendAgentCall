ALTER TABLE "EmailMessage"
ADD COLUMN "incidentSummary" TEXT,
ADD COLUMN "incidentSummaryModel" TEXT,
ADD COLUMN "incidentSummaryGeneratedAt" TIMESTAMP(3);
