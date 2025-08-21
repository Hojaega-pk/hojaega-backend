-- CreateEnum
CREATE TYPE "public"."OtpPurpose" AS ENUM ('SP_SIGNIN', 'CONSUMER_SIGNIN', 'GENERIC');

-- CreateTable
CREATE TABLE "public"."otp_codes" (
    "id" SERIAL NOT NULL,
    "contactNo" TEXT NOT NULL,
    "purpose" "public"."OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_contactNo_purpose_expiresAt_idx" ON "public"."otp_codes"("contactNo", "purpose", "expiresAt");
