// Minimal toast hook shim to satisfy imports
export function useToast() {
  return {
    toast: ({ title, description, variant }: { title?: string; description?: string; variant?: 'destructive' | 'default' }) => {
      if (variant === 'destructive') {
        console.error(title || 'Toast', description || '')
      } else {
        console.log(title || 'Toast', description || '')
      }
    }
  }
}


