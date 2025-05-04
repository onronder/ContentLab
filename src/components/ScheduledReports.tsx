import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { PlusIcon, TrashIcon, RefreshIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';

// Report types available in the system
const REPORT_TYPES = [
  { id: 'content_gaps', name: 'Content Gaps Report' },
  { id: 'performance', name: 'Performance Report' },
  { id: 'competitor_analysis', name: 'Competitor Analysis Report' },
  { id: 'custom', name: 'Custom Report' }
];

// Frequency options for scheduling
const FREQUENCIES = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' }
];

// Define interfaces for parameter types
interface OptionType {
  value: string;
  label: string;
}

interface BaseParameterType {
  id: string;
  name: string;
  required: boolean;
}

interface SelectParameterType extends BaseParameterType {
  type: 'select';
  options: OptionType[];
  defaultValue?: string;
}

interface TextParameterType extends BaseParameterType {
  type: 'text';
  defaultValue?: string;
}

interface NumberParameterType extends BaseParameterType {
  type: 'number';
  defaultValue?: number;
}

type ParameterType = SelectParameterType | TextParameterType | NumberParameterType;

// Define report interface
interface Report {
  id: string;
  name: string;
  description: string;
  report_type: string;
  frequency: string;
  recipient_emails: string[];
  parameters: Record<string, unknown>;
  created_at: string;
  is_active: boolean;
  next_run: string | null;
  last_run: string | null;
  last_execution?: {
    status?: string;
    report_url?: string;
  };
}

// Define parameters record type
type ParametersRecord = Record<string, string | number | boolean>;

// Report parameter definitions by type
const REPORT_PARAMETERS: Record<string, ParameterType[]> = {
  content_gaps: [
    { id: 'timeframe', name: 'Timeframe', type: 'select', options: [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days' },
    ], required: false },
    { id: 'limit', name: 'Results Limit', type: 'number', defaultValue: 20, required: false }
  ],
  performance: [
    { id: 'timeRange', name: 'Time Range', type: 'select', options: [
      { value: '1d', label: 'Last 24 hours' },
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
    ], required: false }
  ],
  competitor_analysis: [
    { id: 'siteUrl', name: 'Your Website URL', type: 'text', required: true }
  ],
  custom: [
    { id: 'query', name: 'Query Name', type: 'select', options: [
      { value: 'content_topic_popularity', label: 'Content Topic Popularity' },
      { value: 'keyword_performance', label: 'Keyword Performance' },
      { value: 'competitor_overlap', label: 'Competitor Content Overlap' },
    ], required: false },
    { id: 'format', name: 'Export Format', type: 'select', options: [
      { value: 'json', label: 'JSON' },
      { value: 'csv', label: 'CSV' },
    ], required: false }
  ]
};

