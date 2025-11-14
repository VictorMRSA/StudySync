-- Sprint 1: Sistema de Conquistas Dinâmico

-- Tabela de definições de conquistas
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de progresso do usuário
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0 NOT NULL,
  unlocked BOOLEAN DEFAULT false NOT NULL,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- RLS Policies
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conquistas são visíveis para todos"
ON public.achievements FOR SELECT 
USING (true);

CREATE POLICY "Usuários veem seu próprio progresso"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema atualiza progresso"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sistema atualiza progresso update"
ON public.user_achievements FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON public.user_achievements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed inicial de conquistas
INSERT INTO public.achievements (key, title, description, icon, category, difficulty, xp_reward, requirement_type, requirement_value) VALUES
('first_class', 'Primeira Turma', 'Crie ou participe da sua primeira turma', 'Users', 'social', 'easy', 100, 'count', 1),
('class_creator', 'Criador de Turmas', 'Crie 5 turmas diferentes', 'GraduationCap', 'social', 'medium', 250, 'count', 5),
('7_day_streak', 'Semana Perfeita', 'Mantenha uma sequência de 7 dias', 'Flame', 'streak', 'medium', 200, 'streak', 7),
('30_day_streak', 'Dedicação Total', 'Mantenha uma sequência de 30 dias', 'Trophy', 'streak', 'hard', 500, 'streak', 30),
('100_day_streak', 'Lenda Viva', 'Mantenha uma sequência de 100 dias', 'Crown', 'streak', 'legendary', 1000, 'streak', 100),
('material_sharer', 'Compartilhador', 'Compartilhe 10 materiais', 'FileText', 'materials', 'easy', 150, 'count', 10),
('knowledge_master', 'Mestre do Conhecimento', 'Compartilhe 50 materiais', 'BookOpen', 'materials', 'hard', 750, 'count', 50),
('level_10', 'Nível 10', 'Alcance o nível 10', 'Star', 'level', 'medium', 300, 'milestone', 10),
('level_25', 'Nível 25', 'Alcance o nível 25', 'Sparkles', 'level', 'hard', 600, 'milestone', 25),
('study_warrior', 'Guerreiro dos Estudos', 'Complete 50 horas de estudo focado', 'Zap', 'study', 'hard', 500, 'count', 50);