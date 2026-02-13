import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { properties } from "@/lib/mockData";
import { Search, MapPin, Building, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-apartment.png" 
            alt="Modern Corporate Apartment" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container relative z-10 text-center text-white space-y-6 animate-in fade-in zoom-in duration-700">
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
            Find Your Perfect <br />
            <span className="text-blue-200">Corporate Home</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Seamless leasing for professionals, teams, and companies. 
            From luxury lofts to suburban family homes.
          </p>
          
          <div className="mt-8 max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Where do you want to live?" 
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50"
                />
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                <Search className="mr-2 h-4 w-4" /> Search Properties
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-primary mb-2">Featured Listings</h2>
              <p className="text-muted-foreground">Curated spaces for your next assignment</p>
            </div>
            <Link href="/customers">
              <Button variant="ghost" className="hidden md:flex text-primary">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary">
                    {property.type}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-primary group-hover:text-blue-600 transition-colors">{property.title}</h3>
                    <span className="text-lg font-bold text-primary">${property.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                  </div>
                  <p className="text-muted-foreground mb-4 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {property.address}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                    <span>{property.beds} Beds</span>
                    <span>{property.baths} Baths</span>
                    <span>{property.sqft} sqft</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Overview */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center mb-16">One Platform, Endless Possibilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Owner Card */}
            <div className="relative p-8 rounded-2xl bg-muted/30 border border-border hover:border-primary/20 transition-all group">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Property Owners</h3>
              <p className="text-muted-foreground mb-6">
                Automated listing management. We scrape your website to keep your portfolio up to date effortlessly.
              </p>
              <Link href="/owners">
                <Button variant="link" className="p-0 text-blue-600 font-semibold cursor-pointer">
                  Manage Portfolio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Vendor Card */}
            <div className="relative p-8 rounded-2xl bg-muted/30 border border-border hover:border-primary/20 transition-all group">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Service Vendors</h3>
              <p className="text-muted-foreground mb-6">
                Connect with property managers. Upload credentials, receive job requests, and get paid fast.
              </p>
              <Link href="/vendors">
                <Button variant="link" className="p-0 text-amber-600 font-semibold cursor-pointer">
                  Join Network <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Corporate Card */}
            <div className="relative p-8 rounded-2xl bg-muted/30 border border-border hover:border-primary/20 transition-all group">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Corporate Partners</h3>
              <p className="text-muted-foreground mb-6">
                Streamline employee relocation. Search, sign leases, and manage payments all in one dashboard.
              </p>
              <Link href="/customers">
                <Button variant="link" className="p-0 text-indigo-600 font-semibold cursor-pointer">
                  Start Leasing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
