import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "./Dashboard";
import Classes from "./Classes";
import Calendar from "./Calendar";
import Profile from "./Profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "classes":
        return <Classes />;
      case "calendar":
        return <Calendar />;
      case "materials":
        return <div className="p-8 text-center text-muted-foreground">Módulo de Materiais em desenvolvimento 🚧</div>;
      case "achievements":
        return <div className="p-8 text-center text-muted-foreground">Módulo de Conquistas em desenvolvimento 🚧</div>;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main content with proper spacing for navigation */}
      <div className="lg:ml-64 pt-16 lg:pt-0 pb-16 lg:pb-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
