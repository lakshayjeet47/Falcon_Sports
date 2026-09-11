import React from 'react'
import { NavLink } from 'react-router-dom'
import { Swords, Radio } from 'lucide-react'

export default function TabBar() {
  const tabs = [
    { to: '/organise', label: 'Organise', icon: Swords },
    { to: '/join', label: 'Join Ongoing', icon: Radio },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:static md:mt-6 bg-courtNavy border-t md:border-t-0 md:border-b border-courtNavyLight z-30">
      <div className="max-w-3xl mx-auto flex">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex md:inline-flex items-center justify-center gap-2 py-3 md:py-3 md:px-6 text-sm font-semibold transition-colors ${
                isActive ? 'text-falconAmber border-t-2 md:border-t-0 md:border-b-2 border-falconAmber' : 'text-chalk/60'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
