import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Wallet, Users, Building, PlusCircle, MoreHorizontal, CreditCard, Landmark, Bitcoin } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { CorporateLease, Property, CryptoCurrency } from "@shared/schema";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe/publishable-key")
      .then((res) => res.json())
      .then((data) => loadStripe(data.publishableKey))
      .catch(() => null);
  }
  return stripePromise;
}

function CheckoutForm({ amount, onSuccess, onCancel }: { amount: number; onSuccess: () => void; onCancel: () => void }) {
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
      <PaymentElement />
      {error && <p className="text-sm text-red-500" data-testid="text-payment-error">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!stripe || processing} data-testid="button-confirm-payment">
          {processing ? "Processing..." : `Pay $${amount.toLocaleString()}`}
        </Button>
      </div>
    </form>
  );
}

export default function Customers() {
  const { toast } = useToast();
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ach");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    getStripePromise().then((s) => setStripeReady(!!s));
  }, []);

  const { data: leases = [], isLoading: leasesLoading } = useQuery<CorporateLease[]>({
    queryKey: ["/api/leases"],
  });

  const { data: propertiesList = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: cryptoList = [], isLoading: cryptoLoading } = useQuery<CryptoCurrency[]>({
    queryKey: ["/api/crypto"],
  });

  const totalRent = leases.reduce((acc, lease) => acc + lease.rent, 0);

  const handlePaymentMethodChange = async (method: string) => {
    setPaymentMethod(method);
    setClientSecret(null);

    if (method === "ach" || method === "card") {
      await createPaymentIntent(method);
    }
  };

  const handleCryptoPayment = () => {
    setShowPayDialog(false);
    toast({
      title: "Crypto Payment Initiated",
      description: `Payment of $${totalRent.toLocaleString()} via ${selectedCrypto} submitted to smart contract.`,
    });
  };

  const openPayDialogWithMethod = (method: string) => {
    if (method === "crypto") {
      setPaymentMethod("crypto");
      setClientSecret(null);
      setShowPayDialog(true);
      return;
    }
    setPaymentMethod(method);
    setClientSecret(null);
    setShowPayDialog(true);
    createPaymentIntent(method);
  };

  const createPaymentIntent = async (method: string) => {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalRent,
          paymentMethodType: method,
          description: `Corporate lease payment - ${leases.length} units`,
          metadata: { type: "corporate_lease_payment", units: String(leases.length) },
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch {
      toast({ title: "Error", description: "Payment service unavailable", variant: "destructive" });
    } finally {
      setStripeLoading(false);
    }
  };

  const isLoading = leasesLoading || propertiesLoading || cryptoLoading;

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
            <div className="flex items-center gap-3 mb-2">
              <Building className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-primary" data-testid="text-customer-title">Corporate Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage employee housing, leases, and consolidated billing.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" data-testid="button-manage-team"><Users className="mr-2 h-4 w-4" /> Manage Team</Button>
             <Button data-testid="button-new-lease"><PlusCircle className="mr-2 h-4 w-4" /> New Lease Request</Button>
          </div>
        </div>

        <Tabs defaultValue="leases" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="leases" data-testid="tab-leases">Active Leases</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Company Billing</TabsTrigger>
            <TabsTrigger value="search" data-testid="tab-search">Find Housing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leases" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-total-units">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Units</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-total-units">{leases.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across 3 cities</p>
                </CardContent>
              </Card>
              <Card data-testid="card-monthly-spend">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-monthly-spend">${totalRent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Next due: Nov 1st</p>
                </CardContent>
              </Card>
              <Card data-testid="card-renewals">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Renewals Needed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{leases.filter(l => l.status === 'Renewing').length || 1}</div>
                  <p className="text-xs text-muted-foreground mt-1">Expiring in 30 days</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Employee Housing Roster</CardTitle>
                <CardDescription>View and manage all active company leases.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leases.map((lease) => (
                      <TableRow key={lease.id} data-testid={`row-lease-${lease.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lease.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{lease.employeeId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{lease.propertyName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              lease.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                              lease.status === 'Renewing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }
                          >
                            {lease.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">${lease.rent.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {leases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No active leases found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 mt-6">
             <Card>
               <CardHeader>
                 <CardTitle>Consolidated Billing</CardTitle>
                 <CardDescription>Pay for all employee leases in one transaction.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="flex justify-between items-center p-6 border rounded-lg bg-slate-50" data-testid="card-invoice">
                    <div>
                      <h3 className="text-lg font-bold">November 2023 Invoice</h3>
                      <p className="text-muted-foreground">Includes {leases.length} properties</p>
                    </div>
                    <div className="text-right">
                       <p className="text-3xl font-bold" data-testid="text-invoice-amount">${totalRent.toLocaleString()}</p>
                       <p className="text-sm text-red-500 font-medium">Due in 5 days</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Card className="border-2 cursor-pointer hover:border-primary transition-colors" onClick={() => openPayDialogWithMethod("card")} data-testid="card-pay-card">
                     <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                       <CreditCard className="h-8 w-8 text-primary" />
                       <p className="font-bold">Credit/Debit Card</p>
                       <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                     </CardContent>
                   </Card>
                   <Card className="border-2 cursor-pointer hover:border-primary transition-colors" onClick={() => openPayDialogWithMethod("ach")} data-testid="card-pay-ach">
                     <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                       <Landmark className="h-8 w-8 text-blue-600" />
                       <p className="font-bold">ACH Bank Transfer</p>
                       <p className="text-xs text-muted-foreground">Direct from company bank</p>
                     </CardContent>
                   </Card>
                   <Card className="border-2 cursor-pointer hover:border-primary transition-colors" onClick={() => openPayDialogWithMethod("crypto")} data-testid="card-pay-crypto">
                     <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                       <Bitcoin className="h-8 w-8 text-purple-600" />
                       <p className="font-bold">Web3 Wallet</p>
                       <p className="text-xs text-muted-foreground">Pay with cryptocurrency</p>
                     </CardContent>
                   </Card>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
          
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Find Corporate Housing</CardTitle>
                <CardDescription>Search for properties available for immediate corporate lease.</CardDescription>
                <div className="flex gap-4 mt-4">
                  <Input placeholder="Search by city, proximity to office..." className="max-w-md" data-testid="input-search-properties" />
                  <Button data-testid="button-search"><Search className="mr-2 h-4 w-4" /> Search</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propertiesList.map((property) => (
                    <div key={property.id} className="border rounded-lg overflow-hidden group hover:shadow-md transition-shadow" data-testid={`card-search-property-${property.id}`}>
                      <div className="h-48 overflow-hidden relative">
                         <img src={property.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                         <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                           ${property.price}/mo
                         </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold mb-1">{property.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{property.address}</p>
                        <div className="flex gap-2">
                          <Button className="w-full" size="sm" data-testid={`button-view-details-${property.id}`}>View Details</Button>
                          <Button variant="outline" className="w-full" size="sm" data-testid={`button-request-lease-${property.id}`}>Request Lease</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {propertiesList.length === 0 && (
                    <p className="text-muted-foreground col-span-3 text-center py-8">No properties available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Process Corporate Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Invoice Total</span>
              <span className="text-xl font-bold">${totalRent.toLocaleString()}</span>
            </div>
             
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">Company Bank Account (ACH)</SelectItem>
                  <SelectItem value="card">Corporate Credit Card</SelectItem>
                  <SelectItem value="crypto">Corporate Web3 Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'crypto' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label>Select Treasury Asset</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger data-testid="select-crypto-asset">
                    <SelectValue placeholder="Select Token" />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoList.filter(c => c.enabled).map(c => (
                      <SelectItem key={c.id} value={c.symbol}>
                        {c.name} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Instant settlement via smart contract.
                </p>
                <DialogFooter>
                  <Button onClick={handleCryptoPayment} disabled={!selectedCrypto} data-testid="button-pay-crypto">
                    Pay with {selectedCrypto || "Crypto"}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {(paymentMethod === 'ach' || paymentMethod === 'card') && (
              <>
                {stripeLoading && (
                  <div className="py-8 text-center text-muted-foreground">Loading payment form...</div>
                )}
                {clientSecret && stripeReady && !stripeLoading && (
                  <Elements
                    stripe={getStripePromise()}
                    options={{
                      clientSecret,
                      appearance: { theme: "stripe" },
                    }}
                  >
                    <CheckoutForm
                      amount={totalRent}
                      onSuccess={() => {
                        setShowPayDialog(false);
                        toast({
                          title: "Payment Successful",
                          description: `$${totalRent.toLocaleString()} processed via ${paymentMethod === 'card' ? 'credit card' : 'ACH bank transfer'}.`,
                        });
                      }}
                      onCancel={() => setShowPayDialog(false)}
                    />
                  </Elements>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
