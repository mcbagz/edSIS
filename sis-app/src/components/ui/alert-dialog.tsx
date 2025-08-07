import * as React from "react"

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 max-w-lg rounded-lg bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}

const AlertDialogContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="space-y-4">{children}</div>
}

const AlertDialogHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="space-y-2">{children}</div>
}

const AlertDialogTitle: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

const AlertDialogDescription: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

const AlertDialogFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-end space-x-2">{children}</div>
}

const AlertDialogAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return (
    <button
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      {...props}
    />
  )
}

const AlertDialogCancel: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return (
    <button
      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}