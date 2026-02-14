import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { properties } from "@/lib/mockData";
import { Search, MapPin, Building, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const heroVideos = [
  "/videos/hero-background.mp4",
  "/videos/hero-lounge.mp4",
  "/videos/hero-kitchen.mp4",
  "/videos/hero-bedroom.mp4",
  "/videos/hero-interior.mp4"
];

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % heroVideos.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden bg-black">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentVideo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0"
          >
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-80"
            >
              <source src={heroVideos[currentVideo]} type="video/mp4" />
            </video>
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute inset-0 z-0 bg-black/40" />
        
        <div className="container relative z-10 text-center text-white space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-7xl font-display font-bold leading-tight tracking-tight drop-shadow-lg">
              Find Your Perfect <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200 drop-shadow-md">
                Corporate Home
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md"
          >
            Seamless leasing for professionals, teams, and companies. 
            From luxury lofts to suburban family homes.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-48 max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Where do you want to live?" 
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50 h-10 text-sm"
                />
              </div>
              <Button size="default" className="h-10 bg-white text-primary hover:bg-white/90 font-semibold px-6 hover:scale-105 transition-transform duration-200">
                <Search className="mr-2 h-4 w-4" /> Search Properties
              </Button>
            </div>
          </motion.div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
            {heroVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentVideo ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-slate-50">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-display font-bold text-primary mb-3">Featured Listings</h2>
              <p className="text-lg text-muted-foreground">Curated spaces for your next assignment</p>
            </motion.div>
            <Link href="/customers">
              <Button variant="ghost" className="hidden md:flex text-primary hover:bg-blue-50">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="relative h-72 overflow-hidden">
                    <img 
                      src={property.image} 
                      alt={property.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
                      {property.type}
                    </div>
                  </div>
                  <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-primary group-hover:text-blue-600 transition-colors">{property.title}</h3>
                      <span className="text-lg font-bold text-primary">${property.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                    </div>
                    <p className="text-muted-foreground mb-4 flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {property.address}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {property.beds} Beds</span>
                      <span>{property.baths} Baths</span>
                      <span>{property.sqft} sqft</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Overview */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
           <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-50 rounded-full blur-3xl" />
           <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-display font-bold text-center mb-16"
          >
            One Platform, Endless Possibilities
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Property Owners",
                icon: Building,
                desc: "Automated listing management. We scrape your website to keep your portfolio up to date effortlessly.",
                link: "/owners",
                linkText: "Manage Portfolio",
                color: "blue"
              },
              {
                title: "Service Vendors",
                icon: ShieldCheck,
                desc: "Connect with property managers. Upload credentials, receive job requests, and get paid fast.",
                link: "/vendors",
                linkText: "Join Network",
                color: "amber"
              },
              {
                title: "Corporate Partners",
                icon: Building2,
                desc: "Streamline employee relocation. Search, sign leases, and manage payments all in one dashboard.",
                link: "/customers",
                linkText: "Start Leasing",
                color: "indigo"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative p-8 rounded-2xl bg-white border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col">
                  <div className={`h-14 w-14 bg-${item.color}-100 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900">{item.title}</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed flex-grow">
                    {item.desc}
                  </p>
                  <Link href={item.link}>
                    <Button variant="link" className={`p-0 text-${item.color}-600 font-semibold group-hover:translate-x-1 transition-transform`}>
                      {item.linkText} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
