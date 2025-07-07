import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../src/components/ui/toaster";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { AuthProvider } from "../src/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "../src/pages/home-page";
import AuthPage from "../src/pages/auth-page";
import AdminPage from "../src/pages/admin-page";
import NotFound from "../src/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/admin" component={AdminPage} requiredRole="admin" />
      <ProtectedRoute path="/vendor" component={AdminPage} requiredRole="vendor" />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
