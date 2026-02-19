// サンプルコンポーネントテスト
import { render, screen } from '@testing-library/react';

// シンプルなコンポーネント
function SampleComponent() {
  return <div>Hello, Test!</div>;
}

describe('SampleComponent', () => {
  it('should render text', () => {
    render(<SampleComponent />);
    expect(screen.getByText('Hello, Test!')).toBeInTheDocument();
  });
});
