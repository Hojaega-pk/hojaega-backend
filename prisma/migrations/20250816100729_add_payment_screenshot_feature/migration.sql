/*
  Warnings:

  - You are about to drop the column `screenshot` on the `service_providers` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "service_provider_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceProviderId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "screenshotPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_provider_payments_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "description" TEXT,
    "experience" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" INTEGER NOT NULL DEFAULT 1,
    "subscriptionStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEndDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_service_providers" ("city", "contactNo", "createdAt", "description", "experience", "id", "isActive", "name", "skillset", "status", "subscriptionEndDate", "subscriptionStartDate", "updatedAt") SELECT "city", "contactNo", "createdAt", "description", "experience", "id", "isActive", "name", "skillset", "status", "subscriptionEndDate", "subscriptionStartDate", "updatedAt" FROM "service_providers";
DROP TABLE "service_providers";
ALTER TABLE "new_service_providers" RENAME TO "service_providers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
