import React from 'react';
import { Helmet } from 'react-helmet-async';
import { usePathname } from "next/navigation";
import { useSEO } from '../context/SEOContext';

const DEFAULT_TITLE = "CalVant | ISO Compliance & Risk Management Platform";
const DEFAULT_DESC = "Empower your organization with CalVant's industry-leading ISO 27001 & 27701 compliance platform. Automate risk management and audit readiness.";
const DEFAULT_KEYWORDS = "ISO 27001, ISO 27701, Compliance, Risk Management, Cybersecurity";

const DynamicSEO = () => {
    const { pathname } = usePathname();
    const { getSEOForPath, loading } = useSEO();

    // Map the current path to SEO data
    const activeSEO = React.useMemo(() => {
        if (loading) return null;
        return getSEOForPath(pathname);
    }, [pathname, getSEOForPath, loading]);

    // Fallback logic if no match is found
    const title = activeSEO?.title || DEFAULT_TITLE;
    const description = activeSEO?.description || DEFAULT_DESC;
    const keywords = activeSEO?.keywords || DEFAULT_KEYWORDS;
    const ogImage = activeSEO?.ogImage || '/favicon_large.png'; // Fallback to logo
    const canonical = activeSEO?.canonical || `${window.location.origin}${pathname}`;
    const robots = activeSEO?.robots || 'index, follow';

    return (
        <Helmet>
            {/* Title */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Robots & Canonical */}
            <meta name="robots" content={robots} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={window.location.href} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={window.location.href} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={ogImage} />
        </Helmet>
    );
};

export default DynamicSEO;

