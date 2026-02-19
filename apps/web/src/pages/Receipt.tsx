import { useParams, Link } from 'react-router-dom';

export default function Receipt() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>レシート詳細</h1>
      <p>レシートID: {id}</p>
      <Link to="/">戻る</Link>
    </div>
  );
}
