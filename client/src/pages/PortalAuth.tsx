import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Building2, ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { motion } from "framer-motion";

type PortalType = "customer" | "owner" | "vendor";

const portalConfig: Record<PortalType, {
  title: string;
  subtitle: string;
  icon: typeof Building;
  iconBg: string;
  iconText: string;
  bgGradient: string;
  dashboardPath: string;
  features: string[];
}> = {
  customer: {
    title: "Corporate Partners",
    subtitle: "Manage employee housing and consolidated billing",
    icon: Building2,
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
    bgGradient: "from-indigo-600 to-blue-700",
    dashboardPath: "/customers/dashboard",
    features: [
      "Search and lease properties for employees",
      "Consolidated billing and payment management",
      "Track lease agreements and renewals",
      "Crypto and traditional payment options",
    ],
  },
  owner: {
    title: "Property Owners",
    subtitle: "Automated listing management and payment tracking",
    icon: Building,
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    bgGradient: "from-blue-600 to-cyan-700",
    dashboardPath: "/owners/dashboard",
    features: [
      "Automated website scraping for listings",
      "Receive payments via ACH, card, or crypto",
      "Manage vendor service requests",
      "Real-time payment notifications",
    ],
  },
  vendor: {
    title: "Service Vendors",
    subtitle: "Connect with property managers and get paid fast",
    icon: ShieldCheck,
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    bgGradient: "from-amber-600 to-orange-700",
    dashboardPath: "/vendors/dashboard",
    features: [
      "Upload compliance documents",
      "Receive and manage job requests",
      "Fast payouts via card, ACH, or crypto",
      "Track job history and earnings",
    ],
  },
};

interface PortalAuthProps {
  portalType: PortalType;
}

export default function PortalAuth({ portalType }: PortalAuthProps) {
  const config = portalConfig[portalType];
  const Icon = config.icon;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Login Failed", description: data.message, variant: "destructive" });
        return;
      }
      login(data);
      toast({ title: "Welcome back!", description: `Signed in as ${data.companyName || data.username}` });
      setLocation(config.dashboardPath);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match.", variant: "destructive" });
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
          role: portalType,
          companyName: registerForm.companyName,
          email: registerForm.email,
          phone: registerForm.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Registration Failed", description: data.message, variant: "destructive" });
        return;
      }
      login(data);
      toast({ title: "Account Created!", description: `Welcome to CorpLease, ${data.companyName}!` });
      setLocation(config.dashboardPath);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex">
        <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${config.bgGradient} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                <Icon className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-display font-bold mb-4">{config.title}</h1>
              <p className="text-xl text-white/80 mb-12">{config.subtitle}</p>
              <div className="space-y-4">
                {config.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-white/90 flex-shrink-0" />
                    <span className="text-white/90">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className={`h-12 w-12 ${config.iconBg} ${config.iconText} rounded-xl flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{config.title}</h2>
                <p className="text-sm text-muted-foreground">{config.subtitle}</p>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Register Company</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>Sign in to access your {config.title.toLowerCase()} dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          data-testid="input-login-username"
                          placeholder="Enter your username"
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            data-testid="input-login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        data-testid="button-login"
                        className="w-full"
                        disabled={loginLoading}
                      >
                        {loginLoading ? "Signing in..." : "Sign In"}
                        {!loginLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                      <div className="text-center pt-2">
                        <Link href="/password-reset" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                          Forgot your password?
                        </Link>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Register Your Company</CardTitle>
                    <CardDescription>Create an account to get started with CorpLease</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-company">Company Name</Label>
                        <Input
                          id="reg-company"
                          data-testid="input-register-company"
                          placeholder="Acme Corporation"
                          value={registerForm.companyName}
                          onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-email">Business Email</Label>
                          <Input
                            id="reg-email"
                            data-testid="input-register-email"
                            type="email"
                            placeholder="admin@company.com"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-phone">Phone (optional)</Label>
                          <Input
                            id="reg-phone"
                            data-testid="input-register-phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">Username</Label>
                        <Input
                          id="reg-username"
                          data-testid="input-register-username"
                          placeholder="Choose a username"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-password">Password</Label>
                          <Input
                            id="reg-password"
                            data-testid="input-register-password"
                            type="password"
                            placeholder="Create a password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-confirm">Confirm Password</Label>
                          <Input
                            id="reg-confirm"
                            data-testid="input-register-confirm"
                            type="password"
                            placeholder="Confirm password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        data-testid="button-register"
                        className="w-full"
                        disabled={registerLoading}
                      >
                        {registerLoading ? "Creating Account..." : "Create Account"}
                        {!registerLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        By registering, you agree to the CorpLease Terms of Service and Privacy Policy.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
