
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "./Navigation";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}

export const PageLayout = ({ children, title, description, keywords }: PageLayoutProps) => {
  const location = useLocation();
  // TODO: Replace with your actual domain
  const siteUrl = "https://your-website.com";

  const defaultTitle = 'Toolbox: All-in-One Free Online Tools';
  const defaultDescription = 'A comprehensive collection of free online tools for file conversion, image editing, text manipulation, and more. Fast, secure, and easy to use.';
  const defaultKeywords = 'online tools, free tools, file converter, image editor, text tools, pdf tools, toolbox, utility tools';

  const pageTitle = title ? `${title} | Toolbox` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords;
  const canonicalUrl = `${siteUrl}${location.pathname}`;
  const imageUrl = `${siteUrl}/social-card.png`; // A general social media card image

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={imageUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || description) && (
          <div className="text-center mb-12">
            {title && (
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};