-- Registos de execução de testes (Vitest) gravados pelo backend via service_role.
CREATE TABLE IF NOT EXISTS public.ancora_backend_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  summary text NOT NULL,
  vitest_output text
);

COMMENT ON TABLE public.ancora_backend_test_runs IS 'Histórico de execuções npm test / Vitest (gravado por recordTestRun).';

-- Tabela só acessível via service_role (GRANT abaixo); sem RLS evita conflitos PostgREST/service_role.
ALTER TABLE public.ancora_backend_test_runs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.ancora_backend_test_runs TO service_role;
