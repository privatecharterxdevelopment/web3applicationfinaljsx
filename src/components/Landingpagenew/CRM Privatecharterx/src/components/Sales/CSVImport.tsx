import React, { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, FileText, Download, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Papa from 'papaparse';

interface CSVImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface MappedField {
  csvField: string;
  dbField: string;
}

export const CSVImport: React.FC<CSVImportProps> = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'import'>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<MappedField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dbFields = [
    { name: 'company_name', label: 'Company Name', required: true },
    { name: 'contact_name', label: 'Contact Name', required: true },
    { name: 'email', label: 'Email', required: true },
    { name: 'phone', label: 'Phone', required: false },
    { name: 'website', label: 'Website', required: false },
    { name: 'business_type', label: 'Business Type', required: true },
    { name: 'source', label: 'Lead Source', required: false },
    { name: 'notes', label: 'Notes', required: false }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCsvData(data);
        
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          setCsvHeaders(headers);
          
          // Auto-map fields based on similar names
          const initialMappings: MappedField[] = [];
          
          dbFields.forEach(dbField => {
            const matchingHeader = headers.find(header => 
              header.toLowerCase().includes(dbField.name.toLowerCase()) ||
              dbField.name.toLowerCase().includes(header.toLowerCase())
            );
            
            if (matchingHeader) {
              initialMappings.push({
                csvField: matchingHeader,
                dbField: dbField.name
              });
            }
          });
          
          setFieldMappings(initialMappings);
          setStep('map');
        }
      },
      error: (error) => {
        showError('Error', `Failed to parse CSV file: ${error.message}`);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as CSVRow[];
            setCsvData(data);
            
            if (data.length > 0) {
              const headers = Object.keys(data[0]);
              setCsvHeaders(headers);
              
              // Auto-map fields based on similar names
              const initialMappings: MappedField[] = [];
              
              dbFields.forEach(dbField => {
                const matchingHeader = headers.find(header => 
                  header.toLowerCase().includes(dbField.name.toLowerCase()) ||
                  dbField.name.toLowerCase().includes(header.toLowerCase())
                );
                
                if (matchingHeader) {
                  initialMappings.push({
                    csvField: matchingHeader,
                    dbField: dbField.name
                  });
                }
              });
              
              setFieldMappings(initialMappings);
              setStep('map');
            }
          },
          error: (error) => {
            showError('Error', `Failed to parse CSV file: ${error.message}`);
          }
        });
      } else {
        showError('Error', 'Please upload a CSV file');
      }
    }
  };

  const updateFieldMapping = (csvField: string, dbField: string) => {
    // Remove any existing mapping for this dbField
    const filteredMappings = fieldMappings.filter(mapping => mapping.dbField !== dbField);
    
    // Add the new mapping
    setFieldMappings([...filteredMappings, { csvField, dbField }]);
  };

  const getMappedValue = (row: CSVRow, dbField: string): string => {
    const mapping = fieldMappings.find(m => m.dbField === dbField);
    if (!mapping) return '';
    return row[mapping.csvField] || '';
  };

  const validateMappings = () => {
    const requiredFields = dbFields.filter(field => field.required).map(field => field.name);
    const mappedRequiredFields = fieldMappings
      .filter(mapping => requiredFields.includes(mapping.dbField))
      .map(mapping => mapping.dbField);
    
    return requiredFields.every(field => mappedRequiredFields.includes(field));
  };

  const importLeads = async () => {
    if (!user?.id) {
      showError('Error', 'User not found');
      return;
    }

    try {
      setIsLoading(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const results = {
        total: csvData.length,
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process in batches of 10 to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        const leadsToInsert = batch.map(row => {
          return {
            company_name: getMappedValue(row, 'company_name'),
            contact_name: getMappedValue(row, 'contact_name'),
            email: getMappedValue(row, 'email'),
            phone: getMappedValue(row, 'phone') || null,
            website: getMappedValue(row, 'website') || null,
            business_type: getMappedValue(row, 'business_type'),
            status: 'pending',
            deal_status: 'new',
            created_by: systemUser.id,
            source: 'CSV Import',
            notes: getMappedValue(row, 'notes') || null
          };
        });

        const { data, error } = await supabase
          .from('partners')
          .insert(leadsToInsert)
          .select();

        if (error) {
          console.error('Error importing batch:', error);
          results.failed += batch.length;
          results.errors.push(`Batch ${i/batchSize + 1} failed: ${error.message}`);
        } else {
          results.success += data.length;
        }
      }

      setImportResults(results);
      setStep('import');
      
      if (results.success > 0) {
        showSuccess('Success', `Successfully imported ${results.success} leads`);
      }
      
      if (results.failed > 0) {
        showError('Warning', `Failed to import ${results.failed} leads`);
      }
    } catch (err: any) {
      console.error('Error importing leads:', err);
      showError('Error', err.message || 'Failed to import leads');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const headers = ['company_name', 'contact_name', 'email', 'phone', 'website', 'business_type', 'notes'];
    const sampleData = [
      {
        company_name: 'Acme Corporation',
        contact_name: 'John Doe',
        email: 'john@acme.com',
        phone: '+1 555-123-4567',
        website: 'https://acme.com',
        business_type: 'Technology',
        notes: 'Met at the aviation expo'
      },
      {
        company_name: 'Globex Inc',
        contact_name: 'Jane Smith',
        email: 'jane@globex.com',
        phone: '+1 555-987-6543',
        website: 'https://globex.com',
        business_type: 'Finance',
        notes: 'Interested in private jet services'
      }
    ];
    
    const csv = Papa.unparse({
      fields: headers,
      data: sampleData
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Import Leads from CSV</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Step Indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'upload' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-xs mt-1">Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'map' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-xs mt-1">Map Fields</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-xs mt-1">Preview</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'import' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                4
              </div>
              <span className="text-xs mt-1">Import</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Step 1: Upload CSV */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Upload CSV File</h3>
                <p className="text-gray-500 mb-4">Drag and drop your CSV file here, or click to browse</p>
                <button
                  type="button"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Select File
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium">CSV File Requirements</p>
                    <ul className="text-blue-600 mt-1 text-sm list-disc list-inside">
                      <li>File must be in CSV format</li>
                      <li>First row should contain column headers</li>
                      <li>Required fields: Company Name, Contact Name, Email, Business Type</li>
                      <li>Optional fields: Phone, Website, Notes</li>
                    </ul>
                    <button 
                      onClick={downloadSampleCSV}
                      className="mt-2 text-blue-700 hover:text-blue-900 font-medium flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Sample CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Map Fields */}
          {step === 'map' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium">Map CSV Fields to Database Fields</p>
                    <p className="text-blue-600 mt-1 text-sm">
                      Select which CSV column corresponds to each database field. Required fields are marked with an asterisk (*).
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {dbFields.map((field) => (
                  <div key={field.name} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                    </div>
                    <div className="w-1/3 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="w-1/3">
                      <select
                        value={fieldMappings.find(m => m.dbField === field.name)?.csvField || ''}
                        onChange={(e) => updateFieldMapping(e.target.value, field.name)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required={field.required}
                      >
                        <option value="">-- Select CSV Field --</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              
              {!validateMappings() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-yellow-700 font-medium">Missing Required Fields</p>
                      <p className="text-yellow-600 mt-1 text-sm">
                        Please map all required fields before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Preview Data */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium">Preview Import Data</p>
                    <p className="text-blue-600 mt-1 text-sm">
                      Review the data before importing. Showing first {Math.min(5, csvData.length)} of {csvData.length} records.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {dbFields.map((field) => (
                        <th key={field.name} className="text-left p-2 text-xs font-medium text-gray-700 border border-gray-200">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-gray-200">
                        {dbFields.map((field) => (
                          <td key={field.name} className="p-2 text-xs border border-gray-200">
                            {getMappedValue(row, field.name)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-yellow-700 font-medium">Import Notes</p>
                    <ul className="text-yellow-600 mt-1 text-sm list-disc list-inside">
                      <li>All leads will be imported with "New" status</li>
                      <li>Duplicate emails may result in multiple lead entries</li>
                      <li>The import process may take a few moments for large files</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Import Results */}
          {step === 'import' && (
            <div className="space-y-6">
              <div className={`border rounded-lg p-6 ${
                importResults.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-center mb-4">
                  {importResults.failed > 0 ? (
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-center mb-4">
                  {importResults.failed > 0 ? 'Import Completed with Warnings' : 'Import Completed Successfully'}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-black">{importResults.total}</p>
                    <p className="text-sm text-gray-500">Total Records</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                    <p className="text-sm text-gray-500">Successful</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                </div>
                
                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="font-medium text-red-700 mb-2">Errors:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {importResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-center">
                  <button
                    onClick={onImportComplete}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    View Imported Leads
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-between">
          {step !== 'upload' && step !== 'import' && (
            <button
              onClick={() => setStep(step === 'map' ? 'upload' : step === 'preview' ? 'map' : 'upload')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          
          {step === 'import' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
          
          <div>
            {step === 'map' && (
              <button
                onClick={() => setStep('preview')}
                disabled={!validateMappings()}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Preview Data
              </button>
            )}
            
            {step === 'preview' && (
              <button
                onClick={importLeads}
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Leads</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};