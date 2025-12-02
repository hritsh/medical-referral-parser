import { FileUp, Package, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { ViewType } from '../types';
import Logo from '../../public/referral-parser.svg';

interface TopBarProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
}

export function TopBar({
    currentView,
    onViewChange,
    darkMode,
    setDarkMode,
}: TopBarProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <img src={Logo} alt="Referral Parser Logo" className="w-8 h-8" />
                    <div className="hidden sm:block">
                        <h1 className="font-semibold text-sm text-foreground leading-none">Referral Parser</h1>
                        <p className="text-[10px] text-muted-foreground">DME Intake Helper</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    <Button
                        variant={currentView === 'import' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`gap-2 h-9 ${currentView === 'import'
                            ? 'bg-primary/10 text-primary hover:bg-primary/15'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                        onClick={() => onViewChange('import')}
                    >
                        <FileUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Parse Referral</span>
                    </Button>

                    <Button
                        variant={currentView === 'orders' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`gap-2 h-9 ${currentView === 'orders'
                            ? 'bg-primary/10 text-primary hover:bg-primary/15'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                        onClick={() => onViewChange('orders')}
                    >
                        <Package className="w-4 h-4" />
                        <span className="hidden sm:inline">DME Orders</span>
                    </Button>
                </nav>

                {/* Dark mode toggle */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        {darkMode ? (
                            <Moon className="w-4 h-4" />
                        ) : (
                            <Sun className="w-4 h-4" />
                        )}
                    </div>
                    <Switch
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
            </div>
        </header>
    );
}
