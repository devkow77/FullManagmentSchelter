-- Convert cage numbers from 001 style to pavilion-cage format (A-01, A-12, B-03, ...)
WITH numbered AS (
  SELECT
    id,
    chr(65 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 20)::int)
      || '-'
      || lpad((((ROW_NUMBER() OVER (ORDER BY id) - 1) % 20) + 1)::text, 2, '0')
      AS new_cage_number
  FROM "Animal"
)
UPDATE "Animal" AS a
SET "cageNumber" = numbered.new_cage_number
FROM numbered
WHERE a.id = numbered.id;
