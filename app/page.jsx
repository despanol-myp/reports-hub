"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, X, FileText, Clock, Trash2 } from 'lucide-react';
import { Info, ChevronDown, ChevronUp, MailCheck } from 'lucide-react';

// Theme color
const THEME_COLOR = '#55c1e9';

// Rest of the REPORT_TYPES constant remains the same...
const REPORT_TYPES = {
  sales: {
    name: 'Sales Report',
    description: 'A comprehensive overview of sales performance including revenue by region, product category distribution, and period-over-period comparisons. Use this report to track sales trends and identify top-performing categories.',
    filters: [
      { id: 'dateRange', label: 'Date Range', type: 'date' },
      { id: 'region', label: 'Region', type: 'select', options: ['North', 'South', 'East', 'West'] },
      { id: 'productCategory', label: 'Product Category', type: 'select', options: ['Electronics', 'Clothing', 'Furniture'] }
    ]
  },
  inventory: {
    name: 'Inventory Report',
    description: 'Detailed analysis of current inventory levels, stock movement, and warehouse capacity utilization. This report helps identify overstocked items, stockouts, and optimize inventory management.',
    filters: [
      { id: 'warehouse', label: 'Warehouse', type: 'select', options: ['Warehouse A', 'Warehouse B', 'Warehouse C'] },
      { id: 'productType', label: 'Product Type', type: 'select', options: ['Raw Materials', 'Finished Goods', 'Spare Parts'] }
    ]
  },
  revenue: {
    name: 'Revenue Report',
    description: 'Financial performance analysis showing revenue streams, profit margins, and quarterly comparisons. Use this report for financial planning and identifying revenue growth opportunities.',
    filters: [
      { id: 'year', label: 'Year', type: 'select', options: ['2022', '2023', '2024'] },
      { id: 'quarter', label: 'Quarter', type: 'select', options: ['Q1', 'Q2', 'Q3', 'Q4'] }
    ]
  }
};

const ReportDescription = ({ description, isVisible, onToggle }) => {
  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-gray-600 hover:text-gray-900 flex items-center gap-2 p-0 h-auto"
      >
        <Info className="h-4 w-4" />
        <span>{isVisible ? 'Hide Description' : 'Show Description'}</span>
        {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isVisible && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">{description}</p>
        </div>
      )}
    </div>
  );
};

