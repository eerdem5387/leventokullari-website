import { prisma } from '@/lib/prisma'
import Header from './Header'

// Bu component'i dinamik yap
export const dynamic = 'force-dynamic'

async function getHeaderSettings() {
  try {
    const siteNameSetting = await prisma.settings.findFirst({
      where: { key: 'general.siteName' }
    })
    
    return {
      siteName: siteNameSetting?.value || 'E-Mağaza'
    }
  } catch (error) {
    console.error('Error fetching header settings:', error)
    return {
      siteName: 'E-Mağaza'
    }
  }
}

export default async function HeaderWrapper() {
  const settings = await getHeaderSettings()
  
  return <Header siteName={settings.siteName} />
} 