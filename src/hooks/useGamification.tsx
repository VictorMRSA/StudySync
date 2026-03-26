import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GamificationData {
  experiencePoints: number;
  currentLevel: number;
  nextLevelXp: number;
  streakDays: number;
  loading: boolean;
}

export const useGamification = () => {
  const [data, setData] = useState<GamificationData>({
    experiencePoints: 0,
    currentLevel: 1,
    nextLevelXp: 100,
    streakDays: 0,
    loading: true,
  });

  const fetchGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_points, current_level, next_level_xp, streak_days' as any)
        .eq('user_id', user.id)
        .single() as any;

      if (profile) {
        setData({
          experiencePoints: profile.experience_points || 0,
          currentLevel: profile.current_level || 1,
          nextLevelXp: profile.next_level_xp || 100,
          streakDays: profile.streak_days || 0,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const addExperience = async (points: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_points, current_level' as any)
        .eq('user_id', user.id)
        .single() as any;

      if (profile) {
        const oldLevel = profile.current_level;
        const newXp = profile.experience_points + points;

        const { data: updated } = await supabase
          .from('profiles')
          .update({ experience_points: newXp } as any)
          .eq('user_id', user.id)
          .select('current_level, next_level_xp' as any)
          .single() as any;

        if (updated && updated.current_level > oldLevel) {
          toast({
            title: `🎉 Você subiu para o Nível ${updated.current_level}!`,
            description: `Continue assim! Próximo nível em ${updated.next_level_xp} XP`,
          });
        }

        toast({
          title: `+${points} XP`,
          description: reason,
        });

        await fetchGamificationData();
      }
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const awardBadge = async (badgeName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: badge } = await (supabase
        .from('badges' as any)
        .select('id')
        .eq('name', badgeName)
        .single() as any);

      if (!badge) return;

      const { error } = await (supabase
        .from('user_badges' as any)
        .insert({ user_id: user.id, badge_id: badge.id }) as any);

      if (!error) {
        toast({
          title: `🏆 Nova Conquista: ${badgeName}!`,
          description: 'Badge desbloqueado com sucesso!',
        });
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  useEffect(() => {
    fetchGamificationData();

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        () => fetchGamificationData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ...data,
    addExperience,
    awardBadge,
    refresh: fetchGamificationData,
  };
};
