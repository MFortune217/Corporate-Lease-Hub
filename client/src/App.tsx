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
import Contact from "@/pages/Contact";
import SearchProperties from "@/pages/SearchProperties";
import ContentPage from "@/pages/ContentPage";

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
      <Route path="/contact" component={Contact} />
      <Route path="/search" component={SearchProperties} />
      <Route path="/about">{() => <ContentPage slug="about" fallbackTitle="About Us" fallbackContent="CorpLease is the leading corporate housing platform connecting businesses with premium living spaces. Founded with a vision to simplify corporate relocation, we've grown to serve hundreds of companies across major metropolitan areas.\n\nOur platform streamlines the entire process — from property discovery to lease management and payment processing. We believe every professional deserves a comfortable home, and every company deserves a hassle-free housing solution.\n\nWith our network of property owners, vetted service vendors, and cutting-edge technology, we deliver an unmatched corporate housing experience." />}</Route>
      <Route path="/careers">{() => <ContentPage slug="careers" fallbackTitle="Careers" fallbackContent="Join the team that's transforming corporate housing. At CorpLease, we're building the future of professional relocation and property management.\n\nWe're always looking for talented individuals who share our passion for innovation and exceptional service. Whether you're in engineering, design, sales, or operations, there's a place for you here.\n\nCurrent openings include positions in Full-Stack Development, Product Design, Enterprise Sales, Customer Success, and Property Operations. We offer competitive compensation, comprehensive benefits, flexible work arrangements, and the opportunity to make a real impact." />}</Route>
      <Route path="/press">{() => <ContentPage slug="press" fallbackTitle="Press & Media" fallbackContent="CorpLease has been recognized as an industry leader in corporate housing technology. Our innovative approach to property management and tenant services has garnered attention from leading business publications.\n\nFor press inquiries, media kits, and interview requests, please reach out through our contact page. We're happy to share insights on the corporate housing industry, property technology trends, and our company's growth story." />}</Route>
      <Route path="/privacy-policy">{() => <ContentPage slug="privacy-policy" fallbackTitle="Privacy Policy" fallbackContent="At CorpLease, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.\n\nInformation We Collect: We collect information you provide directly, such as your name, email address, company details, and payment information. We also collect usage data through cookies and similar technologies.\n\nHow We Use Information: Your information is used to provide and improve our services, process transactions, communicate with you, and ensure platform security.\n\nData Protection: We implement industry-standard security measures including encryption, secure data storage, and regular security audits. We never sell your personal data to third parties." />}</Route>
      <Route path="/terms-of-service">{() => <ContentPage slug="terms-of-service" fallbackTitle="Terms of Service" fallbackContent="Welcome to CorpLease. By accessing or using our platform, you agree to be bound by these Terms of Service.\n\nAccount Registration: Users must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.\n\nPlatform Usage: CorpLease provides a marketplace connecting corporate tenants, property owners, and service vendors. All transactions are subject to applicable laws and regulations.\n\nPayment Terms: Payments processed through our platform are subject to our payment processing partner's terms." />}</Route>
      <Route path="/cookie-policy">{() => <ContentPage slug="cookie-policy" fallbackTitle="Cookie Policy" fallbackContent="CorpLease uses cookies and similar tracking technologies to enhance your experience on our platform.\n\nEssential Cookies: Required for basic platform functionality including authentication, security, and session management.\n\nAnalytics Cookies: Help us understand how visitors interact with our platform.\n\nPreference Cookies: Remember your settings and preferences for a more personalized experience.\n\nBy continuing to use CorpLease, you consent to our use of cookies as described in this policy." />}</Route>
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