const ReportGenerator = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({});
  const [generationStatus, setGenerationStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [reportHistory, setReportHistory] = useState([]);
  const [showDescription, setShowDescription] = useState(false);

  const abortControllerRef = useRef(null)

  // Delete report function
  const deleteReport = (reportId) => {
    setReportHistory(prev => prev.filter(report => report.id !== reportId));
  };

  const generateReport = () => {
    // Cancel any existing generation before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller for this generation
    abortControllerRef.current = new AbortController();

    setGenerationStatus('generating');
    setProgress(0);

    const simulateGeneration = () => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        // Check if generation has been cancelled
        if (abortControllerRef.current?.signal.aborted) {
          clearInterval(interval);
          setGenerationStatus('cancelled');
          setProgress(0);
          return;
        }

        currentProgress += 10;
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          clearInterval(interval);
          setGenerationStatus('completed');

          const newReport = {
            id: Date.now(),
            type: selectedReport.name,
            filters: { ...filters },
            generatedAt: new Date(),
            expirationDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            downloadLink: `/api/download-report-${Date.now()}`
          };

          setReportHistory(prev => [newReport, ...prev]);
          // Clear the controller reference after successful completion
          abortControllerRef.current = null;
        }
      }, 500);

      // Store the interval ID to clean up on cancellation
      const cleanup = () => {
        clearInterval(interval);
      };

      // Add cleanup function to abort controller
      abortControllerRef.current.signal.addEventListener('abort', cleanup);
    };

    simulateGeneration();
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGenerationStatus(null);
    setProgress(0);
  };

  const updateFilter = (filterId, value) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const activeReports = useMemo(() => {
    const now = new Date();
    return reportHistory.filter(report => report.expirationDate > now);
  }, [reportHistory]);

  const formatFilterDisplay = (filters) => {
    return Object.entries(filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="grid gap-6">
        {/* Report Generation Column */}
        <div>
          <Card className="h-full border-t-4" style={{ borderTopColor: THEME_COLOR }}>
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: THEME_COLOR }}>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Report Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Report Type</label>
                <Select onValueChange={(value) => {
                  setSelectedReport(REPORT_TYPES[value]);
                  setGenerationStatus(null)
                  setFilters({});
                }}>
                  <SelectTrigger className="border-2 hover:border-[#55c1e9] focus:border-[#55c1e9]">
                    <SelectValue placeholder="Choose a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_TYPES).map(([key, report]) => (
                      <SelectItem key={key} value={key}>
                        {report.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedReport && (
                <div className="space-y-4 mb-4">
                  <ReportDescription
                    description={selectedReport.description}
                    isVisible={showDescription}
                    onToggle={() => setShowDescription(!showDescription)}
                  />

                  <h3 className="text-lg font-semibold" style={{ color: THEME_COLOR }}>{selectedReport.name} Filters</h3>
                  {selectedReport.filters.map((filter) => (
                    <div key={filter.id} className="mb-2">
                      <label className="block text-sm font-medium mb-1">{filter.label}</label>
                      {filter.type === 'select' ? (
                        <Select onValueChange={(value) => {
                          updateFilter(filter.id, value)
                          setGenerationStatus(null)
                        }}>
                          <SelectTrigger className="border-2 hover:border-[#55c1e9] focus:border-[#55c1e9]">
                            <SelectValue placeholder={`Select ${filter.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <input
                          type={filter.type}
                          className="w-full border-2 rounded p-2 hover:border-[#55c1e9] focus:border-[#55c1e9] outline-none"
                          onChange={(e) => {
                            updateFilter(filter.id, e.target.value)
                            setGenerationStatus(null)
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {/* Generate Report Button */}
                  <Button
                    onClick={generateReport}
                    disabled={!selectedReport || Object.keys(filters).length !== selectedReport.filters.length}
                    className="w-full text-white"
                    style={{ backgroundColor: THEME_COLOR }}
                  >
                    Generate Report
                  </Button>
                </div>
              )}

              {/* Report Generation Status */}
              {generationStatus && (
                <div className="mt-4 p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold" style={{ color: THEME_COLOR }}>
                      {generationStatus === 'generating'
                        ? 'Generating Report...'
                        : 'Report Generation Complete'}
                    </h4>
                    {generationStatus === 'generating' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={cancelGeneration}
                      >
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    )}
                  </div>

                  {generationStatus === 'generating' && (
                    <Progress
                      value={progress}
                      className="w-full"
                      style={{
                        '--progress-background': THEME_COLOR,
                      }}
                    />
                  )}

                  {generationStatus === 'completed' && (
                    <div className="w-full mt-2 space-y-3">
                      <div className="w-full p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-start space-x-2">
                          <MailCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">A copy of the report is now available for download from the Reports Hub below. The link to download the report has also been sent to your email.</p>
                        </div>
                      </div>
                    </div>
                    
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report History Column */}
        <div>
          <Card className="border-t-4" style={{ borderTopColor: THEME_COLOR }}>
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: THEME_COLOR }}>Reports Hub</CardTitle>
            </CardHeader>
            <CardContent>
              {activeReports.length === 0 ? (
                <p className="text-center text-gray-500">No active reports</p>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="grid gap-2">
                    {activeReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-2 border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" style={{ color: THEME_COLOR }} />
                            <div>
                              <p className="text-sm font-medium">{report.type}</p>
                              <p className="text-xs text-gray-500">
                                Generated: {report.generatedAt.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(report.downloadLink, '_blank')}
                              className="hover:text-white hover:border-[#55c1e9]"
                              style={{ borderColor: THEME_COLOR, color: THEME_COLOR, ':hover': { backgroundColor: THEME_COLOR } }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteReport(report.id)}
                              className="hover:bg-red-500 hover:border-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Filters Display */}
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>Filters:</strong> {formatFilterDisplay(report.filters)}
                        </div>

                        {/* Expiration */}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires: {report.expirationDate.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
