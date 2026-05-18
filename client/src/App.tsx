import { Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { AppRouter } from "@/routes";

export default function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <WouterRouter base="">
          <AppRouter />
        </WouterRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  );
}
