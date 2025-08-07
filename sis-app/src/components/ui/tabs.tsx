import * as React from "react"

interface TabsProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  children?: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: '',
  onValueChange: () => {}
})

const Tabs: React.FC<TabsProps> = ({ value, onValueChange, defaultValue, children }) => {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '')

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
      {children}
    </div>
  )
}

const TabsTrigger: React.FC<{ value: string; children?: React.ReactNode; className?: string }> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = React.useContext(TabsContext)
  const isSelected = context.value === value

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected ? 'bg-background text-foreground shadow-sm' : ''
      } ${className}`}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  )
}

const TabsContent: React.FC<{ value: string; children?: React.ReactNode; className?: string }> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const context = React.useContext(TabsContext)
  
  if (context.value !== value) return null

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }