'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';
import { formatCurrency } from '@/app/lib/utils/currency';

async function downloadQuotationPDF(req) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const q = req.quotation;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const m = 15;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(22, 101, 52); // green-800
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageW / 2, 12, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('Material Requisition System', pageW / 2, 19, { align: 'center' });
  doc.text(`Ref #: ${req.id.slice(0, 8).toUpperCase()}`, pageW / 2, 24, { align: 'center' });
  doc.setTextColor(0);

  // ── Meta block ──────────────────────────────────────────────────────────────
  let y = 36;
  const col2 = pageW / 2 + 5;

  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('FROM (Hardware Shop)', m, y);
  doc.text('TO (Contractor)', col2, y);
  doc.setFont('helvetica', 'normal');
  y += 5;

  const shopName = req.shop?.business_name || req.assigned_shop_name || '—';
  const shopEmail = req.shop?.email || '—';
  const shopPhone = req.shop?.phone || '';
  doc.text(shopName, m, y);
  doc.text(req.contractor_name || '—', col2, y); y += 4;
  doc.text(shopEmail, m, y); y += 4;
  if (shopPhone) { doc.text(shopPhone, m, y); y += 4; }

  y += 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Date Issued:', m, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(q.submitted_at || Date.now()).toLocaleDateString('en-PG', { day: '2-digit', month: 'long', year: 'numeric' }), m + 22, y);

  if (q.valid_until) {
    doc.setFont('helvetica', 'bold');
    doc.text('Valid Until:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(q.valid_until).toLocaleDateString('en-PG', { day: '2-digit', month: 'long', year: 'numeric' }), col2 + 22, y);
  }
  y += 8;

  // ── Requested items note ─────────────────────────────────────────────────
  doc.setFontSize(9); doc.setFont('helvetica', 'bolditalic');
  doc.text('Quotation for Requested Materials', pageW / 2, y, { align: 'center' });
  y += 4;

  // ── Items table ──────────────────────────────────────────────────────────────
  const rows = (q.items || []).map((item, i) => [
    i + 1,
    item.name || item.product_name || '—',
    item.description || '—',
    item.quantity,
    formatCurrency(item.unit_price || 0),
    formatCurrency(item.subtotal || 0),
    formatCurrency(item.gst || 0),
    formatCurrency(item.total || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Description', 'Qty', 'Unit Price', 'Subtotal', 'GST 10%', 'Total (incl. GST)']],
    body: rows,
    margin: { left: m, right: m },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  // ── Totals summary ───────────────────────────────────────────────────────────
  const summaryX = pageW - m - 70;
  const valueX = pageW - m;

  doc.setFontSize(8);
  const drawSummaryRow = (label, value, bold = false) => {
    if (bold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
    doc.text(label, summaryX, y);
    doc.text(value, valueX, y, { align: 'right' });
    y += 5;
  };

  doc.setDrawColor(200);
  doc.line(summaryX - 2, y - 2, valueX, y - 2);
  drawSummaryRow('Subtotal (excl. GST):', formatCurrency(q.subtotal || 0));
  drawSummaryRow('GST (10% — PNG IRC):', formatCurrency(q.gst_amount || 0));
  doc.line(summaryX - 2, y - 2, valueX, y - 2);
  drawSummaryRow('TOTAL (incl. GST):', formatCurrency(q.total_amount || 0), true);

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (q.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Notes / Terms:', m, y); y += 4;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(q.notes, pageW - m * 2);
    doc.text(lines, m, y); y += lines.length * 4;
  }

  // ── Signature block ───────────────────────────────────────────────────────────
  y = Math.max(y + 10, 245);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  [[`Authorised by (Shop):`, m], [`Accepted by (Contractor):`, pageW / 2 + 5]].forEach(([label, x]) => {
    doc.text(label, x, y);
    doc.line(x, y + 8, x + 75, y + 8);
    doc.text('Signature / Date', x, y + 12);
  });

  // ── Footer ────────────────────────────────────────────────────────────────────
  doc.setFontSize(7); doc.setTextColor(150);
  doc.text('Material Requisition System — ' + new Date().toISOString(), pageW / 2, 290, { align: 'center' });

  doc.save(`quotation-${req.id.slice(0, 8)}.pdf`);
}

function QuotedCard({ req }) {
  const [downloading, setDownloading] = useState(false);
  const q = req.quotation;

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadQuotationPDF(req); }
    finally { setDownloading(false); }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-purple-100 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-purple-50">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">#{req.id.slice(0, 8)}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Quoted</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()}</span>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 transition disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a9 9 0 0118 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1z" />
            </svg>
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Shop info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">From Shop</p>
            <p className="text-sm font-medium text-gray-800">{req.shop?.business_name || req.assigned_shop_name || '—'}</p>
            {req.shop?.email && <p className="text-xs text-gray-500">{req.shop.email}</p>}
            {req.shop?.phone && <p className="text-xs text-gray-500">{req.shop.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Quoted On</p>
            <p className="text-sm text-gray-700">{q?.submitted_at ? new Date(q.submitted_at).toLocaleDateString('en-PG') : '—'}</p>
            {q?.valid_until && (
              <>
                <p className="text-xs text-gray-500 uppercase font-semibold mt-1 mb-0.5">Valid Until</p>
                <p className="text-sm text-gray-700">{new Date(q.valid_until).toLocaleDateString('en-PG')}</p>
              </>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="text-left pb-2">Item</th>
                <th className="text-left pb-2">Description</th>
                <th className="text-center pb-2 w-12">Qty</th>
                <th className="text-right pb-2 w-24">Unit Price</th>
                <th className="text-right pb-2 w-24">Subtotal</th>
                <th className="text-right pb-2 w-20">GST 10%</th>
                <th className="text-right pb-2 w-28">Total (incl. GST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(q?.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 text-gray-800 font-medium">{item.name || item.product_name || '—'}</td>
                  <td className="py-2 text-gray-500 text-xs">{item.description || '—'}</td>
                  <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-2 text-right text-gray-600">{formatCurrency(item.unit_price || 0)}</td>
                  <td className="py-2 text-right text-gray-600">{formatCurrency(item.subtotal || 0)}</td>
                  <td className="py-2 text-right text-orange-600">{formatCurrency(item.gst || 0)}</td>
                  <td className="py-2 text-right text-gray-800 font-semibold">{formatCurrency(item.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-3 space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (excl. GST)</span>
            <span>{formatCurrency(q?.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>GST (10% — PNG IRC)</span>
            <span>{formatCurrency(q?.gst_amount || 0)}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-bold text-base border-t border-gray-300 pt-2">
            <span>Total (incl. GST)</span>
            <span className="text-green-700">{formatCurrency(q?.total_amount || 0)}</span>
          </div>
        </div>

        {/* Notes */}
        {q?.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600 border border-gray-200">
            <span className="font-semibold text-gray-700">Notes: </span>{q.notes}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuotedRequestsPage() {
  const [user, setUser] = useState(null);
  const [quoted, setQuoted] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuoted = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requisitions?status=quoted&limit=50');
      const data = await res.json();
      setQuoted((data.requisitions || []).filter((r) => r.quotation));
    } catch (_) {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (user) fetchQuoted();
  }, [user, fetchQuoted]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <a href="/requisitions" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                My Requisitions
              </a>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quoted Requests</h1>
            <p className="text-gray-500 text-sm mt-1">
              Quotations submitted by shops for your requests — download each as a PDF
            </p>
          </div>
          {quoted.length > 0 && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
              {quoted.length} quotation{quoted.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Loading quotations...</div>
        ) : quoted.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No quotations yet</h3>
            <p className="text-gray-500 text-sm">Once a shop submits a quotation for your request, it will appear here.</p>
            <a href="/requisitions" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all requisitions →
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {quoted.map((req) => (
              <QuotedCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
