import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Home } from "lucide-react";
import SEO from "@/components/SEO";

interface PageData {
  title: string;
  content: string;
  meta_description: string | null;
}

const StaticPage = () => {
  const location = useLocation();
  // Get slug from path, removing leading slash
  const slug = location.pathname.slice(1);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(false);
      
      const { data, error: fetchError } = await supabase
        .from("static_pages")
        .select("title, content, meta_description")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (fetchError || !data) {
        setError(true);
      } else {
        setPage(data);
      }
      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8" dir="rtl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center" dir="rtl">
          <h1 className="text-2xl font-bold text-foreground mb-4">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground mb-8">عذراً، لم نتمكن من العثور على هذه الصفحة.</p>
          <Link to="/" className="text-primary hover:underline flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={page.title}
        description={page.meta_description || page.title}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-8" dir="rtl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">{page.title}</span>
        </nav>

        {/* Page Content */}
        <article className="bg-card rounded-lg shadow-sm border border-border p-6 md:p-8">
          <div 
            className="prose prose-lg max-w-none
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-4 [&_h2]:mt-0
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-3 [&_h3]:mt-6
              [&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:mb-4 [&_ul]:text-muted-foreground
              [&_li]:mb-2 [&_li]:leading-relaxed
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_a]:text-primary [&_a]:hover:underline"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default StaticPage;
