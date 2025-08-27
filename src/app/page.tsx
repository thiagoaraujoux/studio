
import { redirect } from 'next/navigation';

export default function Home() {
  // A lógica de redirecionamento agora é tratada no middleware.
  // No entanto, podemos manter um redirecionamento de fallback aqui.
  redirect('/login');
}
