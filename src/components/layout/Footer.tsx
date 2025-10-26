'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'

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
            </ul>
          </div>

          {/* Müşteri Hizmetleri */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Müşteri Hizmetleri</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Destek</Link></li>
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

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300 text-center md:text-left">
              © 2025 Yakın Boğaz. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Bu sitede Ziraat Bankası Sanal POS ile güvenli alışveriş yapabilirsiniz.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}