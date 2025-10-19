'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'
import DynamicMenu from './DynamicMenu'

// Client-side settings fetch
function useFooterSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Levent Kolej',
    siteDescription: 'Levent Kolej, Hizmet ve Satış Platformu',
    phone: '(0464) 217 15 55',
    email: 'info@leventokullari.com',
    address: 'Rize, Türkiye',
    facebook: '#',
    twitter: '#',
    instagram: 'rizelevent'
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          const settingsMap: Record<string, any> = {}
          
          data.forEach((setting: any) => {
            const keyParts = setting.key.split('.')
            const category = keyParts[0]
            const field = keyParts[1]
            
            if (!settingsMap[category]) {
              settingsMap[category] = {}
            }
            
            settingsMap[category][field] = setting.value
          })

          setSettings({
            siteName: settingsMap.general?.siteName || 'Levent Kolej',
            siteDescription: settingsMap.general?.siteDescription || 'Levent Kolej, Hizmet ve Satış Platformu',
            phone: settingsMap.general?.contactPhone || '(0464) 217 15 55',
            email: settingsMap.general?.contactEmail || 'info@leventokullari.com',
            address: settingsMap.general?.address || 'Rize, Türkiye',
            facebook: settingsMap.social?.facebook || '#',
            twitter: settingsMap.social?.twitter || '#',
            instagram: settingsMap.social?.instagram || 'rizelevent'
          })
        }
      } catch (error) {
        console.log('Footer settings error:', error)
      }
    }

    fetchSettings()
  }, [])

  return settings
}

export default function Footer() {
  const settings = useFooterSettings()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Site Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{settings.siteName}</h3>
            <p className="text-gray-300 mb-4">{settings.siteDescription}</p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">{settings.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">{settings.email}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{settings.address}</span>
              </div>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-300 hover:text-white">Hakkımızda</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white">Ürünler</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white">İletişim</Link></li>
              <li><Link href="/help" className="text-gray-300 hover:text-white">Yardım</Link></li>
            </ul>
          </div>

          {/* Müşteri Hizmetleri */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Müşteri Hizmetleri</h3>
            <ul className="space-y-2">
              <li><Link href="/shipping" className="text-gray-300 hover:text-white">Kargo</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-white">İade</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white">Gizlilik</Link></li>
            </ul>
          </div>

          {/* Sosyal Medya */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sosyal Medya</h3>
            <div className="flex space-x-4">
              <a href={settings.facebook} className="text-gray-300 hover:text-white">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={settings.twitter} className="text-gray-300 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href={`https://instagram.com/${settings.instagram}`} className="text-gray-300 hover:text-white">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 {settings.siteName}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  )
}