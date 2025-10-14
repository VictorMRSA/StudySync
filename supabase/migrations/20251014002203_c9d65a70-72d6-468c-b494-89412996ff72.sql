-- ========================================
-- FASE 1: INFRAESTRUTURA DE GAMIFICAÇÃO
-- ========================================

-- Adicionar campos de gamificação na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN experience_points INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN current_level INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN next_level_xp INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN streak_days INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN last_activity_date DATE;

-- Criar tabela de badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges são visíveis para todos"
ON public.badges FOR SELECT
USING (true);

-- Criar tabela de badges do usuário
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar badges para usuários"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de sessões de foco
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  plant_stage INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas sessões de foco"
ON public.focus_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de metas diárias
CREATE TABLE public.daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  goal_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas metas diárias"
ON public.daily_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de sessões de quiz
CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas sessões de quiz"
ON public.quiz_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam suas sessões de quiz"
ON public.quiz_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de desafios semanais da turma
CREATE TABLE public.class_weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(class_id, week_start)
);

ALTER TABLE public.class_weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da turma veem desafios"
ON public.class_weekly_challenges FOR SELECT
USING (is_member(class_id));

-- Criar tabela de pontuações dos desafios
CREATE TABLE public.challenge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.class_weekly_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem pontuações do desafio"
ON public.challenge_scores FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.class_weekly_challenges c
  WHERE c.id = challenge_id AND is_member(c.class_id)
));

CREATE POLICY "Usuários registram suas pontuações"
ON public.challenge_scores FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Adicionar campo de upvotes em materials
ALTER TABLE public.materials
ADD COLUMN upvotes INTEGER DEFAULT 0 NOT NULL;

-- Criar tabela de votos em materiais
CREATE TABLE public.material_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(material_id, user_id)
);

ALTER TABLE public.material_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem votos de materiais da turma"
ON public.material_votes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.materials m
  WHERE m.id = material_id AND is_member(m.class_id)
));

CREATE POLICY "Usuários votam em materiais"
ON public.material_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários removem seus votos"
ON public.material_votes FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para verificar se usuário tem badge
CREATE OR REPLACE FUNCTION public.has_badge(p_user_id UUID, p_badge_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_badges
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  );
$$;

-- Função para atualizar streak diário
CREATE OR REPLACE FUNCTION public.update_daily_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
BEGIN
  SELECT last_activity_date, streak_days
  INTO v_last_date, v_current_streak
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Se é o primeiro registro do dia
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    -- Se foi ontem, incrementa streak
    IF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
      UPDATE public.profiles
      SET streak_days = v_current_streak + 1,
          last_activity_date = CURRENT_DATE
      WHERE id = NEW.user_id;
    -- Se foi há mais tempo, reseta streak
    ELSIF v_last_date < CURRENT_DATE - INTERVAL '1 day' OR v_last_date IS NULL THEN
      UPDATE public.profiles
      SET streak_days = 1,
          last_activity_date = CURRENT_DATE
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para atualizar streak em quiz sessions
CREATE TRIGGER update_streak_on_quiz
AFTER INSERT ON public.quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_streak();

-- Trigger para atualizar streak em focus sessions
CREATE TRIGGER update_streak_on_focus
AFTER INSERT ON public.focus_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_streak();

-- Função para level up automático
CREATE OR REPLACE FUNCTION public.check_level_up()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_xp INTEGER;
  v_next_xp INTEGER;
  v_level INTEGER;
BEGIN
  v_current_xp := NEW.experience_points;
  v_next_xp := NEW.next_level_xp;
  v_level := NEW.current_level;

  -- Loop para subir múltiplos níveis se necessário
  WHILE v_current_xp >= v_next_xp LOOP
    v_level := v_level + 1;
    v_next_xp := FLOOR(v_next_xp * 1.5);
  END LOOP;

  -- Se subiu de nível, atualiza
  IF v_level > NEW.current_level THEN
    NEW.current_level := v_level;
    NEW.next_level_xp := v_next_xp;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para level up automático
CREATE TRIGGER auto_level_up
BEFORE UPDATE OF experience_points ON public.profiles
FOR EACH ROW
WHEN (NEW.experience_points > OLD.experience_points)
EXECUTE FUNCTION public.check_level_up();

-- Trigger para atualizar contagem de upvotes
CREATE OR REPLACE FUNCTION public.update_material_upvotes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.materials
    SET upvotes = upvotes + 1
    WHERE id = NEW.material_id;
    
    -- Adicionar 5 XP ao autor do material
    UPDATE public.profiles
    SET experience_points = experience_points + 5
    WHERE id = (SELECT uploaded_by FROM public.materials WHERE id = NEW.material_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.materials
    SET upvotes = upvotes - 1
    WHERE id = OLD.material_id;
    
    -- Remover 5 XP do autor do material
    UPDATE public.profiles
    SET experience_points = GREATEST(0, experience_points - 5)
    WHERE id = (SELECT uploaded_by FROM public.materials WHERE id = OLD.material_id);
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER material_vote_counter
AFTER INSERT OR DELETE ON public.material_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_material_upvotes();

-- ========================================
-- SEED DE BADGES PADRÃO
-- ========================================

INSERT INTO public.badges (name, description, icon_url) VALUES
('Primeiro Passo', 'Completou o primeiro estudo', '🎯'),
('Estudante Consistente', 'Manteve streak de 7 dias', '🔥'),
('Maratonista', 'Manteve streak de 30 dias', '⚡'),
('Mestre do Quiz', 'Acertou 100% em um quiz', '🎓'),
('Concentrado', 'Completou 5 sessões de foco', '🌱'),
('Top Aluno da Semana', 'Ficou no Top 3 do desafio semanal', '👑'),
('Explorador', 'Completou 10 marcos na jornada', '🗺️'),
('Guardião do Conhecimento', 'Recebeu 50 upvotes em materiais', '⭐'),
('Nível 10', 'Alcançou o nível 10', '💎'),
('Nível 25', 'Alcançou o nível 25', '💫');