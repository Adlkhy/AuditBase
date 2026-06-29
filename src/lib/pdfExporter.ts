import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AuditResult } from '../types';

export async function exportPDF(
  element: HTMLElement,
  result: AuditResult,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#09090B',
    scale: 1.5,
    useCORS: true,
    logging: false,
  });

  const imgData  = canvas.toDataURL('image/png');
  const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW     = pdf.internal.pageSize.getWidth();
  const pdfH     = pdf.internal.pageSize.getHeight();
  const imgH     = (canvas.height * pdfW) / canvas.width;

  let yOffset = 0;
  while (yOffset < imgH) {
    if (yOffset > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, imgH);
    yOffset += pdfH;
  }

  const slug = result.projectRef || 'project';
  const date = new Date(result.timestamp).toISOString().split('T')[0];
  pdf.save(`auditbase-${slug}-${date}.pdf`);
}
