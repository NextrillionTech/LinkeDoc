import { useEffect } from 'react';

/**
 * Reusable hook to dynamically update document title and description meta tag.
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
  }, [title, description]);
};

export default useSEO;
