/*
  Warnings:

  - Added the required column `city` to the `consumers` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_consumers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_consumers" ("createdAt", "id", "name", "city", "pin", "updatedAt") SELECT "createdAt", "id", "name", 'Unknown' as "city", "pin", "updatedAt" FROM "consumers";
DROP TABLE "consumers";
ALTER TABLE "new_consumers" RENAME TO "consumers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
