export interface ExtractedData {
    patient_name: string | null;
    dob: string | null;
    insurance: string | null;
    policy_number: string | null;
    referring_physician: string | null;
    physician_contact: string | null;
    physician_npi: string | null;
    diagnosis: string | null;
    icd_codes: string[] | null;
    hcpcs_codes: string[] | null;
    supplies_requested: string[];
    clinical_notes: string | null;
    delivery_address: string | null;
    urgency: 'routine' | 'urgent' | 'stat' | null;
}

export interface ParsedData {
    extracted_data: ExtractedData;
    missing_info: string[];
    next_steps: string[];
    _note?: string;
}

export interface Referral {
    id: number;
    patient_name: string;
    insurance: string;
    status: ReferralStatus;
    raw_text: string;
    parsed_data: ParsedData;
    created_at: string;
}

export type ReferralStatus =
    | 'new'
    | 'pending_insurance'
    | 'pending_auth'
    | 'pending_docs'
    | 'approved'
    | 'scheduled'
    | 'delivered'
    | 'cancelled';

export const STATUS_CONFIG: Record<ReferralStatus, { label: string; color: string; description: string }> = {
    'new': { label: 'New', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300', description: 'Just received, needs review' },
    'pending_insurance': { label: 'Pending Insurance', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', description: 'Awaiting insurance verification' },
    'pending_auth': { label: 'Pending Auth', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', description: 'Prior authorization in progress' },
    'pending_docs': { label: 'Pending Docs', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300', description: 'Missing documentation' },
    'approved': { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', description: 'Ready for fulfillment' },
    'scheduled': { label: 'Scheduled', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300', description: 'Delivery scheduled' },
    'delivered': { label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', description: 'Order complete' },
    'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300', description: 'Order cancelled' },
};

export interface ParseResponse {
    success: boolean;
    raw_text: string;
    parsed_data: ParsedData;
    message?: string;
}

export interface SampleReferrals {
    clean: string;
    messy: string;
    missing_insurance: string;
}

export type ViewType = 'import' | 'orders';
