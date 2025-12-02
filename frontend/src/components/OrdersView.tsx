import { useState, useEffect } from 'react';
import { Package, Search, Filter, ChevronDown, Calendar, User, Shield, Truck, Clock, FileText, Code, Eye, AlignLeft } from 'lucide-react';
import { fetchReferrals, updateStatus } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Referral, ReferralStatus } from '@/types';
import { STATUS_CONFIG } from '@/types';

interface OrdersViewProps {
    refreshTrigger: number;
}

const statusOptions: ReferralStatus[] = [
    'new',
    'pending_insurance',
    'pending_auth',
    'pending_docs',
    'approved',
    'scheduled',
    'delivered',
    'cancelled'
];

export function OrdersView({ refreshTrigger }: OrdersViewProps) {
    const [orders, setOrders] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Referral | null>(null);

    useEffect(() => {
        loadOrders();
    }, [refreshTrigger]);

    const loadOrders = async () => {
        try {
            const data = await fetchReferrals();
            setOrders(data);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e: React.MouseEvent, orderId: number, newStatus: ReferralStatus) => {
        e.stopPropagation(); // Prevent row click when clicking status dropdown
        try {
            await updateStatus(orderId, newStatus);
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = search === '' ||
            order.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
            order.insurance?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: ReferralStatus) => {
        switch (status) {
            case 'new': return <Clock className="w-3 h-3" />;
            case 'pending_insurance':
            case 'pending_auth':
            case 'pending_docs': return <FileText className="w-3 h-3" />;
            case 'approved': return <Shield className="w-3 h-3" />;
            case 'scheduled':
            case 'delivered': return <Truck className="w-3 h-3" />;
            default: return null;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Normalize supplies_requested to always be an array
    const getSupplies = (order: Referral): string[] => {
        const supplies = order.parsed_data?.extracted_data?.supplies_requested;
        if (Array.isArray(supplies)) return supplies;
        if (typeof supplies === 'string') return [supplies];
        return [];
    };

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status.startsWith('pending')).length,
        approved: orders.filter(o => o.status === 'approved' || o.status === 'scheduled').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">DME Orders</h2>
                <p className="text-sm text-muted-foreground">Track and manage referral status</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-border">
                    <CardContent className="py-3 px-4">
                        <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total Orders</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="py-3 px-4">
                        <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Pending</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-3 px-4">
                        <p className="text-2xl font-semibold text-primary">{stats.approved}</p>
                        <p className="text-xs text-primary/80">Approved</p>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="py-3 px-4">
                        <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{stats.delivered}</p>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Delivered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search patient or insurance..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 h-9 text-sm">
                        <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                                {STATUS_CONFIG[status].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No orders found</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Parse a referral to get started</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden py-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-52">Patient</TableHead>
                                <TableHead className="w-40">Insurance</TableHead>
                                <TableHead className="w-56">Equipment</TableHead>
                                <TableHead className="w-32">Date</TableHead>
                                <TableHead className="w-40">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map(order => (
                                <TableRow
                                    key={order.id}
                                    className="cursor-pointer hover:bg-accent/50"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium text-foreground">
                                                {order.patient_name || 'Unknown Patient'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Shield className="w-3.5 h-3.5" />
                                            <span className="text-sm">{order.insurance || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {getSupplies(order).slice(0, 2).map((s, i) => (
                                                <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                                    {s.length > 18 ? s.slice(0, 18) + '...' : s}
                                                </Badge>
                                            ))}
                                            {getSupplies(order).length > 2 && (
                                                <Badge variant="outline" className="text-[10px] font-normal">
                                                    +{getSupplies(order).length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(order.created_at)}
                                        </div>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className={`h-7 text-xs gap-1.5 ${STATUS_CONFIG[order.status as ReferralStatus]?.color || ''}`}
                                                >
                                                    {getStatusIcon(order.status as ReferralStatus)}
                                                    {STATUS_CONFIG[order.status as ReferralStatus]?.label || order.status}
                                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                {statusOptions.map(status => (
                                                    <DropdownMenuItem
                                                        key={status}
                                                        onClick={(e) => handleStatusChange(e, order.id, status)}
                                                        className="text-xs"
                                                    >
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${status.startsWith('pending') ? 'bg-amber-500' :
                                                            status === 'approved' || status === 'scheduled' ? 'bg-primary' :
                                                                status === 'delivered' ? 'bg-emerald-500' :
                                                                    status === 'cancelled' ? 'bg-muted-foreground' : 'bg-blue-500'
                                                            }`} />
                                                        {STATUS_CONFIG[status].label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col" aria-describedby="order-details-description">
                    <DialogHeader className="border-b border-border pb-4">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="text-lg">{selectedOrder?.patient_name || 'Order Details'}</span>
                                {selectedOrder && (
                                    <p className="text-sm font-normal text-muted-foreground">
                                        Created {formatDate(selectedOrder.created_at)}
                                    </p>
                                )}
                            </div>
                        </DialogTitle>
                        <DialogDescription id="order-details-description" className="sr-only">
                            View detailed information about this DME order including patient info, equipment requested, and next steps.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <Tabs defaultValue="formatted" className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="formatted" className="gap-2">
                                    <Eye className="w-3.5 h-3.5" />
                                    Formatted
                                </TabsTrigger>
                                <TabsTrigger value="json" className="gap-2">
                                    <Code className="w-3.5 h-3.5" />
                                    Processed JSON
                                </TabsTrigger>
                                <TabsTrigger value="raw" className="gap-2">
                                    <AlignLeft className="w-3.5 h-3.5" />
                                    Raw Referral Text
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto">
                                <TabsContent value="formatted" className="mt-0 h-full">
                                    <div className="space-y-5 pr-2">
                                        {/* Patient & Insurance Info */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Card className="p-4 py-3">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Insurance</p>
                                                <p className="text-sm text-foreground font-medium">{selectedOrder.parsed_data?.extracted_data?.insurance || 'N/A'}</p>
                                            </Card>
                                            <Card className="p-4 py-3">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Member ID</p>
                                                <p className="text-sm text-foreground font-medium font-mono">{selectedOrder.parsed_data?.extracted_data?.policy_number || 'N/A'}</p>
                                            </Card>
                                            <Card className="p-4 py-3">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Date of Birth</p>
                                                <p className="text-sm text-foreground font-medium">{selectedOrder.parsed_data?.extracted_data?.dob || 'N/A'}</p>
                                            </Card>
                                            <Card className="p-4 py-3">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Urgency</p>
                                                <p className="text-sm text-foreground font-medium capitalize">{selectedOrder.parsed_data?.extracted_data?.urgency || 'Routine'}</p>
                                            </Card>
                                        </div>

                                        {/* Referring Provider */}
                                        <Card className="p-4">
                                            <p className="text-[10px] uppercase text-muted-foreground mb-2 tracking-wide">Referring Provider</p>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground">Physician</p>
                                                    <p className="text-sm text-foreground">{selectedOrder.parsed_data?.extracted_data?.referring_physician || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground">NPI</p>
                                                    <p className="text-sm text-foreground font-mono">{selectedOrder.parsed_data?.extracted_data?.physician_npi || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground">Contact</p>
                                                    <p className="text-sm text-foreground">{selectedOrder.parsed_data?.extracted_data?.physician_contact || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Diagnosis */}
                                        <Card className="p-4">
                                            <p className="text-[10px] uppercase text-muted-foreground mb-2 tracking-wide">Diagnosis</p>
                                            <p className="text-sm text-foreground mb-2">{selectedOrder.parsed_data?.extracted_data?.diagnosis || 'N/A'}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedOrder.parsed_data?.extracted_data?.icd_codes?.map((code, i) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] font-mono">ICD: {code}</Badge>
                                                ))}
                                                {selectedOrder.parsed_data?.extracted_data?.hcpcs_codes?.map((code, i) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] font-mono bg-primary/5">HCPCS: {code}</Badge>
                                                ))}
                                            </div>
                                        </Card>

                                        {/* Supplies */}
                                        {getSupplies(selectedOrder).length > 0 && (
                                            <Card className="p-4">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-2 tracking-wide">Equipment Requested</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {getSupplies(selectedOrder).map((s, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs py-1 px-2">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Card>
                                        )}

                                        {/* Delivery Address */}
                                        {selectedOrder.parsed_data?.extracted_data?.delivery_address && (
                                            <Card className="p-4">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Delivery Address</p>
                                                <p className="text-sm text-foreground">{selectedOrder.parsed_data.extracted_data.delivery_address}</p>
                                            </Card>
                                        )}

                                        {/* Clinical Notes */}
                                        {selectedOrder.parsed_data?.extracted_data?.clinical_notes && (
                                            <Card className="p-4 bg-muted/30">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Clinical Notes</p>
                                                <p className="text-sm text-muted-foreground italic">"{selectedOrder.parsed_data.extracted_data.clinical_notes}"</p>
                                            </Card>
                                        )}

                                        {/* Next Steps */}
                                        {selectedOrder.parsed_data?.next_steps && selectedOrder.parsed_data.next_steps.length > 0 && (
                                            <Card className="p-4">
                                                <p className="text-[10px] uppercase text-muted-foreground mb-2 tracking-wide">Next Steps</p>
                                                <ol className="space-y-2">
                                                    {selectedOrder.parsed_data.next_steps.map((step, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                                                            <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            {step}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </Card>
                                        )}

                                        {/* Missing Info */}
                                        {selectedOrder.parsed_data?.missing_info && selectedOrder.parsed_data.missing_info.length > 0 && (
                                            <Card className="p-4 border-amber-500/30 bg-amber-500/5">
                                                <p className="text-[10px] uppercase text-amber-600 dark:text-amber-400 mb-2 tracking-wide">Missing Information</p>
                                                <ul className="space-y-1">
                                                    {selectedOrder.parsed_data.missing_info.map((item, i) => (
                                                        <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Card>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="json" className="mt-0 h-full">
                                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono text-foreground h-[400px] overflow-y-auto">
                                        {JSON.stringify(selectedOrder.parsed_data, null, 2)}
                                    </pre>
                                </TabsContent>

                                <TabsContent value="raw" className="mt-0 h-full">
                                    <Card className="p-4 h-[400px] overflow-y-auto">
                                        <p className="text-[10px] uppercase text-muted-foreground mb-2 tracking-wide">Original Referral Text</p>
                                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                                            {selectedOrder.raw_text || 'No raw text available for this order.'}
                                        </pre>
                                    </Card>
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
