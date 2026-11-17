import { jsPDF } from 'jspdf';
import {
  AgencySettings,
  Agent,
  Client,
  CurrencyCode,
  Lease,
  Offer,
  Payment,
  Property,
  Visit,
} from '../types';
import { formatMoney } from '../i18n/translations';

export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const raw = row[h] ?? '';
          const escaped = String(raw).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function drawPdfHeader(doc: jsPDF, title: string, settings: AgencySettings): number {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.name, 16, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`${settings.address} · ${settings.reraOrn} · ${settings.phone}`, 16, 22);
  doc.setTextColor(45, 212, 191);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), 16, 29);

  doc.setTextColor(15, 23, 42);
  return 46;
}

export function generateRentReceiptPdf(
  payment: Payment,
  lease: Lease | undefined,
  property: Property | undefined,
  tenant: Client | undefined,
  landlord: Client | undefined,
  settings: AgencySettings,
  currency: CurrencyCode
): void {
  const doc = new jsPDF();
  let y = drawPdfHeader(doc, 'Official Rent Payment Receipt', settings);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt Reference: ${payment.reference}`, 16, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issue Date: ${payment.paidDate || new Date().toISOString().slice(0, 10)}`, 140, y);
  y += 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(16, y, 194, y);
  y += 10;

  const lines: [string, string][] = [
    ['Tenant', `${tenant?.name ?? 'Tenant'} (${tenant?.email ?? ''})`],
    ['Landlord / Owner', landlord?.name ?? 'Property Owner'],
    ['Property', `${property?.title ?? 'Residence'} (${property?.referenceCode ?? ''})`],
    ['Address', property?.address ?? 'Dubai, UAE'],
    ['Ejari Contract No.', lease?.ejariNumber ?? 'Registered Ejari'],
    ['Rental Period', payment.periodLabel],
    ['Payment Method', (payment.method ?? 'bank_transfer').replace('_', ' ').toUpperCase()],
    ['Base Monthly Rent', formatMoney(payment.amount, currency)],
    ['Service & Chiller Charges', formatMoney(payment.chargesAmount, currency)],
    ['Total Paid', formatMoney(payment.amount + payment.chargesAmount, currency)],
    ['Status', payment.status.toUpperCase()],
  ];

  lines.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val, 78, y);
    y += 8;
  });

  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(16, y, 194, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Issued electronically by ${settings.name} (${settings.reraOrn}). Valid without wet signature.`,
    16,
    y
  );

  doc.save(`Rent_Receipt_${payment.reference}.pdf`);
}

export function generateLeaseAgreementPdf(
  lease: Lease,
  property: Property | undefined,
  tenant: Client | undefined,
  landlord: Client | undefined,
  settings: AgencySettings,
  currency: CurrencyCode
): void {
  const doc = new jsPDF();
  let y = drawPdfHeader(doc, 'Dubai Unified Tenancy Contract Summary', settings);

  doc.setFontSize(10);
  const rows: [string, string][] = [
    ['Ejari Registration', lease.ejariNumber],
    ['Landlord', `${landlord?.name ?? 'Owner'} · ${landlord?.phone ?? ''}`],
    ['Tenant', `${tenant?.name ?? 'Tenant'} · ${tenant?.phone ?? ''}`],
    ['Premises', `${property?.title ?? ''} (${property?.referenceCode ?? ''})`],
    ['Community & Address', `${property?.address ?? ''}, ${property?.community ?? ''}, Dubai`],
    ['Lease Term', `${lease.startDate} to ${lease.endDate}`],
    ['Monthly Rent', formatMoney(lease.monthlyRent, currency)],
    ['Annual Equivalent', formatMoney(lease.monthlyRent * 12, currency)],
    ['Security Deposit', formatMoney(lease.deposit, currency)],
    ['Monthly Service Charges', formatMoney(lease.monthlyCharges, currency)],
    ['Payment Day / Indexation', `Day ${lease.paymentDay} of month · RERA Index ${lease.indexationPct}%`],
  ];

  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(k, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(v, 76, y);
    y += 8;
  });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Standard RERA Clauses', 16, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const clauses = [
    '1. The Tenant agrees to use the premises solely for residential/designated purpose under Dubai Law No. 26 of 2007.',
    '2. Major structural & MEP maintenance remains the Landlord responsibility; routine upkeep under AED 500 is Tenant responsibility.',
    '3. Ninety (90) days prior written notice is required for non-renewal or RERA rental index adjustment.',
  ];
  clauses.forEach((c) => {
    const split = doc.splitTextToSize(c, 176);
    doc.text(split, 16, y);
    y += split.length * 5 + 3;
  });

  y += 12;
  doc.text('Landlord Signature: ______________________', 16, y);
  doc.text('Tenant Signature: ______________________', 110, y);

  doc.save(`Lease_Agreement_${lease.ejariNumber}.pdf`);
}

export function generateVisitVoucherPdf(
  visit: Visit,
  property: Property | undefined,
  client: Client | undefined,
  agent: Agent | undefined,
  settings: AgencySettings
): void {
  const doc = new jsPDF();
  let y = drawPdfHeader(doc, 'Property Viewing Voucher (Form B)', settings);

  doc.setFontSize(10);
  const rows: [string, string][] = [
    ['Viewing Date & Time', new Date(visit.scheduledAt).toLocaleString()],
    ['Duration', `${visit.durationMinutes} minutes`],
    ['Property', `${property?.title ?? ''} (${property?.referenceCode ?? ''})`],
    ['Address', property?.address ?? 'Dubai, UAE'],
    ['Client / Prospect', `${client?.name ?? ''} · ${client?.phone ?? ''}`],
    ['Assigned RERA Broker', `${agent?.name ?? ''} (${agent?.reraBrn ?? ''})`],
    ['Notes', visit.notes || 'Standard private property tour'],
  ];

  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(k, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(v, 115);
    doc.text(wrapped, 74, y);
    y += wrapped.length * 6 + 4;
  });

  y += 14;
  doc.setFontSize(9);
  doc.text('Client Confirmation Signature: __________________________', 16, y);
  doc.text(`Broker (${agent?.name ?? ''}): __________________________`, 112, y);

  doc.save(`Visit_Voucher_${property?.referenceCode ?? visit.id}.pdf`);
}

export function generateOfferLetterPdf(
  offer: Offer,
  property: Property | undefined,
  client: Client | undefined,
  agent: Agent | undefined,
  settings: AgencySettings,
  currency: CurrencyCode
): void {
  const doc = new jsPDF();
  let y = drawPdfHeader(doc, 'Formal Purchase Offer Letter (Form F Prep)', settings);

  doc.setFontSize(10);
  const rows: [string, string][] = [
    ['Offer Reference', offer.id.toUpperCase()],
    ['Offer Date', offer.createdAt],
    ['Property', `${property?.title ?? ''} (${property?.referenceCode ?? ''})`],
    ['Listed Asking Price', property ? formatMoney(property.price, currency) : '-'],
    ['Offered Purchase Price', formatMoney(offer.amount, currency)],
    ['Offer Status', offer.status.toUpperCase()],
    ['Buyer', `${client?.name ?? ''} (${client?.email ?? ''})`],
    ['Representing Broker', `${agent?.name ?? ''} (${agent?.reraBrn ?? ''})`],
  ];

  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(k, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(v, 76, y);
    y += 8;
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Conditions & Financing Terms:', 16, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const condLines = doc.splitTextToSize(offer.conditions, 176);
  doc.text(condLines, 16, y);

  doc.save(`Offer_Letter_${property?.referenceCode ?? offer.id}.pdf`);
}
