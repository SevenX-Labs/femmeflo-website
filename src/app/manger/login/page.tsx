import { redirect } from 'next/navigation';

export default function MangerLoginRedirect() {
  redirect('/manger/auth/login');
}
