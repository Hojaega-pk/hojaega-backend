-- CreateTable
CREATE TABLE "public"."service_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "skillset" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "pin" TEXT,
    "description" TEXT,
    "experience" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" INTEGER NOT NULL DEFAULT 1,
    "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEndDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_provider_payments" (
    "id" SERIAL NOT NULL,
    "serviceProviderId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "screenshotPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_provider_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consumers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."service_provider_payments" ADD CONSTRAINT "service_provider_payments_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
