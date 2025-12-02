import type { Referral, ParseResponse, SampleReferrals } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || 'Request failed');
    }
    return response.json();
}

export async function fetchReferrals(): Promise<Referral[]> {
    const response = await fetch(`${API_BASE_URL}/referrals`);
    return handleResponse<Referral[]>(response);
}

export async function fetchReferralById(id: number): Promise<Referral> {
    const response = await fetch(`${API_BASE_URL}/referrals/${id}`);
    return handleResponse<Referral>(response);
}

export async function parseText(text: string): Promise<ParseResponse> {
    const response = await fetch(`${API_BASE_URL}/parse`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    return handleResponse<ParseResponse>(response);
}

export async function parsePdf(file: File): Promise<ParseResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/parse/pdf`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse<ParseResponse>(response);
}

export async function saveReferral(data: {
    patient_name: string;
    insurance: string;
    status?: string;
    raw_text: string;
    parsed_data: object;
}): Promise<Referral> {
    const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return handleResponse<Referral>(response);
}

export async function fetchSamples(): Promise<SampleReferrals> {
    const response = await fetch(`${API_BASE_URL}/samples`);
    return handleResponse<SampleReferrals>(response);
}

export async function updateReferralStatus(id: number, status: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/referrals/${id}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    return handleResponse<void>(response);
}

// alias for cleaner imports
export const updateStatus = updateReferralStatus;
