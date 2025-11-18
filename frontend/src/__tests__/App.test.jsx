import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

describe('Vitest Configuration', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });

  it('should support Testing Library', () => {
    const TestComponent = () => <div>Hello Vitest</div>;
    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );
    expect(screen.getByText('Hello Vitest')).toBeInTheDocument();
  });
});
