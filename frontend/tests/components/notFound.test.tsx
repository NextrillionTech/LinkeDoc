import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '../../src/pages/NotFound';

describe('NotFound Component Tests', () => {
  beforeEach(() => {
    // Clear head elements to avoid test pollution
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.remove();
    }
  });

  it('renders the Not Found layout and text', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Assert visual layout
    expect(screen.getByText('Resource Not Found')).toBeInTheDocument();
    expect(screen.getByText(/The page or medical file you are trying to access doesn't exist/i)).toBeInTheDocument();
    expect(screen.getByText('Go to Home Feed')).toBeInTheDocument();
  });

  it('updates the page title and meta description dynamically', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Verify useSEO output
    expect(document.title).toBe('Page Not Found | LinkeDoc');
    
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc).toBeInTheDocument();
    expect(metaDesc?.getAttribute('content')).toBe('The requested medical resource or directory page could not be located.');
  });
});
