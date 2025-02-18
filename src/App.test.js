import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Task Manager header', () => {
  render(
    <App />
  );

  const headingElement = screen.getByText(/Task Manager/i);
  expect(headingElement).toBeInTheDocument();
});
