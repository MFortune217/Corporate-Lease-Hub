import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileCheck, Bell, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Vendors() {
  const { toast } = useToast();

  const handleUpload = () => {
    toast({
      title: "Document Uploaded",
      description: "Property managers have been notified of your submission.",
    });
  };

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
                <h1 className="text-3xl font-display font-bold text-primary">Vendor Portal</h1>
                <p className="text-muted-foreground">Sparkle Cleaners Inc.</p>
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline"><Bell className="mr-2 h-4 w-4" /> Notifications</Button>
             <Button>Available Jobs</Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-[500px] grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Compliance</TabsTrigger>
            <TabsTrigger value="jobs">Job Board</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$1,250.00</div>
                  <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground mt-1">2 due today</p>
                </CardContent>
              </Card>
              <Card>
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
                  {[1, 2, 3].map((job) => (
                    <div key={job} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded text-primary">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold">Unit 404 - Deep Clean</h4>
                          <p className="text-sm text-muted-foreground">Requested by: Skyline Properties • Due: Tomorrow</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm">Decline</Button>
                         <Button size="sm">Accept</Button>
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
                    <Button size="sm" onClick={handleUpload}>
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
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