export default function ScheduledReports() {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // New report form state
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    report_type: REPORT_TYPES[0].id,
    frequency: FREQUENCIES[0].id,
    recipient_emails: [''],
    parameters: {} as ParametersRecord
  });
  
  // Fetch reports from the database
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);
  
  // Fetch scheduled reports on component mount
  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, fetchReports]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewReport(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle parameter input changes
  const handleParameterChange = (paramId: string, value: string | number | boolean) => {
    setNewReport(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramId]: value
      }
    }));
  };
  
  // Handle email input changes
  const handleEmailChange = (index: number, value: string) => {
    const emails = [...newReport.recipient_emails];
    emails[index] = value;
    setNewReport(prev => ({ ...prev, recipient_emails: emails }));
  };
  
  // Add a new email input field
  const addEmailField = () => {
    setNewReport(prev => ({
      ...prev,
      recipient_emails: [...prev.recipient_emails, '']
    }));
  };
  
  // Remove an email input field
  const removeEmailField = (index: number) => {
    if (newReport.recipient_emails.length <= 1) return;
    
    const emails = [...newReport.recipient_emails];
    emails.splice(index, 1);
    setNewReport(prev => ({ ...prev, recipient_emails: emails }));
  };
  
  // Handle report type change
  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reportType = e.target.value;
    
    // Reset parameters when report type changes
    setNewReport(prev => ({
      ...prev,
      report_type: reportType,
      parameters: {}
    }));
  };
  
  // Create a new scheduled report
  const createReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    
    try {
      // Validate required fields
      if (!newReport.name.trim()) {
        throw new Error('Report name is required');
      }
      
      // Validate parameters based on report type
      const requiredParams = REPORT_PARAMETERS[newReport.report_type as keyof typeof REPORT_PARAMETERS]
        .filter(param => param.required);
      
      for (const param of requiredParams) {
        if (!newReport.parameters[param.id]) {
          throw new Error(`${param.name} is required`);
        }
      }
      
      // Filter out empty emails
      const emails = newReport.recipient_emails.filter(email => email.trim());
      if (emails.length === 0) {
        throw new Error('At least one recipient email is required');
      }
      
      // Call RPC function to schedule the report
      const { error } = await supabase.rpc('schedule_report', {
        p_name: newReport.name,
        p_description: newReport.description,
        p_report_type: newReport.report_type,
        p_frequency: newReport.frequency,
        p_recipient_emails: emails,
        p_parameters: newReport.parameters
      });
      
      if (error) throw error;
      
      // Reset form and reload reports
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Error creating report:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to create report');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Delete a scheduled report
  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;
    
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw error;
      
      // Reload reports after deletion
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };
  
  // Toggle a report's active status
  const toggleReportStatus = async (reportId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !currentStatus })
        .eq('id', reportId);
      
      if (error) throw error;
      
      // Reload reports after update
      fetchReports();
    } catch (error) {
      console.error('Error toggling report status:', error);
    }
  };
  
  // Reset the new report form
  const resetForm = () => {
    setNewReport({
      name: '',
      description: '',
      report_type: REPORT_TYPES[0].id,
      frequency: FREQUENCIES[0].id,
      recipient_emails: [''],
      parameters: {}
    });
    setShowNewReportForm(false);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Render parameter inputs based on report type
  const renderParameterInputs = () => {
    const params = REPORT_PARAMETERS[newReport.report_type as keyof typeof REPORT_PARAMETERS] || [];
    
    return params.map(param => {
      const value = newReport.parameters[param.id] || (param.defaultValue ?? '');
      
      switch (param.type) {
        case 'text':
          return (
            <div key={param.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.name} {param.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={value as string}
                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required={param.required}
              />
            </div>
          );
          
        case 'number':
          return (
            <div key={param.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.name} {param.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                value={value as number}
                onChange={(e) => handleParameterChange(param.id, parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required={param.required}
              />
            </div>
          );
          
        case 'select': {
          const selectParam = param as SelectParameterType;
          return (
            <div key={param.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.name} {param.required && <span className="text-red-500">*</span>}
              </label>
              <select
                value={value as string}
                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                required={param.required}
              >
                <option value="">Select {param.name}</option>
                {selectParam.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
          
        default:
          return null;
      }
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Scheduled Reports</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => fetchReports()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              disabled={loading}
              title="Refresh"
            >
              <RefreshIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowNewReportForm(!showNewReportForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              New Report
            </button>
          </div>
        </div>
        
        {showNewReportForm && (
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Create Scheduled Report</h3>
            
            <form onSubmit={createReport}>
              {formError && (
                <div className="mb-4 bg-red-50 text-red-800 p-3 rounded-md">
                  {formError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newReport.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newReport.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="report_type"
                    value={newReport.report_type}
                    onChange={handleReportTypeChange}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    required
                  >
                    {REPORT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="frequency"
                    value={newReport.frequency}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    required
                  >
                    {FREQUENCIES.map(freq => (
                      <option key={freq.id} value={freq.id}>
                        {freq.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Parameters
                </label>
                <div className="bg-white p-3 border border-gray-200 rounded-md">
                  {renderParameterInputs()}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Emails <span className="text-red-500">*</span>
                </label>
                
                {newReport.recipient_emails.map((email, index) => (
                  <div key={index} className="flex mb-2 items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                      placeholder="example@domain.com"
                      required
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="ml-2 p-2 text-gray-500 hover:text-red-500"
                      disabled={newReport.recipient_emails.length <= 1}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addEmailField}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Email
                </button>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">No scheduled reports found.</p>
            <button
              onClick={() => setShowNewReportForm(true)}
              className="mt-3 text-blue-600 hover:text-blue-800"
            >
              Create your first report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {REPORT_TYPES.find(t => t.id === report.report_type)?.name || report.report_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {FREQUENCIES.find(f => f.id === report.frequency)?.name || report.frequency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(report.next_run)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(report.last_run)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.is_active ? 'Active' : 'Inactive'}
                      </span>
                      
                      {report.last_execution?.status && report.last_execution.status !== 'none' && (
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.last_execution.status === 'completed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : report.last_execution.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.last_execution.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleReportStatus(report.id, report.is_active)}
                          className={`p-1 rounded-md ${
                            report.is_active 
                              ? 'text-yellow-600 hover:text-yellow-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                          title={report.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {report.is_active ? 'Pause' : 'Resume'}
                        </button>
                        
                        {report.last_execution?.report_url && (
                          <a
                            href={report.last_execution.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="View Latest Report"
                          >
                            View
                          </a>
                        )}
                        
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Report"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 