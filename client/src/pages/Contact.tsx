import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePageUpdates } from "@/lib/usePageUpdates";
import { useQuery } from "@tanstack/react-query";
import type { PageContent } from "@shared/schema";

const defaultContent = `Have a question or need assistance? We're here to help.

support@corplease.com
sales@corplease.com

(555) 123-4567
Mon-Fri, 9am-6pm EST

100 Corporate Plaza
Suite 400, New York, NY 10001`;

function parseContactContent(content: string) {
  const lines = content.split("\n").filter(l => l.trim() !== "");
  const subtitle = lines[0] || "Have a question or need assistance? We're here to help.";
  const emails: string[] = [];
  const phones: string[] = [];
  const addressLines: string[] = [];
  let section = "subtitle";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("@")) {
      emails.push(line);
      section = "email";
    } else if (/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(line) || line.startsWith("(")) {
      phones.push(line);
      section = "phone";
    } else if (section === "phone" && !line.includes("@") && phones.length > 0) {
      phones.push(line);
    } else {
      addressLines.push(line);
    }
  }

  return {
    subtitle,
    emails: emails.length > 0 ? emails : ["support@corplease.com", "sales@corplease.com"],
    phones: phones.length > 0 ? phones : ["(555) 123-4567", "Mon-Fri, 9am-6pm EST"],
    address: addressLines.length > 0 ? addressLines : ["100 Corporate Plaza", "Suite 400, New York, NY 10001"],
  };
}

export default function Contact() {
  usePageUpdates("contact");

  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: page } = useQuery<PageContent>({
    queryKey: ["/api/pages/contact"],
    queryFn: async () => {
      const res = await fetch("/api/pages/contact");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const contactInfo = parseContactContent(page?.content || defaultContent);
  const pageTitle = page?.title || "Contact Us";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
      toast({ title: "Message Sent", description: "We'll get back to you as soon as possible." });
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 bg-slate-50">
        <div className="bg-primary text-white py-16">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="text-contact-title">{pageTitle}</h1>
            <p className="text-lg text-white/80 max-w-2xl">{contactInfo.subtitle}</p>
          </div>
        </div>

        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {submitted ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="flex justify-center mb-6">
                      <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-3" data-testid="text-contact-success">Thank You!</h2>
                    <p className="text-muted-foreground text-lg mb-6">
                      Your message has been received. Our team will review it and get back to you shortly.
                    </p>
                    <Button onClick={() => { setSubmitted(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }} data-testid="button-contact-another">
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a Message</CardTitle>
                    <CardDescription>Fill out the form below and we'll respond within 1-2 business days.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-name">Full Name</Label>
                          <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" data-testid="input-contact-name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Email Address</Label>
                          <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" data-testid="input-contact-email" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-subject">Subject</Label>
                        <Input id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" data-testid="input-contact-subject" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-message">Message</Label>
                        <Textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us more about your inquiry..." rows={6} data-testid="input-contact-message" />
                      </div>
                      <Button type="submit" disabled={submitting} className="w-full md:w-auto" data-testid="button-contact-submit">
                        {submitting ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      {contactInfo.emails.map((e, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{e}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      {contactInfo.phones.map((p, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{p}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office</h3>
                      {contactInfo.address.map((a, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{a}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
