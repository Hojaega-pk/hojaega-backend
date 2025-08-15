-- CreateTable
CREATE TABLE "service_providers" (
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
