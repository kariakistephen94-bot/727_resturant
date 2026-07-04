'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: 'Copied',
        description: label ? `${label} copied to clipboard` : 'Copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn('shrink-0 h-9 w-9 rounded-lg hover:bg-muted', className)}
      aria-label={label ? `Copy ${label}` : 'Copy'}
    >
      {copied ? (
        <Check className="h-4 w-4 text-secondary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
