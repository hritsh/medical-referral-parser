import { User, Calendar, Shield, Stethoscope, FileText, Package, MapPin, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtractedData } from '../types';

interface PatientCardProps {
    data: ExtractedData;
}

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
            <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
        </div>
    );
}

export function PatientCard({ data }: PatientCardProps) {
    // Ensure supplies_requested is always an array
    const supplies = Array.isArray(data.supplies_requested)
        ? data.supplies_requested
        : (typeof data.supplies_requested === 'string' ? [data.supplies_requested] : []);
    const hasSupplies = supplies.length > 0;
    const hasCodes = (data.icd_codes && data.icd_codes.length > 0) || (data.hcpcs_codes && data.hcpcs_codes.length > 0);

    return (
        <Card>
            {/* Patient header */}
            <CardHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">
                                {data.patient_name || 'Unknown Patient'}
                            </CardTitle>
                            {data.dob && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    DOB: {data.dob}
                                </p>
                            )}
                        </div>
                    </div>
                    {data.urgency && (
                        <Badge
                            variant={data.urgency === 'stat' ? 'destructive' : data.urgency === 'urgent' ? 'default' : 'secondary'}
                            className="text-[10px]"
                        >
                            {data.urgency.toUpperCase()}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
                {/* Insurance Section */}
                <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Insurance</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Payer" value={data.insurance} />
                        <Field label="Member ID" value={data.policy_number} mono />
                    </div>
                </div>

                {/* Referring Provider */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Referring Provider</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Physician" value={data.referring_physician} />
                        <Field label="NPI" value={data.physician_npi} mono />
                        <Field label="Phone/Fax" value={data.physician_contact} />
                    </div>
                </div>

                {/* Diagnosis */}
                {(data.diagnosis || hasCodes) && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Diagnosis</span>
                        </div>
                        {data.diagnosis && (
                            <p className="text-sm text-foreground mb-2">{data.diagnosis}</p>
                        )}
                        {hasCodes && (
                            <div className="flex flex-wrap gap-1.5">
                                {data.icd_codes?.map((code, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px] font-mono">
                                        ICD: {code}
                                    </Badge>
                                ))}
                                {data.hcpcs_codes?.map((code, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px] font-mono bg-primary/5">
                                        HCPCS: {code}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Supplies */}
                {hasSupplies && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Equipment/Supplies</span>
                        </div>
                        <div className="space-y-1.5">
                            {supplies.map((supply, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                                    <Hash className="w-3 h-3 text-muted-foreground" />
                                    {supply}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery Address */}
                {data.delivery_address && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Delivery Address</span>
                        </div>
                        <p className="text-sm text-foreground">{data.delivery_address}</p>
                    </div>
                )}

                {/* Clinical Notes */}
                {data.clinical_notes && (
                    <div className="border-t border-border pt-4">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Clinical Notes</p>
                        <p className="text-sm text-muted-foreground italic">"{data.clinical_notes}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
