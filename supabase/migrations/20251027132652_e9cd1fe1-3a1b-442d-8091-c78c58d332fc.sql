-- Criar tabela de log de atividades do usuário
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('upload', 'quiz', 'goal', 'class_join', 'class_create', 'material_upvote')),
  points_earned INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índice para melhorar performance de queries por usuário
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias atividades
CREATE POLICY "Users can view their own activity"
ON public.activity_log
FOR SELECT
USING (auth.uid() = user_id);

-- Política: usuários podem inserir suas próprias atividades
CREATE POLICY "Users can insert their own activity"
ON public.activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Comentário na tabela
COMMENT ON TABLE public.activity_log IS 'Registra todas as atividades do usuário para exibição no dashboard e gamificação';