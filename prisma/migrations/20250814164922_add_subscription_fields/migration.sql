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
    "status" INTEGER NOT NULL DEFAULT 1,
    "subscriptionStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEndDate" DATETIME NOT NULL DEFAULT datetime('now', '+1 month'),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_service_providers" ("city", "contactNo", "createdAt", "description", "email", "experience", "id", "isActive", "name", "skillset", "updatedAt") SELECT "city", "contactNo", "createdAt", "description", "email", "experience", "id", "isActive", "name", "skillset", "updatedAt" FROM "service_providers";
DROP TABLE "service_providers";
ALTER TABLE "new_service_providers" RENAME TO "service_providers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
