// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Proje açılır açılmaz senin yaptığın sayfaya gider.
  // Daha sonra arkadaşın login sayfasını bitirince burayı düzelteceğiz.
  redirect('/vote');
}