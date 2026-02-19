import { Link } from 'react-router-dom';

export default function History() {
  return (
    <div>
      <h1>コイン履歴</h1>
      <p>獲得・使用したコインの履歴を表示</p>
      <Link to="/">戻る</Link>
    </div>
  );
}
