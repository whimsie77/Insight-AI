import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DatasetProvider } from "./hooks/dataset-provider";
import { setBaseUrl } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import LandingPage from "./pages/landing";
import DashboardPage from "./pages/dashboard";

// Point API calls at the deployed backend, with Render URL as fallback
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "https://insight-ai-f2nh.onrender.com";
setBaseUrl(API_URL);

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatasetProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SonnerToaster />
        </TooltipProvider>
      </DatasetProvider>
    </QueryClientProvider>
  );
}

export default App;
