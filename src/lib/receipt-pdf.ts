import { jsPDF } from 'jspdf';
import { PAYMENT_DETAILS } from '@/lib/payment';
import type { BankDetails } from '@/lib/whatsapp';
import type { Order } from '@/lib/orders';

type RGB = [number, number, number];

const WINE: RGB = [88, 11, 27];
const DARK: RGB = [33, 37, 41];
const MUTED: RGB = [125, 133, 144];
const LIGHT: RGB = [246, 247, 249];
const LINE: RGB = [226, 230, 235];
const GREEN: RGB = [22, 163, 74];
const AMBER: RGB = [180, 83, 9];
const WHITE: RGB = [255, 255, 255];

async function fetchAsBase64(url: string, stripPrefix: boolean): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!stripPrefix) return resolve(result);
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatReceiptDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export async function downloadOrderReceipt(
  order: Order,
  bank: BankDetails = PAYMENT_DETAILS
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const right = pageW - margin;
  const contentW = pageW - margin * 2;

  // --- Load assets (logo + a Unicode font that supports the Naira sign) ---
  const [logo, regFont, boldFont] = await Promise.all([
    fetchAsBase64('/logo.png', false),
    fetchAsBase64('/fonts/Roboto-Regular.ttf', true),
    fetchAsBase64('/fonts/Roboto-Bold.ttf', true),
  ]);

  let family = 'helvetica';
  let naira = 'NGN '; // fallback: built-in fonts can't render the ₦ glyph
  if (regFont && boldFont) {
    doc.addFileToVFS('Roboto-Regular.ttf', regFont);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFileToVFS('Roboto-Bold.ttf', boldFont);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    family = 'Roboto';
    naira = '₦'; // ₦
  }

  const money = (n: number) => `${naira}${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
  const text = (weight: 'normal' | 'bold', size: number, color: RGB) => {
    doc.setFont(family, weight);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const fill = (color: RGB) => doc.setFillColor(color[0], color[1], color[2]);

  // ============================ HEADER ============================
  let y = 16;
  // The logo is wide (~2.1:1), so keep its aspect ratio when embedding.
  const brandX = logo ? margin + 28 : margin;
  if (logo) {
    doc.addImage(logo, 'PNG', margin, 15.5, 24, 11.5);
  }
  text('bold', 17, DARK);
  doc.text('724 Restaurant And Bar', brandX, 22);
  text('normal', 8.5, MUTED);
  doc.text('Open 24/7  •  NERDC Rd, Agidingbi, Ikeja, Lagos', brandX, 27.5);

  text('bold', 15, WINE);
  doc.text('RECEIPT', right, 18, { align: 'right' });
  text('bold', 10, DARK);
  doc.text(order.trackingId, right, 24, { align: 'right' });
  text('normal', 8.5, MUTED);
  doc.text(formatReceiptDate(order.createdAt), right, 29, { align: 'right' });

  y = 36;
  fill(WINE);
  doc.rect(margin, y, contentW, 1.1, 'F');
  y += 10;

  // ===================== BILLED TO / ORDER INFO =====================
  const colL = margin;
  const colR = margin + contentW / 2 + 4;

  text('bold', 8, MUTED);
  doc.text('BILLED TO', colL, y);
  doc.text('ORDER INFO', colR, y);
  let yL = y + 6;
  let yR = y + 6;

  text('bold', 10.5, DARK);
  doc.text(order.customer.fullName || '—', colL, yL);
  yL += 5;
  text('normal', 9.5, MUTED);
  if (order.customer.phone) {
    doc.text(order.customer.phone, colL, yL);
    yL += 5;
  }
  if (order.customer.email) {
    doc.text(order.customer.email, colL, yL);
    yL += 5;
  }
  if (order.fulfillment.type === 'delivery') {
    const addr = [order.fulfillment.address, order.fulfillment.area].filter(Boolean).join(', ');
    if (addr) {
      const lines = doc.splitTextToSize(addr, contentW / 2 - 8);
      doc.text(lines, colL, yL);
      yL += lines.length * 5;
    }
  }

  const isDineIn = order.fulfillment.type === 'dine-in';
  const fulfillmentLabel = isDineIn
    ? `Dine-in · Table ${order.fulfillment.tableNumber ?? '—'}`
    : order.fulfillment.type === 'delivery'
      ? 'Delivery'
      : 'Pickup';
  const infoRows: [string, string, RGB][] = [
    ['Fulfillment', fulfillmentLabel, DARK],
    ['Payment method', isDineIn ? 'Pay at table' : 'Bank Transfer', DARK],
    ['Payment status', order.paymentConfirmed ? 'PAID' : 'PENDING', order.paymentConfirmed ? GREEN : AMBER],
  ];
  infoRows.forEach(([label, value, color]) => {
    text('normal', 9.5, MUTED);
    doc.text(label, colR, yR);
    text('bold', 9.5, color);
    doc.text(value, right, yR, { align: 'right' });
    yR += 5.5;
  });

  y = Math.max(yL, yR) + 6;

  // ============================ ITEMS TABLE ============================
  const qtyRight = margin + contentW * 0.62;
  const unitRight = margin + contentW * 0.81;
  const amountRight = right - 2;
  const nameX = margin + 3;
  const nameW = qtyRight - nameX - 14;

  const drawTableHeader = () => {
    fill(DARK);
    doc.rect(margin, y, contentW, 9, 'F');
    text('bold', 8, WHITE);
    doc.text('ITEM', nameX, y + 5.9);
    doc.text('QTY', qtyRight, y + 5.9, { align: 'right' });
    doc.text('UNIT PRICE', unitRight, y + 5.9, { align: 'right' });
    doc.text('AMOUNT', amountRight, y + 5.9, { align: 'right' });
    y += 9;
  };

  drawTableHeader();

  order.items.forEach((item, idx) => {
    const addons = Array.isArray(item.addons) ? item.addons : [];
    const nameText = addons.length
      ? `${item.name}\n+ ${addons.map((a) => a.name).join(', ')}`
      : item.name;
    const lines = doc.splitTextToSize(nameText, nameW) as string[];
    const rowH = Math.max(8.5, 3.4 + lines.length * 4.6);

    if (y + rowH > pageH - 60) {
      doc.addPage();
      y = margin;
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      fill(LIGHT);
      doc.rect(margin, y, contentW, rowH, 'F');
    }

    const baseline = y + 5.8;
    text('normal', 9.5, DARK);
    doc.text(lines, nameX, baseline);
    doc.text(String(item.qty), qtyRight, baseline, { align: 'right' });
    doc.text(money(item.price), unitRight, baseline, { align: 'right' });
    text('bold', 9.5, DARK);
    doc.text(money(item.price * item.qty), amountRight, baseline, { align: 'right' });

    y += rowH;
  });

  // bottom border of the table
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, right, y);
  y += 8;

  // ============================ TOTALS ============================
  const totalsLabelX = margin + contentW * 0.55;
  const totalRow = (label: string, value: string, bold: boolean, color: RGB, size: number) => {
    text(bold ? 'bold' : 'normal', size, bold ? color : MUTED);
    doc.text(label, totalsLabelX, y);
    text('bold', size, color);
    doc.text(value, amountRight, y, { align: 'right' });
  };

  totalRow('Subtotal', money(order.subtotal), false, DARK, 10);
  y += 5;
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.line(totalsLabelX, y, amountRight, y);
  y += 7;
  totalRow('TOTAL', money(order.total), true, WINE, 13);
  y += 14;

  // ===================== PAYMENT DETAILS BOX =====================
  // Dine-in guests settle at the table, so bank details would only confuse.
  if (!isDineIn) {
    if (y > pageH - 50) {
      doc.addPage();
      y = margin;
    }
    const boxH = 24;
    fill(LIGHT);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.roundedRect(margin, y, contentW, boxH, 2.5, 2.5, 'FD');
    text('bold', 8, MUTED);
    doc.text('PAYMENT DETAILS', margin + 5, y + 7);
    text('bold', 11, DARK);
    doc.text(bank.bank, margin + 5, y + 14.5);
    text('normal', 10, DARK);
    doc.text(bank.accountNumber, margin + 5, y + 20);
    text('normal', 9.5, MUTED);
    doc.text(bank.accountName, right - 5, y + 20, { align: 'right' });
    y += boxH + 12;
  } else if (y > pageH - 30) {
    doc.addPage();
    y = margin;
  }

  // ============================ FOOTER ============================
  text('bold', 10, DARK);
  doc.text('Thank you for ordering from 724 Restaurant And Bar!', pageW / 2, y, { align: 'center' });
  y += 5.5;
  text('normal', 8.5, MUTED);
  doc.text('Keep this receipt for your records. For enquiries, message us on WhatsApp.', pageW / 2, y, {
    align: 'center',
  });

  doc.save(`724-receipt-${order.trackingId}.pdf`);
}
