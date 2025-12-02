import { AlertTriangle, CheckCircle2, Phone, Send, Copy, ExternalLink, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActionCenterProps {
    missingInfo: string[];
    nextSteps: string[];
    physicianContact?: string | null;
    insurance?: string | null;
}

export function ActionCenter({
    missingInfo,
    nextSteps,
    physicianContact,
    insurance
}: ActionCenterProps) {

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const isCallStep = (step: string) =>
        step.toLowerCase().includes('call') || step.toLowerCase().includes('contact');

    const isInsuranceStep = (step: string) =>
        step.toLowerCase().includes('insurance') || step.toLowerCase().includes('eligibility') || step.toLowerCase().includes('verify');

    return (
        <div className="space-y-4">
            {/* Missing Info */}
            {missingInfo.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Missing Information
                            <Badge className="ml-auto text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
                                {missingInfo.length} item{missingInfo.length > 1 ? 's' : ''}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                        <ul className="space-y-1">
                            {missingInfo.map((item, idx) => (
                                <li key={idx} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-3 pt-3 border-t border-amber-500/20 flex gap-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
                                <Phone className="w-3 h-3 mr-1" />
                                Call Patient
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
                                <Send className="w-3 h-3 mr-1" />
                                Fax Provider
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Next Steps */}
            {nextSteps.length > 0 && (
                <Card>
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Next Steps
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                        <ol className="space-y-2">
                            {nextSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                        <span className="text-sm text-muted-foreground">{step}</span>

                                        {/* Inline actions */}
                                        {(isCallStep(step) && physicianContact) && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5 ml-2 text-primary">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {physicianContact}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Click to call</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {(isInsuranceStep(step) && insurance) && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-5 text-[10px] px-1.5 ml-2 text-primary"
                                                        onClick={() => window.open('https://www.availity.com', '_blank')}
                                                    >
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        Check Eligibility
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Opens Availity</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <div className="mt-3 pt-3 border-t border-border flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleCopy(nextSteps.join('\n'))}
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                            </Button>
                            <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90">
                                <Send className="w-3 h-3 mr-1" />
                                Forward to Team
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Ready State */}
            {missingInfo.length === 0 && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="py-4 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">Ready for Fulfillment</p>
                        <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-0.5">All required info present</p>
                        <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-xs">
                            <Truck className="w-3 h-3 mr-1" />
                            Schedule Delivery
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
