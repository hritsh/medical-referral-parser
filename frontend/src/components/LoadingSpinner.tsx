import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="mt-3 text-sm font-medium text-foreground">Parsing referral...</p>
            <p className="mt-1 text-xs text-muted-foreground">Extracting patient info, supplies, and next steps</p>
        </div>
    );
}
