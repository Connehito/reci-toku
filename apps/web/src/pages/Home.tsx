import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <h1>レシトク - レシートリワード</h1>
      <p>レシートを撮影してコインを獲得しよう</p>
      <nav>
        <ul>
          <li>
            <Link to="/history">コイン履歴</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
