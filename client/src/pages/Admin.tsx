import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cryptoCurrencies, documents, vendors } from "@/lib/mockData";
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings,
  Users
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { toast } = useToast();
  const [cryptos, setCryptos] = useState(cryptoCurrencies);

  const toggleCrypto = (id: string) => {
    setCryptos(cryptos.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
    toast({
      title: "Platform Setting Updated",
      description: "Payment method availability has been changed for all users.",
    });
  };

  const handleDocumentAction = (action: 'approve' | 'reject') => {
    toast({
      title: action === 'approve' ? "Document Approved" : "Document Rejected",
      description: action === 'approve' ? "Vendor has been notified." : "Request for revision sent.",
      variant: action === 'approve' ? "default" : "destructive"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-primary">Super Admin</h1>
              <p className="text-muted-foreground">Platform Oversight & Configuration</p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> System Logs</Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="finance">Finance & Crypto</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$124,500</div>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> +15% this month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Leases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">42</div>
                  <p className="text-xs text-muted-foreground mt-1">Across 8 cities</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Docs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">12</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 inline mr-1" /> Customers & Owners
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card>
                 <CardHeader>
                   <CardTitle>Recent Transactions</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {[1, 2, 3, 4].map((i) => (
                       <div key={i} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${i % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                             {i % 2 === 0 ? <ArrowDownLeft className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                           </div>
                           <div>
                             <p className="font-medium">{i % 2 === 0 ? 'Lease Payment Received' : 'Vendor Payout'}</p>
                             <p className="text-xs text-muted-foreground">
                               {i % 2 === 0 ? 'From: TechCorp Inc.' : 'To: Sparkle Cleaners'}
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className={`font-bold ${i % 2 === 0 ? 'text-green-600' : ''}`}>
                             {i % 2 === 0 ? '+' : '-'}${i * 450}.00
                           </p>
                           <p className="text-xs text-muted-foreground">Oct {10+i}, 2023</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardHeader>
                   <CardTitle>System Health</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <span>Web3 Gateway</span>
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Operational</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <span>Document Storage</span>
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Operational</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <span>Email Service</span>
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Operational</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <span>Scraping Bot</span>
                       <Badge variant="outline" className="text-amber-600 border-amber-200">Idle</Badge>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Crypto Configuration</CardTitle>
                <CardDescription>
                  Control which cryptocurrencies are accepted across the entire platform. 
                  Disabling a currency here removes it for all customers and vendors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Network Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cryptos.map((crypto) => (
                      <TableRow key={crypto.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                               {crypto.symbol[0]}
                            </div>
                            {crypto.name}
                          </div>
                        </TableCell>
                        <TableCell>{crypto.symbol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Label htmlFor={`admin-crypto-${crypto.id}`} className="mr-2 text-sm text-muted-foreground">
                              {crypto.enabled ? "Approved" : "Disabled"}
                            </Label>
                            <Switch 
                              id={`admin-crypto-${crypto.id}`}
                              checked={crypto.enabled}
                              onCheckedChange={() => toggleCrypto(crypto.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6 mt-6">
             <Card>
               <CardHeader>
                 <CardTitle>Pending Document Reviews</CardTitle>
                 <CardDescription>Approve vendor certifications and property owner deeds.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {[
                     { id: 1, type: "Vendor Insurance", user: "Sparkle Cleaners", status: "Review Needed", date: "Oct 14" },
                     { id: 2, type: "Property Deed", user: "John Smith (Owner)", status: "Review Needed", date: "Oct 15" },
                     { id: 3, type: "Business License", user: "FixIt Fast HVAC", status: "Review Needed", date: "Oct 16" },
                   ].map((item) => (
                     <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg bg-white gap-4">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                           <FileText className="h-6 w-6" />
                         </div>
                         <div>
                           <h4 className="font-bold">{item.type}</h4>
                           <p className="text-sm text-muted-foreground">Submitted by: {item.user} • {item.date}</p>
                         </div>
                       </div>
                       <div className="flex gap-2 w-full md:w-auto">
                         <Button 
                           variant="outline" 
                           className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                           onClick={() => handleDocumentAction('reject')}
                         >
                           <XCircle className="mr-2 h-4 w-4" /> Reject
                         </Button>
                         <Button 
                           className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                           onClick={() => handleDocumentAction('approve')}
                         >
                           <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                         </Button>
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
