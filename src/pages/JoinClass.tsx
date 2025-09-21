import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Users, BookOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

const JoinClass = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    checkAuthAndLoadClass();
  }, [inviteCode]);

  const checkAuthAndLoadClass = async () => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Load class data
      if (inviteCode) {
        await loadClass(session.user.id);
      } else {
        setError("Código de convite inválido");
      }
    } catch (error: any) {
      console.error(error);
      setError("Erro ao carregar informações");
    } finally {
      setLoading(false);
    }
  };

  const loadClass = async (userId: string) => {
    try {
      // Find class by invite code
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("invite_code", inviteCode)
        .maybeSingle();

      if (classError || !classInfo) {
        setError("Código de convite inválido ou turma não encontrada");
        return;
      }

      setClassData(classInfo);

      // Check if user is already a member
      const { data: membership, error: memberError } = await supabase
        .from("class_members")
        .select("*")
        .eq("class_id", classInfo.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (memberError) {
        console.error("Error checking membership:", memberError);
      } else if (membership) {
        setAlreadyMember(true);
      }
    } catch (error: any) {
      console.error("Error loading class:", error);
      setError("Erro ao carregar informações da turma");
    }
  };

  const handleJoinClass = async () => {
    if (!user || !classData) return;

    setJoining(true);
    try {
      const { error: joinError } = await supabase
        .from("class_members")
        .insert({
          class_id: classData.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      toast.success("Você entrou na turma com sucesso!");
      navigate(`/class/${classData.id}`);
    } catch (error: any) {
      console.error("Error joining class:", error);
      toast.error("Erro ao entrar na turma");
    } finally {
      setJoining(false);
    }
  };

  const goToClass = () => {
    if (classData) {
      navigate(`/class/${classData.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {alreadyMember ? (
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          ) : (
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          )}
          <CardTitle className="text-2xl">
            {alreadyMember ? "Você já está nesta turma!" : "Convite para Turma"}
          </CardTitle>
          <CardDescription>
            {alreadyMember 
              ? "Você já é membro desta turma. Clique no botão abaixo para acessá-la."
              : "Você foi convidado para participar da seguinte turma:"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-primary">{classData.name}</h2>
            <p className="text-secondary font-medium">{classData.subject}</p>
            {classData.description && (
              <p className="text-muted-foreground text-sm">{classData.description}</p>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <div className="flex flex-col items-center">
              <BookOpen className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Materiais</span>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Membros</span>
            </div>
          </div>

          <div className="flex gap-2">
            {alreadyMember ? (
              <Button 
                className="flex-1"
                onClick={goToClass}
              >
                Acessar Turma
              </Button>
            ) : (
              <Button 
                className="flex-1"
                onClick={handleJoinClass}
                disabled={joining}
              >
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar na Turma"
                )}
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => navigate("/")}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinClass;