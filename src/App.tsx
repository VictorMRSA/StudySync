import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calendar from "./pages/Calendar";
import ClassDetails from "./pages/ClassDetails";
import JoinClass from "./pages/JoinClass";
import AIAssistant from "./pages/AIAssistant";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import MemoryGame from "./pages/MemoryGame";
import Journey from "./pages/Journey";
import FocusMode from "./pages/FocusMode";
import DifficultiesAnalysis from "./pages/DifficultiesAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/class/:id" element={<ClassDetails />} />
          <Route path="/join/:inviteCode" element={<JoinClass />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/quiz/:materialId" element={<Quiz />} />
          <Route path="/flashcards/:materialId" element={<Flashcards />} />
          <Route path="/memory-game/:materialId" element={<MemoryGame />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/difficulties" element={<DifficultiesAnalysis />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
