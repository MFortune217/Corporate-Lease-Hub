import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCheck, Bell, Briefcase, CreditCard, Landmark, Bitcoin, DollarSign, CheckCircle2, ArrowDownLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import type { JobRequest, Document as DocumentType, CryptoCurrency } from "@shared/schema";

export default function Vendors() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState("ach");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("1250");
  const [processing, setProcessing] = useState(false);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobRequest[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: cryptoList = [], isLoading: cryptoLoading } = useQuery<CryptoCurrency[]>({
    queryKey: ["/api/crypto"],
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/jobs/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (doc: Partial<DocumentType>) => {
      await apiRequest("POST", "/api/documents", doc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Uploaded",
        description: "Property managers have been notified of your submission.",
      });
    },
  });

  const handleUpload = () => {
    createDocumentMutation.mutate({
      name: "Liability Insurance Renewal",
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
      type: "insurance",
      userName: "Sparkle Cleaners Inc.",
    });
  };

  const handleJobAction = (jobId: number, action: "accepted" | "declined") => {
    updateJobMutation.mutate({ id: jobId, status: action });
    toast({
      title: action === "accepted" ? "Job Accepted" : "Job Declined",
      description: action === "accepted" ? "You've been assigned to this job." : "The job has been declined.",
    });
  };

  const openWithdrawDialog = (method: string) => {
    setWithdrawMethod(method);
    setShowWithdrawDialog(true);
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setProcessing(true);
    const methodLabel = withdrawMethod === "card" ? "Card" : withdrawMethod === "ach" ? "ACH" : selectedCrypto;
    try {
      if (withdrawMethod === "crypto") {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payout_requested",
            title: "Crypto Payout Requested",
            message: `$${amount.toLocaleString()} payout via ${selectedCrypto} requested by Sparkle Cleaners Inc.`,
            portal: "vendor",
            method: selectedCrypto,
            amount,
            read: false,
          }),
        });
      } else {
        await fetch("/api/stripe/create-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            description: `Vendor payout to Sparkle Cleaners Inc. via ${methodLabel}`,
            portal: "vendor",
            method: methodLabel,
          }),
        });
      }
      setShowWithdrawDialog(false);
      toast({
        title: "Payout Requested",
        description: `$${amount.toLocaleString()} payout via ${methodLabel} has been submitted for processing.`,
      });
    } catch {
      toast({ title: "Payout Submitted", description: `Your $${amount.toLocaleString()} payout request has been queued.` });
      setShowWithdrawDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const activeJobs = jobs.filter(j => j.status === "pending" || j.status === "accepted");
  const pendingJobs = jobs.filter(j => j.status === "pending");
  const completedJobs = jobs.filter(j => j.status === "completed" || j.status === "accepted");

  if (jobsLoading || cryptoLoading) {
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
          <div className="flex items-center gap-4">
             <div className="relative">
                <img src="/images/vendor-maintenance.png" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" alt="Profile" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <div>
                <h1 className="text-3xl font-display font-bold text-primary" data-testid="text-vendor-title">Vendor Portal</h1>
                <p className="text-muted-foreground">{user?.companyName || "Your Company"}</p>
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" data-testid="button-notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</Button>
             <Button data-testid="button-available-jobs">Available Jobs</Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Compliance</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">Job Board</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-pending-payments">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-pending-amount">$1,250.00</div>
                  <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                </CardContent>
              </Card>
              <Card data-testid="card-active-jobs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeJobs.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">{pendingJobs.length} pending</p>
                </CardContent>
              </Card>
              <Card data-testid="card-compliance">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">Verified</div>
                  <p className="text-xs text-muted-foreground mt-1">All docs up to date</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`card-job-${job.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded text-primary">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">Requested by: {job.requestedBy} • Due: {job.dueDate || "TBD"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={() => handleJobAction(job.id, "declined")} data-testid={`button-decline-${job.id}`}>Decline</Button>
                         <Button size="sm" onClick={() => handleJobAction(job.id, "accepted")} data-testid={`button-accept-${job.id}`}>Accept</Button>
                      </div>
                    </div>
                  ))}
                  {pendingJobs.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No pending job requests.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-available-balance">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold">$1,250.00</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-total-earned">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <ArrowDownLeft className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned (YTD)</p>
                    <p className="text-2xl font-bold">$18,450.00</p>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-jobs-completed">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jobs Completed</p>
                    <p className="text-2xl font-bold">{completedJobs.length + 24}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
                <CardDescription>Choose how you'd like to receive your earnings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-bold text-lg">Available for Payout</p>
                    <p className="text-sm text-muted-foreground">From completed jobs</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700" data-testid="text-withdraw-available">$1,250.00</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 cursor-pointer hover:border-primary transition-colors" onClick={() => openWithdrawDialog("card")} data-testid="card-withdraw-card">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <CreditCard className="h-8 w-8 text-primary" />
                      <p className="font-bold">Debit Card</p>
                      <p className="text-xs text-muted-foreground">Instant transfer</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 cursor-pointer hover:border-primary transition-colors" onClick={() => openWithdrawDialog("ach")} data-testid="card-withdraw-ach">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <Landmark className="h-8 w-8 text-blue-600" />
                      <p className="font-bold">Bank Transfer (ACH)</p>
                      <p className="text-xs text-muted-foreground">1-3 business days</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 cursor-pointer hover:border-primary transition-colors" onClick={() => openWithdrawDialog("crypto")} data-testid="card-withdraw-crypto">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <Bitcoin className="h-8 w-8 text-purple-600" />
                      <p className="font-bold">Crypto Wallet</p>
                      <p className="text-xs text-muted-foreground">Send to Web3 wallet</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Preferences</CardTitle>
                <CardDescription>Configure your default payout method and settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="traditional" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="traditional" data-testid="tab-vendor-traditional">Traditional</TabsTrigger>
                    <TabsTrigger value="crypto" data-testid="tab-vendor-crypto">Cryptocurrency</TabsTrigger>
                  </TabsList>

                  <TabsContent value="traditional" className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-bold">Debit Card Payouts</p>
                          <p className="text-sm text-muted-foreground">Receive funds instantly via Stripe</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Landmark className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-bold">ACH Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">Direct deposit to your bank account</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                      Powered by Stripe. Payouts are processed automatically when property owners release payment for completed jobs.
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto" className="space-y-4">
                    {cryptoList.filter(c => c.enabled).map((crypto) => (
                      <div key={crypto.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`vendor-crypto-${crypto.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="bg-muted p-2 rounded-full">
                            <Bitcoin className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">{crypto.name} ({crypto.symbol})</p>
                            <p className="text-sm text-muted-foreground">Receive payouts in {crypto.symbol}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Enabled</Badge>
                      </div>
                    ))}
                    {cryptoList.filter(c => c.enabled).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No cryptocurrencies enabled by platform admin.</p>
                    )}
                    <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                      Crypto payouts are sent directly to your connected Web3 wallet address via smart contract.
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent payments received for completed work.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { desc: "Unit 404 - Deep Clean", from: "Skyline Properties", amount: 450, method: "ACH", date: "Oct 15, 2023" },
                    { desc: "Unit 201 - HVAC Inspection", from: "Metro Management", amount: 350, method: "Card", date: "Oct 12, 2023" },
                    { desc: "Unit 305 - Move-out Clean", from: "Skyline Properties", amount: 500, method: "BTC", date: "Oct 8, 2023" },
                    { desc: "Unit 102 - Emergency Repair", from: "Downtown Realty", amount: 275, method: "ACH", date: "Oct 3, 2023" },
                  ].map((tx, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg" data-testid={`tx-history-${i}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${tx.method === 'BTC' ? 'bg-purple-100 text-purple-600' : tx.method === 'Card' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {tx.method === 'BTC' ? <Bitcoin className="h-5 w-5" /> : tx.method === 'Card' ? <CreditCard className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{tx.desc}</p>
                          <p className="text-sm text-muted-foreground">From: {tx.from}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${tx.amount.toLocaleString()}</p>
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

          <TabsContent value="documents" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>Upload necessary certifications to remain an approved vendor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold">Business License</h3>
                      <p className="text-sm text-muted-foreground">Expires: Dec 31, 2026</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:underline">
                    <FileCheck className="h-4 w-4" /> View Document
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-amber-50/50 border-amber-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold">Liability Insurance</h3>
                      <p className="text-sm text-muted-foreground">Renewal Required</p>
                    </div>
                    <Badge variant="outline" className="border-amber-400 text-amber-600">Action Needed</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button size="sm" onClick={handleUpload} disabled={createDocumentMutation.isPending} data-testid="button-upload-renewal">
                      <Upload className="mr-2 h-4 w-4" /> Upload Renewal
                    </Button>
                  </div>
                </div>
                
                <div className="mt-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notifications" defaultChecked />
                    <Label htmlFor="notifications">Receive email notifications when documents are expiring</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Board</CardTitle>
                <CardDescription>Browse and manage your job assignments.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`card-job-board-${job.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded text-primary">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Requested by: {job.requestedBy} • Due: {job.dueDate || "TBD"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={job.status === 'pending' ? 'secondary' : job.status === 'accepted' ? 'default' : 'outline'}>
                          {job.status}
                        </Badge>
                        {job.status === "pending" && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleJobAction(job.id, "declined")}>Decline</Button>
                            <Button size="sm" onClick={() => handleJobAction(job.id, "accepted")}>Accept</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No jobs available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Payout Amount</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                data-testid="input-withdraw-amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Payout Method</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger data-testid="select-withdraw-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">Bank Account (ACH)</SelectItem>
                  <SelectItem value="card">Debit Card</SelectItem>
                  <SelectItem value="crypto">Crypto Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawMethod === "ach" && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  <p className="font-medium">ACH Bank Transfer</p>
                </div>
                <p className="text-sm text-muted-foreground">Funds will be deposited to your linked bank account within 1-3 business days via Stripe.</p>
              </div>
            )}

            {withdrawMethod === "card" && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <p className="font-medium">Instant Card Payout</p>
                </div>
                <p className="text-sm text-muted-foreground">Funds will be sent instantly to your linked debit card via Stripe Instant Payouts.</p>
              </div>
            )}

            {withdrawMethod === "crypto" && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label>Select Cryptocurrency</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger data-testid="select-vendor-crypto">
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
                <p className="text-xs text-muted-foreground">Payout sent to your connected wallet address via smart contract.</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>Cancel</Button>
              <Button
                onClick={handleRequestPayout}
                disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || (withdrawMethod === "crypto" && !selectedCrypto)}
                data-testid="button-confirm-payout"
              >
                {processing ? "Processing..." : `Request $${parseFloat(withdrawAmount || "0").toLocaleString()} Payout`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
