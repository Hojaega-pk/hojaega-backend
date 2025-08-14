-- CreateTable
CREATE TABLE "public"."service_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "skillset" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "email" TEXT,
    "description" TEXT,
    "experience" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);
