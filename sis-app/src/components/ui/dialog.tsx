import * as React from "react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 max-w-2xl rounded-lg bg-white shadow-lg">
        {children}
      </div>
    </div>
  )
}

const DialogContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`p-6 ${className}`}>{children}</div>
}

const DialogHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="space-y-2 mb-4">{children}</div>
}

const DialogTitle: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

const DialogDescription: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

const DialogFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-end space-x-2 mt-6">{children}</div>
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}