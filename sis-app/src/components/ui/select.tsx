import * as React from "react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || '')

  React.useEffect(() => {
    setSelectedValue(value || '')
  }, [value])

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { 
            open, 
            setOpen, 
            value: selectedValue, 
            onValueChange: (val: string) => {
              setSelectedValue(val)
              onValueChange?.(val)
            }
          })
        }
        return child
      })}
    </div>
  )
}

const SelectTrigger: React.FC<any> = ({ children, open, setOpen }) => {
  return (
    <button
      type="button"
      onClick={() => setOpen?.(!open)}
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span>{placeholder || 'Select...'}</span>
}

const SelectContent: React.FC<any> = ({ children, open, setOpen, value, onValueChange }) => {
  if (!open) return null
  
  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { 
            onValueChange,
            setOpen,
            isSelected: child.props.value === value
          })
        }
        return child
      })}
    </div>
  )
}

const SelectItem: React.FC<any> = ({ value, children, onValueChange, setOpen, isSelected }) => {
  return (
    <button
      type="button"
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent' : ''}`}
      onClick={() => {
        onValueChange?.(value)
        setOpen?.(false)
      }}
    >
      {children}
    </button>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }