-- CreateTable
CREATE TABLE "RecurringReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recurrenceType" TEXT NOT NULL,
    "mileageInterval" INTEGER,
    "timeInterval" INTEGER,
    "timeUnit" TEXT,
    "lastCompletedDate" TEXT,
    "lastCompletedMileage" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringReminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
