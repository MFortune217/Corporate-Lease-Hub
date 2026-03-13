import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { properties } from "@/lib/mockData";
import { Search, MapPin, Building2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function SearchProperties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  const filtered = properties.filter((p) => {
    const matchesSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = propertyType === "all" || p.type.toLowerCase() === propertyType.toLowerCase();
    const matchesPrice = priceRange === "all" ||
      (priceRange === "under-3000" && p.price < 3000) ||
      (priceRange === "3000-4000" && p.price >= 3000 && p.price <= 4000) ||
      (priceRange === "over-4000" && p.price > 4000);
    return matchesSearch && matchesType && matchesPrice;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 bg-slate-50">
        <div className="bg-primary text-white py-16">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="text-search-title">Search Properties</h1>
            <p className="text-lg text-white/80 max-w-2xl">Find the perfect corporate housing for your team.</p>
          </div>
        </div>

        <div className="container py-8">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Location or Property Name</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Where do you want to live?"
                      className="pl-10"
                      data-testid="input-search-location"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger data-testid="select-search-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="single family home">Single Family Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger data-testid="select-search-price">
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="under-3000">Under $3,000</SelectItem>
                      <SelectItem value="3000-4000">$3,000 - $4,000</SelectItem>
                      <SelectItem value="over-4000">Over $4,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="h-10" data-testid="button-search-submit">
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> properties found
            </p>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property) => (
              <Card key={property.id} className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1" data-testid={`card-search-property-${property.id}`}>
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
                    {property.type}
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-primary group-hover:text-blue-600 transition-colors">{property.title}</h3>
                    <span className="text-lg font-bold text-primary">${property.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {property.address}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {property.beds} Beds</span>
                    <span>{property.baths} Baths</span>
                    <span>{property.sqft} sqft</span>
                  </div>
                  <Link href="/customers">
                    <Button className="w-full mt-4" size="sm" data-testid={`button-lease-${property.id}`}>Start Leasing</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground mb-2">No properties match your criteria.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setPropertyType("all"); setPriceRange("all"); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
