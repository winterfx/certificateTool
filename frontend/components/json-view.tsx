"use client"

import React, { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

type JsonViewProps = {
  data: any
  level?: number
  path?: string
}

export function JsonView({ data, level = 0, path = '' }: JsonViewProps) {
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({})

  const toggleCollapse = (key: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡
    setCollapsed(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const renderValue = (key: string, value: any, currentPath: string) => {
    const fullPath = currentPath ? `${currentPath}.${key}` : key
    
    if (value === null) return <span className="text-gray-500">null</span>
    if (typeof value === 'boolean') return <span className="text-purple-600">{value.toString()}</span>
    if (typeof value === 'number') return <span className="text-blue-600">{value}</span>
    if (typeof value === 'string') return <span className="text-green-600">"{value}"</span>
    
    const isArray = Array.isArray(value)
    const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0
    
    if (isEmpty) {
      return <span>{isArray ? '[]' : '{}'}</span>
    }

    const isCollapsed = collapsed[fullPath]
    
    return (
      <div className="relative">
        <div 
          className="inline-flex items-center cursor-pointer hover:bg-gray-100 rounded"
          onClick={(e) => toggleCollapse(fullPath, e)}
        >
          <div className="flex items-center">
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <span className="mr-1">{isArray ? '[' : '{'}</span>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="ml-2 border-l border-gray-200 pl-1">
            {Object.entries(value).map(([k, v], i) => (
              <div key={k} className="flex items-start">
                <span className="text-gray-800 mr-1">
                  {isArray ? '' : `"${k}":`}
                </span>
                {renderValue(k, v, fullPath)}
                {i < Object.entries(value).length - 1 && <span className="mr-1">,</span>}
              </div>
            ))}
          </div>
        )}
        <span>{isArray ? ']' : '}'}</span>
      </div>
    )
  }

  return (
    <div className="font-mono text-sm overflow-x-auto">
      {renderValue('root', data, path)}
    </div>
  )
}
