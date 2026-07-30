-- MiAlacena - Datos de prueba para Estadisticas de Consumo
-- Inserta eventos de consumo para los ultimos tres meses en una casa existente.
-- Es idempotente: usa IDs deterministas y ON CONFLICT DO NOTHING.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

WITH target_house AS (
  SELECT id
  FROM houses
  ORDER BY created_at
  LIMIT 1
),
target_categories AS (
  SELECT c.*
  FROM categories c
  JOIN target_house h ON h.id = c.house_id
),
demo_products AS (
  INSERT INTO products (
    id,
    house_id,
    category_id,
    name,
    quantity,
    unit,
    min_stock,
    status,
    created_by
  )
  SELECT
    uuid_generate_v5(uuid_ns_url(), 'mialacena-demo-product-' || c.house_id::text || '-' || c.id::text),
    c.house_id,
    c.id,
    'Producto demo ' || c.name,
    12,
    'unidad',
    1,
    'ok',
    h.owner_id
  FROM target_categories c
  JOIN houses h ON h.id = c.house_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.house_id = c.house_id
      AND p.category_id = c.id
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id, house_id, category_id
),
category_products AS (
  SELECT DISTINCT ON (c.id)
    c.house_id,
    c.id AS category_id,
    p.product_id,
    c."order" AS category_order
  FROM target_categories c
  JOIN (
    SELECT
      p.id AS product_id,
      p.house_id,
      p.category_id,
      p.created_at
    FROM products p
    JOIN target_categories c
      ON c.house_id = p.house_id
     AND c.id = p.category_id

    UNION ALL

    SELECT
      dp.id AS product_id,
      dp.house_id,
      dp.category_id,
      NOW() AS created_at
    FROM demo_products dp
  ) p
    ON p.house_id = c.house_id
   AND p.category_id = c.id
  ORDER BY c.id, p.created_at
),
months AS (
  SELECT
    date_trunc('month', CURRENT_DATE)::date AS month_start,
    0 AS month_offset
  UNION ALL
  SELECT
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date,
    1
  UNION ALL
  SELECT
    (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date,
    2
),
events AS (
  SELECT
    uuid_generate_v5(
      uuid_ns_url(),
      'mialacena-consumption-demo-' ||
        cp.house_id::text || '-' ||
        cp.category_id::text || '-' ||
        to_char(m.month_start, 'YYYY-MM') || '-' ||
        gs::text
    ) AS id,
    cp.house_id,
    cp.product_id,
    cp.category_id,
    1 + ((cp.category_order + gs + m.month_offset) % 3) AS quantity_consumed,
    (
      m.month_start
      + ((gs * 3 + cp.category_order) % 25) * INTERVAL '1 day'
      + ((9 + gs + cp.category_order) % 10) * INTERVAL '1 hour'
    ) AS consumed_at
  FROM category_products cp
  CROSS JOIN months m
  CROSS JOIN generate_series(1, 3) AS gs
)
INSERT INTO consumption_events (
  id,
  house_id,
  product_id,
  category_id,
  quantity_consumed,
  consumed_at,
  reference_month,
  reference_year
)
SELECT
  id,
  house_id,
  product_id,
  category_id,
  quantity_consumed,
  consumed_at,
  EXTRACT(MONTH FROM consumed_at)::INT,
  EXTRACT(YEAR FROM consumed_at)::INT
FROM events
ON CONFLICT (id) DO NOTHING;
