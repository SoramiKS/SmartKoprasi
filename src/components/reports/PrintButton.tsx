'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      <Printer aria-hidden="true" />
      Cetak
    </Button>
  )
}