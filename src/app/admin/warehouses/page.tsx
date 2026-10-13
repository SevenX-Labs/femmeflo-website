import { redirect } from 'next/navigation';

export default function AdminWarehousesRedirect() {
  redirect('/admin/inventory');
}
