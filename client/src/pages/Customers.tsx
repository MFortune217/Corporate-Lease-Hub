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
import { Search, FileSignature, CheckCircle2, Wallet, Users, Building, PlusCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { CorporateLease, Property, CryptoCurrency } from "@shared/schema";

export default function Customers() {
  const { toast } = useToast();
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ach");
  const [selectedCrypto, setSelectedCrypto] = useState("");

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

  const handlePayment = () => {
    setShowPayDialog(false);
    toast({
      title: "Consolidated Payment Successful",
      description: `Payment of $${totalRent.toLocaleString()} processed via ${paymentMethod === 'crypto' ? selectedCrypto : 'Company Account'}.`,
    });
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
              <h1 className="text-3xl font-display font-bold text-primary">Corporate Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage employee housing, leases, and consolidated billing.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline"><Users className="mr-2 h-4 w-4" /> Manage Team</Button>
             <Button><PlusCircle className="mr-2 h-4 w-4" /> New Lease Request</Button>
          </div>
        </div>

        <Tabs defaultValue="leases" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="leases">Active Leases</TabsTrigger>
            <TabsTrigger value="billing">Company Billing</TabsTrigger>
            <TabsTrigger value="search">Find Housing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leases" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Units</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{leases.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across 3 cities</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${totalRent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Next due: Nov 1st</p>
                </CardContent>
              </Card>
              <Card>
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
                      <TableRow key={lease.id}>
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
                 <div className="flex justify-between items-center p-6 border rounded-lg bg-slate-50">
                    <div>
                      <h3 className="text-lg font-bold">November 2023 Invoice</h3>
                      <p className="text-muted-foreground">Includes {leases.length} properties</p>
                    </div>
                    <div className="text-right">
                       <p className="text-3xl font-bold">${totalRent.toLocaleString()}</p>
                       <p className="text-sm text-red-500 font-medium">Due in 5 days</p>
                    </div>
                 </div>

                 <div className="flex justify-end">
                    <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="w-full md:w-auto">
                          <Wallet className="mr-2 h-4 w-4" /> Pay Invoice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Process Corporate Payment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label>Total Amount</Label>
                             <div className="text-2xl font-bold">${totalRent.toLocaleString()}</div>
                           </div>
                           
                           <div className="space-y-2">
                             <Label>Payment Method</Label>
                             <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                               <SelectTrigger>
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
                             <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                               <Label>Select Treasury Asset</Label>
                               <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                                 <SelectTrigger>
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
                               <p className="text-xs text-muted-foreground mt-2">
                                 Instant settlement via smart contract.
                               </p>
                             </div>
                           )}
                        </div>
                        <DialogFooter>
                          <Button onClick={handlePayment}>Process Payment</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
                  <Input placeholder="Search by city, proximity to office..." className="max-w-md" />
                  <Button><Search className="mr-2 h-4 w-4" /> Search</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propertiesList.map((property) => (
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
                        <div className="flex gap-2">
                          <Button className="w-full" size="sm">View Details</Button>
                          <Button variant="outline" className="w-full" size="sm">Request Lease</Button>
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

      <Footer />
    </div>
  );
}
