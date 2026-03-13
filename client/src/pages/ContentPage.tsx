import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import type { PageContent } from "@shared/schema";
import { usePageUpdates } from "@/lib/usePageUpdates";

interface ContentPageProps {
  slug: string;
  fallbackTitle: string;
  fallbackContent: string;
  icon?: React.ReactNode;
}

export default function ContentPage({ slug, fallbackTitle, fallbackContent, icon }: ContentPageProps) {
  usePageUpdates(slug);

  const { data: page, isLoading } = useQuery<PageContent>({
    queryKey: [`/api/pages/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const title = page?.title || fallbackTitle;
  const content = page?.content || fallbackContent;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 bg-slate-50">
        <div className="bg-primary text-white py-16">
          <div className="container">
            <div className="flex items-center gap-4 mb-4">
              {icon}
              <h1 className="text-4xl md:text-5xl font-display font-bold" data-testid={`text-${slug}-title`}>
                {title}
              </h1>
            </div>
          </div>
        </div>
        <div className="container py-12 md:py-16">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-lg">Loading...</p>
            </div>
          ) : (
            <div className="max-w-3xl">
              {content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-lg text-muted-foreground leading-relaxed mb-6" data-testid={`text-${slug}-paragraph-${i}`}>
                  {paragraph}
                </p>
              ))}
              {page?.updatedAt && (
                <p className="text-sm text-muted-foreground/60 mt-12 pt-6 border-t">
                  Last updated: {new Date(page.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
