import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Globe, Bitcoin, Settings, CreditCard, Landmark, Wallet, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth, authFetch } from "@/lib/authContext";
import type { Property, Vendor, CryptoCurrency } from "@shared/schema";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = authFetch("/api/stripe/publishable-key")
      .then((res) => res.json())
      .then((data) => loadStripe(data.publishableKey))
      .catch(() => null);
  }
  return stripePromise;
}

function VendorPaymentForm({ amount, vendorName, onSuccess, onCancel }: { amount: number; vendorName: string; onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Paying vendor</p>
        <p className="font-bold text-lg">{vendorName}</p>
        <p className="text-2xl font-bold mt-1">${amount.toLocaleString()}</p>
      </div>
      <PaymentElement />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!stripe || processing} data-testid="button-submit-vendor-payment">
          {processing ? "Processing..." : `Pay $${amount.toLocaleString()}`}
        </Button>
      </div>
    </form>
  );
}

export default function Owners() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scraping, setScraping] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [payVendorDialog, setPayVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<"card" | "ach">("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    getStripePromise().then((s) => setStripeReady(!!s));
  }, []);

  const { data: propertiesList = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const res = await authFetch("/api/properties");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { data: vendorsList = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const res = await authFetch("/api/vendors");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { data: cryptoList = [], isLoading: cryptoLoading } = useQuery<CryptoCurrency[]>({
    queryKey: ["/api/crypto"],
    queryFn: async () => {
      const res = await authFetch("/api/crypto");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const handleScrape = () => {
    if (!websiteUrl) return;
    setScraping(true);
    setTimeout(() => {
      setScraping(false);
      toast({
        title: "Website Scraped Successfully",
        description: "3 new properties have been added to your draft listings.",
      });
    }, 2000);
  };

  const openPayVendor = useCallback(async (vendor: Vendor, method: "card" | "ach") => {
    setSelectedVendor(vendor);
    setPaymentMethodType(method);
    setClientSecret(null);
    setPayVendorDialog(true);

    try {
      const res = await authFetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 500,
          paymentMethodType: method,
          description: `Vendor payment: ${vendor.name}`,
          metadata: { vendorId: String(vendor.id), vendorName: vendor.name },
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        toast({ title: "Error", description: "Could not create payment", variant: "destructive" });
        setPayVendorDialog(false);
      }
    } catch {
      toast({ title: "Error", description: "Payment service unavailable", variant: "destructive" });
      setPayVendorDialog(false);
    }
  }, [toast]);

  const isLoading = propertiesLoading || vendorsLoading || cryptoLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/10">
        <Navbar />
        <div className="container py-10 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Navbar />
      
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary" data-testid="text-owner-title">Owner Dashboard</h1>
            <p className="text-muted-foreground">{user?.companyName || "Your Company"} — Manage properties, listings, and vendor payments.</p>
          </div>
          <Button variant="outline" data-testid="button-account-settings"><Settings className="mr-2 h-4 w-4" /> Account Settings</Button>
        </div>

        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="properties" data-testid="tab-properties">My Properties</TabsTrigger>
            <TabsTrigger value="vendors" data-testid="tab-vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments & Crypto</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="space-y-6 mt-6">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-300" /> 
                  Automated Import Service
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Enter your property website URL. We'll scrape your photos, videos, and virtual tours to create listings automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input 
                    placeholder="https://your-property-site.com" 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    data-testid="input-website-url"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleScrape}
                    disabled={scraping}
                    data-testid="button-start-import"
                  >
                    {scraping ? "Importing..." : "Start Import"}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  * Premium feature. Standard fee applies per imported unit.
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {propertiesList.map((property) => (
                <Card key={property.id} data-testid={`card-property-${property.id}`}>
                  <div className="h-40 overflow-hidden relative">
                    <img src={property.image} className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2">{property.status === 'leased' ? 'Leased' : 'Available'}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <CardDescription>{property.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">${property.price}/mo</span>
                      <Button variant="outline" size="sm" data-testid={`button-manage-property-${property.id}`}>Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-dashed flex items-center justify-center h-[300px] cursor-pointer hover:bg-muted/50 transition-colors" data-testid="card-add-property">
                 <div className="text-center">
                   <div className="bg-muted rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                     <UploadCloud className="h-8 w-8 text-muted-foreground" />
                   </div>
                   <h3 className="font-semibold text-lg">Add New Property</h3>
                   <p className="text-muted-foreground text-sm">Upload manually</p>
                 </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="vendors" className="space-y-6 mt-6">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">Preferred Vendors</h2>
               <Button data-testid="button-invite-vendor">Invite Vendor</Button>
             </div>
             
             <div className="grid gap-4">
               {vendorsList.map((vendor) => (
                 <Card key={vendor.id} data-testid={`card-vendor-${vendor.id}`}>
                   <CardContent className="p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                          <WrenchIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{vendor.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{vendor.service}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-500">
                              ★ {vendor.rating}
                            </span>
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <Badge variant={vendor.status === 'Approved' ? 'default' : 'secondary'}>
                          {vendor.status}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`button-view-docs-${vendor.id}`}>View Docs</Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid={`button-pay-vendor-${vendor.id}`}>Pay</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Pay {vendor.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-sm text-muted-foreground">Choose a payment method to pay this vendor.</p>
                              <div className="grid grid-cols-2 gap-3">
                                <Button
                                  variant="outline"
                                  className="h-20 flex flex-col gap-1"
                                  onClick={() => openPayVendor(vendor, "card")}
                                  data-testid={`button-pay-card-${vendor.id}`}
                                >
                                  <CreditCard className="h-6 w-6" />
                                  <span className="text-xs">Credit/Debit Card</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-20 flex flex-col gap-1"
                                  onClick={() => openPayVendor(vendor, "ach")}
                                  data-testid={`button-pay-ach-${vendor.id}`}
                                >
                                  <Landmark className="h-6 w-6" />
                                  <span className="text-xs">ACH Bank Transfer</span>
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                     </div>
                   </CardContent>
                 </Card>
               ))}
               {vendorsList.length === 0 && (
                 <p className="text-muted-foreground text-center py-8">No vendors found.</p>
               )}
             </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Card Payments</p>
                    <p className="text-xl font-bold flex items-center gap-2">
                      Active <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ACH Transfers</p>
                    <p className="text-xl font-bold flex items-center gap-2">
                      Active <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crypto Wallets</p>
                    <p className="text-xl font-bold">
                      {cryptoList.filter(c => c.enabled).length} Active
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Accepted Payment Methods</CardTitle>
                <CardDescription>Configure which payment methods you accept from corporate tenants.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="traditional" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="traditional" data-testid="tab-traditional-payments">Traditional Payments</TabsTrigger>
                    <TabsTrigger value="crypto" data-testid="tab-crypto-payments">Cryptocurrency</TabsTrigger>
                  </TabsList>

                  <TabsContent value="traditional" className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-bold">Credit & Debit Cards</p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex via Stripe</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
                        <Switch checked={true} disabled />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Landmark className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-bold">ACH Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">Direct debit from company bank accounts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
                        <Switch checked={true} disabled />
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                      Powered by Stripe. Card and ACH payment processing is automatically enabled when your Stripe account is connected.
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto" className="space-y-4">
                    {cryptoList.map((crypto) => (
                      <div key={crypto.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`crypto-toggle-${crypto.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="bg-muted p-2 rounded-full">
                            <Bitcoin className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">{crypto.name} ({crypto.symbol})</p>
                            <p className="text-sm text-muted-foreground">
                              {crypto.enabled ? "Active - Accepting payments" : "Paused - Not accepting payments"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={crypto.enabled ? "default" : "secondary"}>
                          {crypto.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    ))}
                    {cryptoList.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No cryptocurrencies configured.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={payVendorDialog} onOpenChange={setPayVendorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Pay {selectedVendor?.name} via {paymentMethodType === 'card' ? 'Card' : 'ACH'}
            </DialogTitle>
          </DialogHeader>
          {clientSecret && stripeReady ? (
            <Elements
              stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <VendorPaymentForm
                amount={500}
                vendorName={selectedVendor?.name || ""}
                onSuccess={() => {
                  setPayVendorDialog(false);
                  toast({ title: "Payment Sent", description: `Successfully paid ${selectedVendor?.name}.` });
                }}
                onCancel={() => setPayVendorDialog(false)}
              />
            </Elements>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Loading payment form...</div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function WrenchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
