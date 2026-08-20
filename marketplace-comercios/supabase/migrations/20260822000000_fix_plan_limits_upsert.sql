-- Corrige el upsert de plan_limits: la action `updateSubscriptionPlan` hace
-- `upsert(..., { onConflict: 'plan_id' })`, que Postgres traduce a
-- `ON CONFLICT (plan_id) DO UPDATE ...`. Esa forma sin cláusula WHERE no
-- puede inferir un índice PARCIAL como plan_limits_plan_id_unique (creado
-- en 20260821000000 con `WHERE plan_id IS NOT NULL`), y falla con
-- SQLSTATE 42P10 ("no unique or exclusion constraint matching the ON
-- CONFLICT specification").
--
-- Solución: reemplazar el índice parcial por una UNIQUE CONSTRAINT normal
-- sobre plan_id. Una unique constraint estándar no choca entre múltiples
-- NULL (comportamiento por defecto de Postgres), así que sigue permitiendo
-- la fila "por defecto" con plan_id NULL sin problema; esa fila ya está
-- protegida aparte por plan_limits_default_unique.

DROP INDEX IF EXISTS public.plan_limits_plan_id_unique;

ALTER TABLE public.plan_limits
  ADD CONSTRAINT plan_limits_plan_id_key UNIQUE (plan_id);
