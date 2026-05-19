import { redirect } from 'next/navigation';

console.log('hello world!');

export default function Home() {
  redirect('/trades');
}
