import { redirect } from 'next/navigation'
import ClientRef from '@/app/ClientRef'

export default function Index() {
  // Ensure client reference manifest exists at root
  // No visual or behavioral impact
  ClientRef()
  redirect('/home')
}


