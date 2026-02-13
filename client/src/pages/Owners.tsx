import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { vendors, properties, cryptoCurrencies } from "@/lib/mockData";
import { UploadCloud, Globe, CheckCircle, XCircle, Bitcoin, Settings } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Owners() {
  const { toast } = useToast();
  const [scraping, setScraping] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [cryptos, setCryptos] = useState(cryptoCurrencies);

  const handleScrape = () => {
    if (!websiteUrl) return;
    setScraping(true);
    // Mock scraping delay
    setTimeout(() => {
      setScraping(false);
      toast({
        title: "Website Scraped Successfully",
        description: "3 new properties have been added to your draft listings.",
      });
    }, 2000);
  };

  const toggleCrypto = (id: string) => {
    setCryptos(cryptos.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
    toast({
      title: "Settings Updated",
      description: "Payment preferences saved.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Navbar />
      
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">Owner Dashboard</h1>
            <p className="text-muted-foreground">Manage properties, listings, and vendor payments.</p>
          </div>
          <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Account Settings</Button>
        </div>

        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="payments">Payments & Crypto</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="space-y-6 mt-6">
            {/* Auto-Scraper Tool */}
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
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleScrape}
                    disabled={scraping}
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
              {properties.map((property) => (
                <Card key={property.id}>
                  <div className="h-40 overflow-hidden relative">
                    <img src={property.image} className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2">Leased</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <CardDescription>{property.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">${property.price}/mo</span>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Placeholder */}
              <Card className="border-dashed flex items-center justify-center h-[300px] cursor-pointer hover:bg-muted/50 transition-colors">
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
               <Button>Invite Vendor</Button>
             </div>
             
             <div className="grid gap-4">
               {vendors.map((vendor) => (
                 <Card key={vendor.id}>
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
                        <Button variant="outline" size="sm">View Docs</Button>
                        <Button size="sm">Pay</Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Crypto Payment Settings</CardTitle>
                <CardDescription>Manage accepted cryptocurrencies for lease and vendor payments.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {cryptos.map((crypto) => (
                    <div key={crypto.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`crypto-${crypto.id}`} className="sr-only">Toggle {crypto.name}</Label>
                        <Switch 
                          id={`crypto-${crypto.id}`}
                          checked={crypto.enabled}
                          onCheckedChange={() => toggleCrypto(crypto.id)}
                        />
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
