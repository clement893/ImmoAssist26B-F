'use client';

import {
  LayoutDashboard,
  Repeat,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react';

export default function MenuDemo() {
  const improvements = [
    {
      title: 'Ultra-Minimalist Design',
      description: 'Clean white background with subtle shadows for depth',
      icon: Sparkles,
    },
    {
      title: 'Generous Spacing',
      description: 'Increased padding and gaps for better readability',
      icon: Sparkles,
    },
    {
      title: 'Active State Highlight',
      description: 'Vibrant blue background with white text for active items',
      icon: Sparkles,
    },
    {
      title: 'Light Typography',
      description: 'Font-light for inactive items, font-medium for active',
      icon: Sparkles,
    },
    {
      title: 'Smooth Transitions',
      description: 'All hover and active states have smooth animations',
      icon: Sparkles,
    },
    {
      title: 'Pro Badge',
      description: 'Gradient card with upgrade call-to-action',
      icon: Sparkles,
    },
  ];

  const colorPalette = [
    { name: 'Primary Blue', color: 'bg-blue-500', hex: '#3B82F6' },
    { name: 'White', color: 'bg-white', hex: '#FFFFFF' },
    { name: 'Gray 900', color: 'bg-gray-900', hex: '#111827' },
    { name: 'Gray 600', color: 'bg-gray-600', hex: '#4B5563' },
    { name: 'Gray 400', color: 'bg-gray-400', hex: '#9CA3AF' },
    { name: 'Gray 100', color: 'bg-gray-100', hex: '#F3F4F6' },
    { name: 'Gray 50', color: 'bg-gray-50', hex: '#F9FAFB' },
    { name: 'Indigo 600', color: 'bg-indigo-600', hex: '#4F46E5' },
  ];

  return (
    <div className="min-h-screen p-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          New Navigation Menu
        </h1>
        <p className="text-sm font-light text-gray-500">
          Discover the improvements and design principles of the new menu
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Before/After Comparison */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-normal text-gray-900 mb-6">Before</h2>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-l-4 border-indigo-600 rounded">
                <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">Dashboard</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded">
                <Repeat className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Transactions</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Calendar</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-light text-gray-500">❌ Border-based active state</p>
            <p className="text-xs font-light text-gray-500">❌ Standard spacing</p>
            <p className="text-xs font-light text-gray-500">❌ Medium font weight</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-normal text-gray-900 mb-6">After</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-4 px-5 py-3.5 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/30">
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
              <div className="flex items-center gap-4 px-5 py-3.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200">
                <Repeat className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-light">Transactions</span>
              </div>
              <div className="flex items-center gap-4 px-5 py-3.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-light">Calendar</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-light text-green-600">✓ Full background active state</p>
            <p className="text-xs font-light text-green-600">✓ Generous spacing (gap-4, py-3.5)</p>
            <p className="text-xs font-light text-green-600">✓ Light font weight</p>
          </div>
        </div>
      </div>

      {/* Key Improvements */}
      <div className="mb-10">
        <h2 className="text-2xl font-light text-gray-900 mb-6">Key Improvements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {improvements.map((improvement, index) => {
            const Icon = improvement.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-xl p-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-normal text-gray-900 mb-2">
                      {improvement.title}
                    </h3>
                    <p className="text-xs font-light text-gray-500">
                      {improvement.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-10">
        <h2 className="text-2xl font-light text-gray-900 mb-6">Color Palette</h2>
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {colorPalette.map((color, index) => (
              <div key={index} className="text-center">
                <div className={`${color.color} w-full h-24 rounded-xl shadow-sm mb-3 ${color.color === 'bg-white' ? 'border border-gray-200' : ''}`} />
                <p className="text-sm font-normal text-gray-900 mb-1">{color.name}</p>
                <p className="text-xs font-light text-gray-500">{color.hex}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Design Principles */}
      <div className="mb-10">
        <h2 className="text-2xl font-light text-gray-900 mb-6">Design Principles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-normal text-gray-900 mb-4">Typography</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">font-light for inactive items</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">font-medium for active items</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">font-normal for headings</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-normal text-gray-900 mb-4">Spacing</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">gap-4 between icon and text</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">py-3.5 for vertical padding</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">space-y-2 between menu items</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-normal text-gray-900 mb-4">Borders & Shadows</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">shadow-sm for sidebar</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">shadow-md for active item</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">No borders, only shadows</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-normal text-gray-900 mb-4">Interactions</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">transition-all duration-200</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">hover:bg-gray-50 for inactive</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-light text-gray-700">rounded-xl for modern look</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspiration */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
        <h2 className="text-2xl font-light text-gray-900 mb-4">Inspired by Video Buddy</h2>
        <p className="text-sm font-light text-gray-600 mb-6">
          This menu design is directly inspired by the Video Buddy application, known for its
          clean, minimalist interface and exceptional user experience. We've adapted these
          principles to create a navigation system that's both beautiful and functional.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 bg-white rounded-xl text-xs font-light text-gray-700 shadow-sm">
            Minimalist
          </span>
          <span className="px-4 py-2 bg-white rounded-xl text-xs font-light text-gray-700 shadow-sm">
            Clean
          </span>
          <span className="px-4 py-2 bg-white rounded-xl text-xs font-light text-gray-700 shadow-sm">
            Modern
          </span>
          <span className="px-4 py-2 bg-white rounded-xl text-xs font-light text-gray-700 shadow-sm">
            Intuitive
          </span>
          <span className="px-4 py-2 bg-white rounded-xl text-xs font-light text-gray-700 shadow-sm">
            Professional
          </span>
        </div>
      </div>
    </div>
  );
}
