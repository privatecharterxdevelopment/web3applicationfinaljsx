import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Save, 
  X, 
  Upload, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface InvoiceGeneratorProps {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  orderNumber?: string;
  onClose: () => void;
  onSave: (fileUrl: string) => void;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  invoiceId,
  invoiceNumber,
  clientName,
  clientEmail,
  clientCompany,
  amount,
  taxAmount,
  totalAmount,
  currency,
  issueDate,
  dueDate,
  notes,
  orderNumber,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const generateInvoicePDF = async () => {
    setIsGenerating(true);
    
    try {
      // In a real implementation, this would generate a PDF using a library
      // For this demo, we'll simulate PDF generation with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a simple HTML representation of the invoice
      const invoiceHtml = `
        <html>
          <head>
            <title>Invoice ${invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .company-info { text-align: right; }
              .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .invoice-details { margin-bottom: 30px; }
              .client-info { margin-bottom: 30px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              .items-table th { background-color: #f2f2f2; }
              .total-row { font-weight: bold; }
              .notes { margin-top: 30px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div>
                <div class="invoice-title">INVOICE</div>
                <div>PrivatecharterX Ltd</div>
                <div>123 Aviation Way</div>
                <div>Zurich, Switzerland</div>
                <div>info@privatecharterx.com</div>
              </div>
              <div class="company-info">
                <div><strong>Invoice Number:</strong> ${invoiceNumber}</div>
                <div><strong>Issue Date:</strong> ${new Date(issueDate).toLocaleDateString()}</div>
                <div><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</div>
                ${orderNumber ? `<div><strong>Order Number:</strong> ${orderNumber}</div>` : ''}
              </div>
            </div>
            
            <div class="client-info">
              <div><strong>Bill To:</strong></div>
              <div>${clientName}</div>
              ${clientCompany ? `<div>${clientCompany}</div>` : ''}
              <div>${clientEmail}</div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Services</td>
                  <td>${currency} ${amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Tax (8.1%)</td>
                  <td>${currency} ${taxAmount.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td>${currency} ${totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            ${notes ? `<div class="notes"><strong>Notes:</strong><br>${notes}</div>` : ''}
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>PrivatecharterX Ltd | Swiss Business Registry: CHE-123.456.789 | VAT: CHE-123.456.789 MWST</p>
              <p>Bank: Credit Suisse | IBAN: CH93 0076 2011 6238 5295 7 | BIC/SWIFT: CRESCHZZ80A</p>
            </div>
          </body>
        </html>
      `;
      
      // Convert HTML to Blob (in a real app, this would be a PDF)
      const blob = new Blob([invoiceHtml], { type: 'text/html' });
      const file = new File([blob], `invoice_${invoiceNumber}.html`, { type: 'text/html' });
      
      setPdfFile(file);
      showSuccess('Success', 'Invoice generated successfully');
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      showError('Error', 'Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadInvoice = async () => {
    if (!pdfFile || !user?.id) return;
    
    try {
      setIsUploading(true);
      
      // Upload file to Supabase Storage
      const fileName = `invoice_${invoiceNumber}_${Date.now()}.pdf`;
      const filePath = `invoices/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, pdfFile);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);
      
      // Update invoice with file URL
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ file_url: publicUrl })
        .eq('id', invoiceId);
      
      if (updateError) throw updateError;
      
      showSuccess('Success', 'Invoice uploaded successfully');
      onSave(publicUrl);
    } catch (err: any) {
      console.error('Error uploading invoice:', err);
      showError('Error', 'Failed to upload invoice');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadInvoice = () => {
    if (!pdfFile) return;
    
    const url = URL.createObjectURL(pdfFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printInvoice = () => {
    if (!pdfFile) return;
    
    const url = URL.createObjectURL(pdfFile);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Invoice Generator</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-black mb-3">Invoice Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-medium">{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{clientName}</p>
                <p className="text-xs text-gray-500">{clientEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{currency} {totalAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Tax: {currency} {taxAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dates</p>
                <p className="text-xs">Issue: {new Date(issueDate).toLocaleDateString()}</p>
                <p className="text-xs">Due: {new Date(dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {!pdfFile ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Generate the invoice PDF or upload an existing file</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={generateInvoicePDF}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate PDF</span>
                    </>
                  )}
                </button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPdfFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 w-full"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-green-700 font-medium">Invoice file ready</p>
                  <p className="text-green-600 mt-1 text-sm">
                    Your invoice has been generated and is ready to be saved, downloaded, or printed.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={uploadInvoice}
                  disabled={isUploading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save to System</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={downloadInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={printInvoice}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};