import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X, Wallet, Shield } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [walletConnected, setWalletConnected] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/customers", label: "For Customers" },
    { href: "/owners", label: "Property Owners" },
    { href: "/vendors", label: "Vendors" },
  ];

  const connectWallet = () => {
    // Mock wallet connection
    setTimeout(() => {
      setWalletConnected(true);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Ethereum Mainnet",
      });
    }, 1000);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Building2 className="h-6 w-6" />
            <span>CorpLease</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-border mx-2" />

          {/* Admin Link for Demo */}
          <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
             <Shield className="h-4 w-4" /> Admin
          </Link>

          <div className="flex items-center gap-2 ml-4">
            <Button 
              variant={walletConnected ? "outline" : "secondary"} 
              size="sm"
              onClick={connectWallet}
              className={walletConnected ? "bg-green-50 text-green-700 border-green-200" : ""}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {walletConnected ? "0x12...89A" : "Connect Wallet"}
            </Button>
            <Button size="sm">Log In</Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-lg font-medium ${
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                  href="/admin"
                  className="text-lg font-medium text-muted-foreground"
                  onClick={() => setIsOpen(false)}
              >
                  Admin Portal
              </Link>
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="secondary" onClick={connectWallet}>
                   <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                </Button>
                <Button className="w-full">Log In</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
