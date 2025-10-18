import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import DynamicMenu from './DynamicMenu'

// Bu component'i dinamik yap
export const dynamic = 'force-dynamic'

async function getFooterSettings() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            'general.siteName',
            'general.siteDescription',
            'general.contactPhone',
            'general.contactEmail',
            'general.address',
            'social.facebook',
            'social.twitter',
            'social.instagram'
          ]
        }
      }
    })

    console.log('Footer settings from DB:', settings)

    const settingsMap = settings.reduce((acc, setting) => {
      const keyParts = setting.key.split('.')
      const category = keyParts[0]
      const field = keyParts[1]
      
      if (!acc[category]) {
        acc[category] = {}
      }
      
      acc[category][field] = setting.value
      return acc
    }, {} as Record<string, any>)

    console.log('Settings map:', settingsMap)

    const result = {
      siteName: settingsMap.general?.siteName || 'Levent Kolej',
      siteDescription: settingsMap.general?.siteDescription || 'Levent Kolej, Hizmet ve Satış Platformu',
      phone: settingsMap.general?.contactPhone || '(0464) 217 15 55',
      email: settingsMap.general?.contactEmail || 'info@leventokullari.com',
      address: settingsMap.general?.address || 'Rize, Türkiye',
      facebook: settingsMap.social?.facebook || '#',
      twitter: settingsMap.social?.twitter || '#',
      instagram: settingsMap.social?.instagram || 'rizelevent'
    }

    console.log('Footer result:', result)
    return result
  } catch (error) {
    console.error('Error fetching footer settings:', error)
    return {
      siteName: 'Levent Kolej',
      siteDescription: 'Levent Kolej, Hizmet ve Satış Platformu',
      phone: '(0464) 217 15 55',
      email: 'info@leventokullari.com',
      address: 'Rize, Türkiye',
      facebook: '#',
      twitter: '#',
      instagram: 'https://www.instagram.com/rizelevent/'
    }
  }
}

export default async function Footer() {
  const settings = await getFooterSettings()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div>
                <div className="mb-6">
                  <Link href="/" className="flex items-center space-x-3">
                    <img
                      src="/uploads/levent-akademik-logo.png"
                      alt={settings.siteName}
                      className="h-24 w-auto"
                    />
                  </Link>
                </div>
                <p className="text-white mb-6 leading-relaxed">
                  {settings.siteDescription}
                </p>
                <div className="flex space-x-3">
                  <a href={settings.facebook} className="text-white transition-colors p-3 rounded-lg bg-white/10 hover:bg-white/20">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href={settings.twitter} className="text-white transition-colors p-3 rounded-lg bg-white/10 hover:bg-white/20">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href={settings.instagram} className="text-white transition-colors p-3 rounded-lg bg-white/10 hover:bg-white/20">
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Hızlı Linkler</h4>
                <div className="text-white">
                  <DynamicMenu location="footer" />
                </div>
              </div>
            </div>

            {/* Customer Service */}
            <div>
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Müşteri Hizmetleri</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/help" className="text-white">
                      Yardım Merkezi
                    </Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="text-white">
                      Kargo Bilgileri
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className="text-white">
                      İade ve Değişim
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-white">
                      Gizlilik Politikası
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">İletişim Bilgileri</h4>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-white" />
                    <span className="text-white">{settings.phone}</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-white" />
                    <span className="text-white">{settings.email}</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-white" />
                    <span className="text-white">{settings.address}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="md:w-2/3">
              <p className="text-white">
                © {new Date().getFullYear()} {settings.siteName}. Tüm hakları saklıdır.
              </p>
            </div>
            <div className="md:w-1/3">
              <ul className="flex flex-wrap justify-center md:justify-end gap-6">
                <li>
                  <Link href="/privacy" className="text-white">
                    Gizlilik Politikası
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-white">
                    Kullanım Şartları
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 