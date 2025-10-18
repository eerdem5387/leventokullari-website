'use client'

import { useState, useEffect } from 'react'
import Header from './Header'

export default function HeaderWrapper() {
  const [siteName, setSiteName] = useState('E-Mağaza')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          const siteNameSetting = data.find((setting: any) => setting.key === 'general.siteName')
          if (siteNameSetting) {
            setSiteName(siteNameSetting.value)
          }
        }
      } catch (error) {
        console.error('Error fetching header settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (isLoading) {
    return <Header siteName="E-Mağaza" />
  }
  
  return <Header siteName={siteName} />
} 