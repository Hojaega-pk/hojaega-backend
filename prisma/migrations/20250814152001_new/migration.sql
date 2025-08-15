/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `service_providers` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "otp_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phoneNumber" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_providers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "skillset" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "email" TEXT,
    "description" TEXT,
    "experience" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_service_providers" ("city", "contactNo", "createdAt", "description", "email", "experience", "id", "isActive", "name", "skillset", "updatedAt") SELECT "city", "contactNo", "createdAt", "description", "email", "experience", "id", "isActive", "name", "skillset", "updatedAt" FROM "service_providers";
DROP TABLE "service_providers";
ALTER TABLE "new_service_providers" RENAME TO "service_providers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
