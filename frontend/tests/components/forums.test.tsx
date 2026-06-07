import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const ForumsMockComponent = () => {
  return (
    <div>
      <h1>Specialty Discussion Forums</h1>
      <div className="category-list">
        <div className="category-card">
          <h3>Cardiology</h3>
          <p>Heart health and vascular disease discussions.</p>
        </div>
      </div>
      <button>Create Discussion Thread</button>
    </div>
  );
};

describe('Forums View Mock Component tests', () => {
  it('should render forums layout and categories', () => {
    render(<ForumsMockComponent />);
    expect(screen.getByText('Specialty Discussion Forums')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Create Discussion Thread')).toBeInTheDocument();
  });
});
