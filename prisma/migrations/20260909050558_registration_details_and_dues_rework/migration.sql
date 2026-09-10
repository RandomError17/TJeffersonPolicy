-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DuesRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "waived" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DuesRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DuesRecord_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DuesRecord" ("createdAt", "id", "note", "seasonYear", "updatedAt", "updatedById", "userId") SELECT "createdAt", "id", "note", "seasonYear", "updatedAt", "updatedById", "userId" FROM "DuesRecord";
DROP TABLE "DuesRecord";
ALTER TABLE "new_DuesRecord" RENAME TO "DuesRecord";
CREATE INDEX "DuesRecord_seasonYear_idx" ON "DuesRecord"("seasonYear");
CREATE UNIQUE INDEX "DuesRecord_userId_seasonYear_key" ON "DuesRecord"("userId", "seasonYear");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "memberNote" TEXT,
    "officerNote" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "OrderItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "itemId", "memberNote", "officerNote", "quantity", "size", "status", "updatedAt", "userId") SELECT "createdAt", "id", "itemId", "memberNote", "officerNote", "quantity", "size", "status", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE TABLE "new_TournamentRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "partnerName" TEXT NOT NULL,
    "schoolEmail" TEXT,
    "tabroomEmail" TEXT,
    "phoneNumber" TEXT,
    "grade" INTEGER,
    "partnerSchoolEmail" TEXT,
    "memberNote" TEXT,
    "officerNote" TEXT,
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TournamentRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentRegistration_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "TournamentDivision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TournamentRegistration" ("createdAt", "divisionId", "id", "memberNote", "officerNote", "partnerName", "status", "tournamentId", "updatedAt", "userId") SELECT "createdAt", "divisionId", "id", "memberNote", "officerNote", "partnerName", "status", "tournamentId", "updatedAt", "userId" FROM "TournamentRegistration";
DROP TABLE "TournamentRegistration";
ALTER TABLE "new_TournamentRegistration" RENAME TO "TournamentRegistration";
CREATE INDEX "TournamentRegistration_tournamentId_status_idx" ON "TournamentRegistration"("tournamentId", "status");
CREATE INDEX "TournamentRegistration_userId_idx" ON "TournamentRegistration"("userId");
CREATE UNIQUE INDEX "TournamentRegistration_userId_divisionId_key" ON "TournamentRegistration"("userId", "divisionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

