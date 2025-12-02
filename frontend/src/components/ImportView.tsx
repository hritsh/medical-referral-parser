import { useState, useRef } from 'react';
import { Upload, FileText, FlaskConical, Sparkles, Save, RotateCcw, CheckCircle, Code, Eye } from 'lucide-react';
import { parseText, parsePdf, saveReferral, fetchSamples } from '@/api';
import { LoadingSpinner } from './LoadingSpinner';
import { PatientCard } from './PatientCard';
import { ActionCenter } from './ActionCenter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ParseResponse } from '@/types';

interface ImportViewProps {
    onSaveSuccess: () => void;
}

export function ImportView({ onSaveSuccess }: ImportViewProps) {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ParseResponse | null>(null);
    const [showJson, setShowJson] = useState(false);
    const [rawTextOpen, setRawTextOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleParse = async () => {
        setError(null);
        setIsLoading(true);
        setSaved(false);

        try {
            let response: ParseResponse;
            if (file) {
                response = await parsePdf(file);
            } else if (text.trim()) {
                response = await parseText(text);
            } else {
                throw new Error('Need some text or a file to parse');
            }
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setIsSaving(true);
        setError(null);

        try {
            const patientName = result.parsed_data.extracted_data.patient_name || 'Unknown';
            const insurance = result.parsed_data.extracted_data.insurance || 'Unknown';

            await saveReferral({
                patient_name: patientName,
                insurance: insurance,
                raw_text: result.raw_text,
                parsed_data: result.parsed_data,
            });

            setSaved(true);
            onSaveSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setText('');
        setFile(null);
        setResult(null);
        setError(null);
        setSaved(false);
        setShowJson(false);
    };

    const loadSample = async (type: 'clean' | 'messy' | 'missing_insurance') => {
        try {
            const samples = await fetchSamples();
            setText(samples[type]);
        } catch {
            const fallbackSamples = {
                clean: `VERSE MEDICAL ORDER FORM
Fax: (833) 694-1477

Order Date: 12/01/2024
Patient Name: Patricia Anderson
DOB: 03/18/1955

WOUND CARE ORDER
Have the patient's wounds ever been debrided? Yes

Wound 1:
ICD-10: L89.154 (Pressure ulcer of sacral region, stage 4)
Location: Sacral/coccyx area
Wound Size: 5.2 x 4.1 x 2.0 cm
Drainage: Moderate
Thickness: Full

Supplies Requested (30 day supply):
- Foam dressing with silver (Ag) - 6x6 - change every 3 days
- Alginate dressing 4x4 - for packing
- Hydrocolloid border 6x6 - secondary
- Saline wound cleanser
- Gloves, Size M
- Wound care kit

Insurance: Medicare Part B
Member ID: 1EG4-TE5-MK72

Prescribing Entity: Valley Home Health
Provider Name: Dr. Sarah Chen, MD
NPI: 1234567890
Clinic: Valley Wound Care Center
Phone: (555) 234-5678

Delivery Address:
2847 Oakwood Lane
Austin, TX 78704`,
                messy: `*** FAX - SUNRISE HOME HEALTH ***
to: verse medical 833-694-1477
date: dec 1

pt: william tucker
dob - 10/22/68

COMPRESSION + WOUND SUPPLIES

has venous stasis ulcer left leg
wound on medial ankle, 2x2cm approx
moderate drainage, need foam dressings

compression measurements:
left leg - ankle 23cm, calf 36cm
needs 30-40 mmHg
farrow wrap preferred

ins: aetna 
member id: W883345567

also needs:
- wound cleanser
- abd pads
- tape

call me if questions 555-0199
- dr martinez NPI 9876543210`,
                missing_insurance: `URGENT - HOSPITAL DISCHARGE TODAY

Patient: Thomas Garcia
DOB: 07/14/1982
Phone: (555) 867-5309

Dx: Surgical wound dehiscence, abdominal (T81.31XA)
Post-op day 5 from appendectomy

Wound Details:
Location: RLQ abdomen
Size: 8.0 x 3.5 x 2.5 cm
Drainage: HIGH - packing required
Thickness: Full, tunneling present

URGENT SUPPLIES NEEDED:
- Alginate rope for packing
- ABD pads 5x9
- Foam dressing 6x6
- Wound care kit
- Saline irrigation

Dressing change: BID x 1 week, then daily

Referring: Dr. Linda Park, General Surgery
Memorial Hospital
Fax: (555) 444-2222
NPI: 5566778899

** INSURANCE NOT ON FILE - PATIENT WILL CALL **
** PATIENT DISCHARGED 4PM TODAY **
** STAT DELIVERY REQUIRED **`
            };
            setText(fallbackSamples[type]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('File needs to be a PDF');
        }
    };

    // Results view
    if (result) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Parsed Referral</h2>
                        <p className="text-sm text-muted-foreground">
                            Review the extracted data before saving
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* JSON toggle */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Formatted</span>
                            <Switch
                                checked={showJson}
                                onCheckedChange={setShowJson}
                                className="data-[state=checked]:bg-primary"
                            />
                            <Code className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">JSON</span>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || saved}
                            className={saved ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-primary hover:bg-primary/90'}
                        >
                            {saved ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Saved
                                </>
                            ) : isSaving ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-1" />
                                    Save Order
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* JSON view */}
                {showJson ? (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Extracted JSON
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono text-foreground">
                                {JSON.stringify(result.parsed_data, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                ) : (
                    /* Formatted view */
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        <div className="lg:col-span-3">
                            <PatientCard data={result.parsed_data.extracted_data} />
                        </div>
                        <div className="lg:col-span-2">
                            <ActionCenter
                                missingInfo={result.parsed_data.missing_info || []}
                                nextSteps={result.parsed_data.next_steps || []}
                                physicianContact={result.parsed_data.extracted_data.physician_contact}
                                insurance={result.parsed_data.extracted_data.insurance}
                            />
                        </div>
                    </div>
                )}

                {/* Original text */}
                <Collapsible open={rawTextOpen} onOpenChange={setRawTextOpen} className="mt-5">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <FileText className="w-4 h-4" />
                        {rawTextOpen ? 'Hide' : 'Show'} Original Referral Text
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <pre className="mt-3 p-4 bg-card border border-border rounded-lg text-xs overflow-x-auto whitespace-pre-wrap text-foreground font-mono">
                            {result.raw_text}
                        </pre>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        );
    }

    // Input view
    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Parse New Referral</h2>
                <p className="text-sm text-muted-foreground">
                    Paste a fax, upload a PDF, or try a sample to see how it works
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="paste">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="paste" className="gap-2 text-xs">
                                <FileText className="w-3.5 h-3.5" />
                                Paste Text
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="gap-2 text-xs">
                                <Upload className="w-3.5 h-3.5" />
                                Upload PDF
                            </TabsTrigger>
                            <TabsTrigger value="samples" className="gap-2 text-xs">
                                <FlaskConical className="w-3.5 h-3.5" />
                                Samples
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="paste">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste your referral here... faxes, emails, whatever you got"
                                className="min-h-[220px] font-mono text-sm resize-none"
                            />
                            <p className="mt-2 text-xs text-muted-foreground">
                                {text.length > 0 ? `${text.length} characters` : 'Supports messy faxes, handwritten notes, any format'}
                            </p>
                        </TabsContent>

                        <TabsContent value="upload">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                                <p className="font-medium text-foreground text-sm">
                                    {file ? file.name : 'Click to upload a PDF'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Or drag and drop'}
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </TabsContent>

                        <TabsContent value="samples">
                            <p className="text-xs text-muted-foreground mb-3">
                                Test with these sample referrals to see how the parser handles different formats:
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => loadSample('clean')}
                                    className="w-full p-3 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="font-medium text-sm text-foreground">Wound Care Order (Clean)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-4">
                                        Stage 4 pressure ulcer, complete Verse order form
                                    </span>
                                </button>

                                <button
                                    onClick={() => loadSample('messy')}
                                    className="w-full p-3 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        <span className="font-medium text-sm text-foreground">Compression + Wound Fax</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-4">
                                        Venous ulcer with compression wrap, handwritten style
                                    </span>
                                </button>

                                <button
                                    onClick={() => loadSample('missing_insurance')}
                                    className="w-full p-3 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="font-medium text-sm text-foreground">Urgent Discharge - No Insurance</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-4">
                                        Surgical wound dehiscence, stat delivery needed
                                    </span>
                                </button>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        onClick={handleParse}
                        disabled={isLoading || (!text && !file)}
                        className="mt-5 w-full bg-primary hover:bg-primary/90"
                        size="lg"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Parse with AI
                    </Button>

                    {isLoading && (
                        <div className="mt-6">
                            <LoadingSpinner />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Context note */}
            <p className="mt-4 text-xs text-muted-foreground text-center">
                Uses Gemini 2.0 Flash to extract structured data from messy referral documents
            </p>
        </div>
    );
}
