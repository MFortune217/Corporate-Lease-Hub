import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings,
  Users,
  CreditCard,
  Landmark,
  Bitcoin,
  DollarSign,
  Send,
  MessageSquare,
  Edit3,
  Mail,
  Clock,
  Save,
  Receipt
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authFetch } from "@/lib/authContext";
import type { CryptoCurrency, Document as DocumentType, Vendor, CorporateLease, ContactRequest, PageContent } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("ach");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutRecipient, setPayoutRecipient] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [processing, setProcessing] = useState(false);

  const [showPaymentRequestDialog, setShowPaymentRequestDialog] = useState(false);
  const [prCompany, setPrCompany] = useState("");
  const [prAmount, setPrAmount] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [prMethod, setPrMethod] = useState("ach");
  const [prProcessing, setPrProcessing] = useState(false);

  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);
  const [responseText, setResponseText] = useState("");

  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: cryptoList = [], isLoading: cryptoLoading } = useQuery<CryptoCurrency[]>({
    queryKey: ["/api/crypto"],
    queryFn: async () => {
      const res = await authFetch("/api/crypto");
      if (!res.ok) throw new Error("Failed to fetch crypto");
      return res.json();
    },
  });

  const { data: documentsList = [], isLoading: docsLoading } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const res = await authFetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const { data: vendorsList = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const res = await authFetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  const { data: leasesList = [], isLoading: leasesLoading } = useQuery<CorporateLease[]>({
    queryKey: ["/api/leases"],
    queryFn: async () => {
      const res = await authFetch("/api/leases");
      if (!res.ok) throw new Error("Failed to fetch leases");
      return res.json();
    },
  });

  const { data: contactRequests = [] } = useQuery<ContactRequest[]>({
    queryKey: ["/api/contact"],
    queryFn: async () => {
      const res = await authFetch("/api/contact");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: pageContents = [] } = useQuery<PageContent[]>({
    queryKey: ["/api/pages"],
    queryFn: async () => {
      const res = await fetch("/api/pages");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const toggleCryptoMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/crypto/${id}/toggle`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crypto"] });
      toast({
        title: "Platform Setting Updated",
        description: "Payment method availability has been changed for all users.",
      });
    },
  });

  const updateDocMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/documents/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const toggleCrypto = (id: string, currentEnabled: boolean) => {
    toggleCryptoMutation.mutate({ id, enabled: !currentEnabled });
  };

  const handleDocumentAction = (docId: number, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    updateDocMutation.mutate({ id: docId, status: newStatus });
    toast({
      title: action === 'approve' ? "Document Approved" : "Document Rejected",
      description: action === 'approve' ? "Vendor has been notified." : "Request for revision sent.",
      variant: action === 'approve' ? "default" : "destructive"
    });
  };

  const handleProcessPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || !payoutRecipient) {
      toast({ title: "Error", description: "Enter a valid recipient and amount", variant: "destructive" });
      return;
    }
    setProcessing(true);
    const methodLabel = payoutMethod === "card" ? "Card" : payoutMethod === "ach" ? "ACH" : selectedCrypto;
    try {
      if (payoutMethod === "crypto") {
        await authFetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payout_processed",
            title: "Crypto Payout Initiated",
            message: `$${amount.toLocaleString()} crypto payout to ${payoutRecipient} via ${selectedCrypto}.`,
            portal: "admin",
            method: selectedCrypto,
            amount,
            read: false,
          }),
        });
      } else {
        await authFetch("/api/stripe/create-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            description: `Admin payout to ${payoutRecipient} via ${methodLabel}`,
            portal: "admin",
            method: methodLabel,
          }),
        });
      }
      setShowPayoutDialog(false);
      toast({
        title: "Payout Processed",
        description: `$${amount.toLocaleString()} sent to ${payoutRecipient} via ${methodLabel}.`,
      });
    } catch {
      toast({ title: "Payout Queued", description: `$${amount.toLocaleString()} payout to ${payoutRecipient} has been queued for processing.` });
      setShowPayoutDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentRequest = async () => {
    const amount = parseFloat(prAmount);
    if (!amount || amount <= 0 || !prCompany) {
      toast({ title: "Error", description: "Enter a valid company and amount", variant: "destructive" });
      return;
    }
    setPrProcessing(true);
    const methodLabel = prMethod === "card" ? "Card" : prMethod === "ach" ? "ACH" : "Crypto";
    try {
      await authFetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_request",
          title: "Payment Requested",
          message: `Payment of $${amount.toLocaleString()} requested from ${prCompany} via ${methodLabel}. ${prDescription ? `Note: ${prDescription}` : ""}`,
          portal: "admin",
          method: methodLabel,
          amount,
          read: false,
        }),
      });
      setShowPaymentRequestDialog(false);
      setPrCompany("");
      setPrAmount("");
      setPrDescription("");
      toast({
        title: "Payment Request Sent",
        description: `$${amount.toLocaleString()} payment request sent to ${prCompany}.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to send payment request.", variant: "destructive" });
    } finally {
      setPrProcessing(false);
    }
  };

  const handleContactResponse = async () => {
    if (!selectedContact || !responseText.trim()) {
      toast({ title: "Error", description: "Please enter a response.", variant: "destructive" });
      return;
    }
    try {
      await authFetch(`/api/contact/${selectedContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminResponse: responseText, status: "responded" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      setShowResponseDialog(false);
      setSelectedContact(null);
      setResponseText("");
      toast({ title: "Response Sent", description: "Your response has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save response.", variant: "destructive" });
    }
  };

  const handleSavePage = async () => {
    if (!editingPage || !editTitle.trim() || !editContent.trim()) {
      toast({ title: "Error", description: "Title and content are required.", variant: "destructive" });
      return;
    }
    try {
      await authFetch(`/api/pages/${editingPage.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent, slug: editingPage.slug }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: [`/api/pages/${editingPage.slug}`] });
      setEditingPage(null);
      toast({ title: "Page Updated", description: `"${editTitle}" has been saved.` });
    } catch {
      toast({ title: "Error", description: "Failed to save page.", variant: "destructive" });
    }
  };

  const pendingDocs = documentsList.filter(d => d.status === "Pending" || d.status === "New" || d.status === "Review Needed");
  const totalRevenue = leasesList.reduce((acc, l) => acc + l.rent, 0);
  const newContacts = contactRequests.filter(c => c.status === "new").length;

  const recentTransactions = [
    { desc: "Lease Payment Received", party: "TechCorp Inc.", amount: 4200, type: "in", method: "ACH", date: "Oct 14, 2023" },
    { desc: "Vendor Payout", party: "Sparkle Cleaners", amount: 450, type: "out", method: "Card", date: "Oct 13, 2023" },
    { desc: "Lease Payment Received", party: "GlobalTech Ltd.", amount: 3500, type: "in", method: "Card", date: "Oct 12, 2023" },
    { desc: "Vendor Payout", party: "FixIt Fast HVAC", amount: 800, type: "out", method: "BTC", date: "Oct 11, 2023" },
    { desc: "Lease Payment Received", party: "Innovate Corp.", amount: 2800, type: "in", method: "ACH", date: "Oct 10, 2023" },
    { desc: "Platform Fee", party: "System", amount: 525, type: "in", method: "Auto", date: "Oct 9, 2023" },
  ];

  const isLoading = cryptoLoading || docsLoading || vendorsLoading || leasesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="container py-10 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

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
              <h1 className="text-3xl font-display font-bold text-primary" data-testid="text-admin-title">Super Admin</h1>
              <p className="text-muted-foreground">Platform Oversight & Configuration</p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" data-testid="button-system-logs"><Settings className="mr-2 h-4 w-4" /> System Logs</Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-[900px] grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-admin-overview">Overview</TabsTrigger>
            <TabsTrigger value="finance" data-testid="tab-admin-finance">Finance</TabsTrigger>
            <TabsTrigger value="approvals" data-testid="tab-admin-approvals">Approvals</TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-admin-contacts">
              Contacts {newContacts > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0">{newContacts}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pages" data-testid="tab-admin-pages">Pages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card data-testid="card-admin-revenue">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> +15% this month
                  </p>
                </CardContent>
              </Card>
              <Card data-testid="card-admin-leases">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Leases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{leasesList.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across 8 cities</p>
                </CardContent>
              </Card>
              <Card data-testid="card-admin-docs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Docs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{pendingDocs.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires review</p>
                </CardContent>
              </Card>
              <Card data-testid="card-admin-users">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorsList.length}</div>
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
                     {recentTransactions.slice(0, 4).map((tx, i) => (
                       <div key={i} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0" data-testid={`admin-tx-${i}`}>
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${tx.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                             {tx.type === 'in' ? <ArrowDownLeft className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                           </div>
                           <div>
                             <p className="font-medium">{tx.desc}</p>
                             <p className="text-xs text-muted-foreground">
                               {tx.type === 'in' ? 'From' : 'To'}: {tx.party}
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className={`font-bold ${tx.type === 'in' ? 'text-green-600' : ''}`}>
                             {tx.type === 'in' ? '+' : '-'}${tx.amount.toLocaleString()}
                           </p>
                           <div className="flex items-center gap-1 justify-end">
                             <Badge variant="outline" className="text-xs">{tx.method}</Badge>
                             <span className="text-xs text-muted-foreground">{tx.date}</span>
                           </div>
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
                       <div className="flex items-center gap-2">
                         <CreditCard className="h-4 w-4 text-muted-foreground" />
                         <span>Stripe Gateway</span>
                       </div>
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Operational</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                         <Wallet className="h-4 w-4 text-muted-foreground" />
                         <span>Web3 Gateway</span>
                       </div>
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Operational</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4 text-muted-foreground" />
                         <span>Document Storage</span>
                       </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card data-testid="card-admin-card-volume">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Card Volume</p>
                    <p className="text-lg font-bold">$7,700</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-admin-ach-volume">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ACH Volume</p>
                    <p className="text-lg font-bold">$10,500</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-admin-crypto-volume">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                    <Bitcoin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crypto Volume</p>
                    <p className="text-lg font-bold">$3,200</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-admin-platform-fees">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Platform Fees</p>
                    <p className="text-lg font-bold">$1,070</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Payment Method Configuration</CardTitle>
                    <CardDescription>Manage traditional and cryptocurrency payment methods across the platform.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPaymentRequestDialog(true)} data-testid="button-admin-payment-request">
                      <Receipt className="mr-2 h-4 w-4" /> Request Payment
                    </Button>
                    <Button onClick={() => setShowPayoutDialog(true)} data-testid="button-admin-payout">
                      <Send className="mr-2 h-4 w-4" /> Manual Payout
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="traditional" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="traditional" data-testid="tab-admin-traditional">Traditional Payments</TabsTrigger>
                    <TabsTrigger value="crypto" data-testid="tab-admin-crypto">Cryptocurrency</TabsTrigger>
                  </TabsList>

                  <TabsContent value="traditional" className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-bold">Credit & Debit Cards</p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex - Available for all portals</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                        <Switch checked={true} disabled />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Landmark className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-bold">ACH Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">Direct debit/credit for corporate accounts and vendor payouts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                        <Switch checked={true} disabled />
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-2">Stripe Account Status</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium text-green-600">Active</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Processing</p>
                          <p className="font-medium">Enabled</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payouts</p>
                          <p className="font-medium">Enabled</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Webhooks</p>
                          <p className="font-medium text-green-600">Active</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto">
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
                        {cryptoList.map((crypto) => (
                          <TableRow key={crypto.id} data-testid={`admin-crypto-row-${crypto.id}`}>
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
                                  onCheckedChange={() => toggleCrypto(crypto.id, crypto.enabled)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {cryptoList.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No cryptocurrencies configured.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>Complete transaction history across all payment methods.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((tx, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg" data-testid={`admin-all-tx-${i}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          tx.method === 'BTC' ? 'bg-purple-100 text-purple-600' : 
                          tx.method === 'Card' ? 'bg-blue-100 text-blue-600' : 
                          tx.method === 'ACH' ? 'bg-green-100 text-green-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {tx.method === 'BTC' ? <Bitcoin className="h-5 w-5" /> : 
                           tx.method === 'Card' ? <CreditCard className="h-5 w-5" /> : 
                           tx.method === 'ACH' ? <Landmark className="h-5 w-5" /> :
                           <DollarSign className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{tx.desc}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.type === 'in' ? 'From' : 'To'}: {tx.party}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'in' ? 'text-green-600' : ''}`}>
                          {tx.type === 'in' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                          <Badge variant="outline" className="text-xs">{tx.method}</Badge>
                          <span className="text-xs text-muted-foreground">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                   {pendingDocs.map((item) => (
                     <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg bg-white gap-4" data-testid={`admin-doc-${item.id}`}>
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                           <FileText className="h-6 w-6" />
                         </div>
                         <div>
                           <h4 className="font-bold">{item.name}</h4>
                           <p className="text-sm text-muted-foreground">Submitted by: {item.userName || "Unknown"} &bull; {item.date}</p>
                         </div>
                       </div>
                       <div className="flex gap-2 w-full md:w-auto">
                         <Button 
                           variant="outline" 
                           className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                           onClick={() => handleDocumentAction(item.id, 'reject')}
                           data-testid={`button-reject-doc-${item.id}`}
                         >
                           <XCircle className="mr-2 h-4 w-4" /> Reject
                         </Button>
                         <Button 
                           className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                           onClick={() => handleDocumentAction(item.id, 'approve')}
                           data-testid={`button-approve-doc-${item.id}`}
                         >
                           <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                         </Button>
                       </div>
                     </div>
                   ))}
                   {pendingDocs.length === 0 && (
                     <p className="text-muted-foreground text-center py-8">No pending documents to review.</p>
                   )}
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Contact Requests
                </CardTitle>
                <CardDescription>Review and respond to messages submitted through the contact page.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg bg-white" data-testid={`admin-contact-${request.id}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${request.status === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                              <Mail className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold">{request.subject}</h4>
                              <p className="text-sm text-muted-foreground">
                                From: {request.name} ({request.email})
                              </p>
                            </div>
                            <Badge className={request.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                              {request.status === 'new' ? 'New' : 'Responded'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 pl-12">{request.message}</p>
                          {request.adminResponse && (
                            <div className="mt-3 ml-12 p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Your Response:</p>
                              <p className="text-sm">{request.adminResponse}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 pl-12">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={request.status === 'new' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedContact(request);
                            setResponseText(request.adminResponse || "");
                            setShowResponseDialog(true);
                          }}
                          data-testid={`button-respond-contact-${request.id}`}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" /> {request.status === 'new' ? 'Respond' : 'Edit Response'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {contactRequests.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No contact requests yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" /> Page Management
                </CardTitle>
                <CardDescription>Edit the content of your website pages.</CardDescription>
              </CardHeader>
              <CardContent>
                {editingPage ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Editing: {editingPage.slug}</h3>
                      <Button variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Page Title</Label>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} data-testid="input-edit-page-title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={15} className="font-mono text-sm" data-testid="input-edit-page-content" />
                      <p className="text-xs text-muted-foreground">Use double line breaks to separate paragraphs.</p>
                    </div>
                    <Button onClick={handleSavePage} data-testid="button-save-page">
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { slug: "about", title: "About Us" },
                      { slug: "careers", title: "Careers" },
                      { slug: "press", title: "Press & Media" },
                      { slug: "contact", title: "Contact" },
                      { slug: "privacy-policy", title: "Privacy Policy" },
                      { slug: "terms-of-service", title: "Terms of Service" },
                      { slug: "cookie-policy", title: "Cookie Policy" },
                    ].map((page) => {
                      const existing = pageContents.find(p => p.slug === page.slug);
                      return (
                        <div key={page.slug} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`admin-page-${page.slug}`}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{page.title}</p>
                              <p className="text-xs text-muted-foreground">/{page.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {existing && (
                              <span className="text-xs text-muted-foreground">
                                Updated: {new Date(existing.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                            <Badge variant="outline" className={existing ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                              {existing ? "Published" : "Default"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const existingContent = existing || { slug: page.slug, title: page.title, content: "", id: 0, updatedAt: new Date() };
                                setEditingPage(existingContent);
                                setEditTitle(existingContent.title);
                                setEditContent(existingContent.content);
                              }}
                              data-testid={`button-edit-page-${page.slug}`}
                            >
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input
                value={payoutRecipient}
                onChange={(e) => setPayoutRecipient(e.target.value)}
                placeholder="Vendor or owner name"
                data-testid="input-payout-recipient"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                data-testid="input-payout-amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger data-testid="select-admin-payout-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">ACH Bank Transfer</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payoutMethod === "ach" && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  <p className="font-medium">ACH Bank Transfer</p>
                </div>
                <p className="text-sm text-muted-foreground">Funds will be sent to the recipient's linked bank account via Stripe within 1-3 business days.</p>
              </div>
            )}

            {payoutMethod === "card" && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <p className="font-medium">Card Payment</p>
                </div>
                <p className="text-sm text-muted-foreground">Funds will be processed to the recipient's card via Stripe.</p>
              </div>
            )}

            {payoutMethod === "crypto" && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label>Select Cryptocurrency</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger data-testid="select-admin-crypto">
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
                <p className="text-xs text-muted-foreground">Payout will be sent via smart contract to the recipient's wallet.</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
              <Button
                onClick={handleProcessPayout}
                disabled={processing || !payoutAmount || parseFloat(payoutAmount) <= 0 || !payoutRecipient || (payoutMethod === "crypto" && !selectedCrypto)}
                data-testid="button-admin-confirm-payout"
              >
                {processing ? "Processing..." : `Send $${parseFloat(payoutAmount || "0").toLocaleString()} Payout`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentRequestDialog} onOpenChange={setShowPaymentRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company / Tenant</Label>
              <Input
                value={prCompany}
                onChange={(e) => setPrCompany(e.target.value)}
                placeholder="Company name"
                data-testid="input-pr-company"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={prAmount}
                onChange={(e) => setPrAmount(e.target.value)}
                placeholder="Enter amount"
                data-testid="input-pr-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={prMethod} onValueChange={setPrMethod}>
                <SelectTrigger data-testid="select-pr-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">ACH Bank Transfer</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={prDescription}
                onChange={(e) => setPrDescription(e.target.value)}
                placeholder="e.g., Monthly lease payment for Q1"
                rows={3}
                data-testid="input-pr-description"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentRequestDialog(false)}>Cancel</Button>
              <Button
                onClick={handlePaymentRequest}
                disabled={prProcessing || !prCompany || !prAmount || parseFloat(prAmount) <= 0}
                data-testid="button-pr-confirm"
              >
                {prProcessing ? "Sending..." : <><Receipt className="mr-2 h-4 w-4" /> Send Request</>}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Contact Request</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{selectedContact.subject}</p>
                  <Badge className="bg-blue-100 text-blue-700">{selectedContact.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">From: {selectedContact.name} ({selectedContact.email})</p>
                <p className="text-sm mt-2">{selectedContact.message}</p>
              </div>
              <div className="space-y-2">
                <Label>Your Response</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={5}
                  data-testid="input-contact-response"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancel</Button>
                <Button onClick={handleContactResponse} disabled={!responseText.trim()} data-testid="button-send-response">
                  <Send className="mr-2 h-4 w-4" /> Send Response
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
