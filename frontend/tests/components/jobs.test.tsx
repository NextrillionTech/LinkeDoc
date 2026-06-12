import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import JobBoard from '../../src/pages/JobBoard';
import CreateJob from '../../src/pages/CreateJob';
import { ToastProvider } from '../../src/components/ToastContext';

describe('JobBoard page tests', () => {
  it('should render Job Board page and show filters', () => {
    render(
      <ToastProvider>
        <BrowserRouter>
          <JobBoard />
        </BrowserRouter>
      </ToastProvider>
    );
    expect(screen.getByText(/Healthcare Job Board/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Filter by specialty/i)).toBeInTheDocument();
  });
});

describe('CreateJob page tests', () => {
  beforeEach(() => {
    localStorage.setItem('linkedoc_user', JSON.stringify({
      id: 'rec123-rec123-rec123-rec123-rec123rec123',
      name: 'Mercy Hospital recruiters',
      role: 'RECRUITER',
      status: 'APPROVED'
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render Create Job form', () => {
    render(
      <BrowserRouter>
        <CreateJob />
      </BrowserRouter>
    );
    expect(screen.getByText(/Post a Healthcare Job/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Title/i)).toBeInTheDocument();
  });
});
