/** * Invoice Viewer Component * Displays invoice details in a printable format */ 'use client';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Download, Printer, ArrowLeft, FileText } from 'lucide-react';
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
export interface InvoiceViewerProps {
  invoice: {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    items: InvoiceItem[];
    customer?: { name: string; email: string; address?: string };
    company?: { name: string; address: string; taxId?: string };
  };
  onBack?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  className?: string;
}
export default function InvoiceViewer({
  invoice,
  onBack,
  onDownload,
  onPrint,
  className,
}: InvoiceViewerProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'success' as const,
      pending: 'warning' as const,
      overdue: 'error' as const,
      cancelled: 'default' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };
  return (
    <div className={clsx('space-y-6', className)}>
      {' '}
      {/* Header Actions */}{' '}
      <div className="flex items-center justify-between">
        {' '}
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <ArrowLeft className="w-4 h-4" /> Back to Invoices{' '}
            </span>{' '}
          </Button>
        )}{' '}
        <div className="flex items-center gap-2">
          {' '}
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <Download className="w-4 h-4" /> Download PDF{' '}
              </span>{' '}
            </Button>
          )}{' '}
          <Button variant="primary" onClick={handlePrint}>
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <Printer className="w-4 h-4" /> Print{' '}
            </span>{' '}
          </Button>{' '}
        </div>{' '}
      </div>{' '}
      {/* Invoice Card */}{' '}
      <Card className="bg-background print:shadow-none">
        {' '}
        <div className="space-y-8">
          {' '}
          {/* Invoice Header */}{' '}
          <div className="flex items-start justify-between border-b border-border pb-6">
            {' '}
            <div>
              {' '}
              <div className="flex items-center gap-2 mb-2">
                {' '}
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />{' '}
                <h2 className="text-2xl font-bold text-foreground">Invoice</h2>{' '}
              </div>{' '}
              <div className="text-sm text-muted-foreground"> Invoice #{invoice.number} </div>{' '}
            </div>{' '}
            <div className="text-right"> {getStatusBadge(invoice.status)} </div>{' '}
          </div>{' '}
          {/* Company & Customer Info */}{' '}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {' '}
            <div>
              {' '}
              <h3 className="text-sm font-semibold text-foreground mb-2"> From </h3>{' '}
              {invoice.company ? (
                <div className="text-sm text-foreground">
                  {' '}
                  <div className="font-medium">{invoice.company.name}</div>{' '}
                  <div className="mt-1 whitespace-pre-line">{invoice.company.address}</div>{' '}
                  {invoice.company.taxId && (
                    <div className="mt-1">Tax ID: {invoice.company.taxId}</div>
                  )}{' '}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Company information</div>
              )}{' '}
            </div>{' '}
            <div>
              {' '}
              <h3 className="text-sm font-semibold text-foreground mb-2"> To </h3>{' '}
              {invoice.customer ? (
                <div className="text-sm text-foreground">
                  {' '}
                  <div className="font-medium">{invoice.customer.name}</div>{' '}
                  <div className="mt-1">{invoice.customer.email}</div>{' '}
                  {invoice.customer.address && (
                    <div className="mt-1 whitespace-pre-line">{invoice.customer.address}</div>
                  )}{' '}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Customer information</div>
              )}{' '}
            </div>{' '}
          </div>{' '}
          {/* Invoice Dates */}{' '}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {' '}
            <div>
              {' '}
              <span className="text-muted-foreground">Invoice Date:</span>{' '}
              <span className="ml-2 font-medium text-foreground">
                {' '}
                {new Date(invoice.date).toLocaleDateString()}{' '}
              </span>{' '}
            </div>{' '}
            <div>
              {' '}
              <span className="text-muted-foreground">Due Date:</span>{' '}
              <span className="ml-2 font-medium text-foreground">
                {' '}
                {new Date(invoice.dueDate).toLocaleDateString()}{' '}
              </span>{' '}
            </div>{' '}
          </div>{' '}
          {/* Invoice Items */}{' '}
          <div>
            {' '}
            <table className="w-full">
              {' '}
              <thead>
                {' '}
                <tr className="border-b border-border">
                  {' '}
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    {' '}
                    Description{' '}
                  </th>{' '}
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                    {' '}
                    Quantity{' '}
                  </th>{' '}
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                    {' '}
                    Unit Price{' '}
                  </th>{' '}
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                    {' '}
                    Total{' '}
                  </th>{' '}
                </tr>{' '}
              </thead>{' '}
              <tbody>
                {' '}
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-border">
                    {' '}
                    <td className="py-3 px-4 text-sm text-foreground"> {item.description} </td>{' '}
                    <td className="py-3 px-4 text-sm text-right text-foreground">
                      {' '}
                      {item.quantity}{' '}
                    </td>{' '}
                    <td className="py-3 px-4 text-sm text-right text-foreground">
                      {' '}
                      {invoice.currency} {item.unitPrice.toFixed(2)}{' '}
                    </td>{' '}
                    <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                      {' '}
                      {invoice.currency} {item.total.toFixed(2)}{' '}
                    </td>{' '}
                  </tr>
                ))}{' '}
              </tbody>{' '}
            </table>{' '}
          </div>{' '}
          {/* Invoice Totals */}{' '}
          <div className="flex justify-end">
            {' '}
            <div className="w-full md:w-64 space-y-2">
              {' '}
              <div className="flex justify-between text-sm text-foreground">
                {' '}
                <span>Subtotal:</span>{' '}
                <span>
                  {invoice.currency} {invoice.subtotal.toFixed(2)}
                </span>{' '}
              </div>{' '}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm text-foreground">
                  {' '}
                  <span>Tax:</span>{' '}
                  <span>
                    {invoice.currency} {invoice.tax.toFixed(2)}
                  </span>{' '}
                </div>
              )}{' '}
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                {' '}
                <span>Total:</span>{' '}
                <span>
                  {invoice.currency} {invoice.total.toFixed(2)}
                </span>{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
