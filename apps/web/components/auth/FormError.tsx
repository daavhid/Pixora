import { cn } from '@/lib/utils'
import React from 'react'

const FormError = ({ error,className}: { error: string | null,className?:string }) => {
  return (
    <div className={cn('text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20',className)}>
      {error}
    </div>
  )
}

export default FormError