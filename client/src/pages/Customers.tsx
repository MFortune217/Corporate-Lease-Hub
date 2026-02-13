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
import { documents, properties, cryptoCurrencies } from "@/lib/mockData";
import { Search, FileSignature, CheckCircle2, Wallet, CreditCard } from "lucide-react";
import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useToast } from "@/hooks/use-toast";

export default function Customers() {
  const { toast } = useToast();
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  
  const sigPad = useRef<any>(null);

  const clearSignature = () => {
    sigPad.current?.clear();
  };

  const saveSignature = () => {
    setShowSignDialog(false);
    toast({
      title: "Document Signed",
      description: "Lease agreement has been securely signed and stored.",
    });
  };

  const handlePayment = () => {
    setShowPayDialog(false);
    toast({
      title: "Payment Successful",
      description: `Payment processed via ${paymentMethod === 'crypto' ? selectedCrypto : 'Credit Card'}. Transaction ID: #TX-${Math.floor(Math.random() * 10000)}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Navbar />
      
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">Customer Portal</h1>
            <p className="text-muted-foreground">Manage your leases, payments, and documents.</p>
          </div>
          <Button>Browse New Listings</Button>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="search">Search Properties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Lease Card */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Active Lease</CardTitle>
                  <CardDescription>Your current residence details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <img 
                      src={properties[0].image} 
                      alt="Current Apartment" 
                      className="w-full md:w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{properties[0].title}</h3>
                      <p className="text-muted-foreground">{properties[0].address}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        <Badge variant="outline">Lease ends: Dec 2026</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="justify-start w-full">
                        <Wallet className="mr-2 h-4 w-4" /> Make Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make a Payment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                         <div className="space-y-2">
                           <Label>Amount Due</Label>
                           <div className="text-2xl font-bold">$3,500.00</div>
                         </div>
                         
                         <div className="space-y-2">
                           <Label>Payment Method</Label>
                           <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                             <SelectTrigger>
                               <SelectValue placeholder="Select method" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="card">Credit / Debit Card</SelectItem>
                               <SelectItem value="ach">Bank Transfer (ACH)</SelectItem>
                               <SelectItem value="crypto">Cryptocurrency (Web3)</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         {paymentMethod === 'crypto' && (
                           <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                             <Label>Select Token</Label>
                             <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select Token" />
                               </SelectTrigger>
                               <SelectContent>
                                 {cryptoCurrencies.filter(c => c.enabled).map(c => (
                                   <SelectItem key={c.id} value={c.symbol}>
                                     {c.name} ({c.symbol})
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                             <p className="text-xs text-muted-foreground mt-2">
                               Transaction will be processed via your connected Web3 wallet.
                             </p>
                           </div>
                         )}

                         {paymentMethod === 'card' && (
                           <div className="space-y-2">
                              <Input placeholder="Card Number" />
                              <div className="flex gap-2">
                                <Input placeholder="MM/YY" />
                                <Input placeholder="CVC" />
                              </div>
                           </div>
                         )}
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePayment}>Pay Now</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="justify-start">
                    <FileSignature className="mr-2 h-4 w-4" /> View Documents
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Service Request
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle>Documents & Signatures</CardTitle>
                <CardDescription>Pending actions for your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${doc.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                          <FileTextIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">Date: {doc.date}</p>
                        </div>
                      </div>
                      
                      {doc.status === 'Pending' ? (
                        <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm">Sign Now</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Sign Document</DialogTitle>
                            </DialogHeader>
                            <div className="border rounded-md p-1 bg-white">
                              <SignatureCanvas 
                                ref={sigPad}
                                canvasProps={{
                                  className: "w-full h-40 bg-white cursor-crosshair"
                                }} 
                              />
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                              Draw your signature above
                            </div>
                            <DialogFooter className="sm:justify-between">
                              <Button variant="ghost" onClick={clearSignature}>Clear</Button>
                              <Button onClick={saveSignature}>Confirm Signature</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>Signed</Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Search Properties</CardTitle>
                <div className="flex gap-4 mt-4">
                  <Input placeholder="Search by location, amenities..." className="max-w-md" />
                  <Button><Search className="mr-2 h-4 w-4" /> Search</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <div key={property.id} className="border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="h-48 overflow-hidden relative">
                         <img src={property.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                         <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                           ${property.price}/mo
                         </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold mb-1">{property.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{property.address}</p>
                        <Button className="w-full" size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

function FileTextIcon(props: any) {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
