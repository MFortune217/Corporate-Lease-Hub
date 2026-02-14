import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/authContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Customers from "@/pages/Customers";
import Owners from "@/pages/Owners";
import Vendors from "@/pages/Vendors";
import Admin from "@/pages/Admin";
import PortalAuth from "@/pages/PortalAuth";
import PasswordReset from "@/pages/PasswordReset";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/customers">{() => <PortalAuth portalType="customer" />}</Route>
      <Route path="/owners">{() => <PortalAuth portalType="owner" />}</Route>
      <Route path="/vendors">{() => <PortalAuth portalType="vendor" />}</Route>
      <Route path="/customers/dashboard" component={Customers} />
      <Route path="/owners/dashboard" component={Owners} />
      <Route path="/vendors/dashboard" component={Vendors} />
      <Route path="/password-reset">{() => <PasswordReset />}</Route>
      <Route path="/admin" component={Admin} />
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
