import { useEffect } from 'react';

/**
 * Reusable hook to dynamically update document title, description, and canonical link.
 * Automatically appends suffix ' | LinkeDoc' to the title.
 */
export const useSEO = (title: string, description?: string) => {
  useEffect(() => {
    document.title = `${title} | LinkeDoc`;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        metaDesc.setAttribute('content', description);
        document.head.appendChild(metaDesc);
      }
    }

    // Dynamic self-referencing canonical tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, [title, description]);
};

export default useSEO;
