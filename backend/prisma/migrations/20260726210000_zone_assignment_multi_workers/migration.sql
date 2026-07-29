-- Allow multiple workers on the same zone for a given day.
DROP INDEX IF EXISTS "DailyZoneAssignment_date_zone_key";

CREATE UNIQUE INDEX "DailyZoneAssignment_date_zone_workerId_key"
ON "DailyZoneAssignment"("date", "zone", "workerId");

CREATE INDEX "DailyZoneAssignment_date_zone_idx"
ON "DailyZoneAssignment"("date", "zone");
