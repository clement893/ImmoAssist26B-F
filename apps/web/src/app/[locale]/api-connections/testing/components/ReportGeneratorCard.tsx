/**
 * ReportGeneratorCard Component
 * Displays report generation interface
 */

import { Button, Card, Alert, Badge } from '@/components/ui';
import { FileText, Download, ExternalLink, Eye, Loader2 } from 'lucide-react';
import type { CheckResult } from '../types/health.types';

interface ReportGeneratorCardProps {
  report: CheckResult | null;
  isGeneratingReport: boolean;
  onGenerateReport: () => void;
  onDownloadReport: () => void;
  onOpenReportInNewTab: () => void;
  onOpenReportAsMarkdown: () => void;
}

export function ReportGeneratorCard({
  report,
  isGeneratingReport,
  onGenerateReport,
  onDownloadReport,
  onOpenReportInNewTab,
  onOpenReportAsMarkdown,
}: ReportGeneratorCardProps) {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Generate Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a comprehensive markdown report of all API connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            aria-label="Generate complete report"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGeneratingReport ? 'Generating...' : 'Generate Complete Report'}
            {isGeneratingReport && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" aria-hidden="true" />
            )}
          </Button>
          {report?.reportContent && (
            <>
              <Button
                variant="outline"
                onClick={onOpenReportInNewTab}
                title="Open report in new tab (HTML)"
                aria-label="Open report in new tab as HTML"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                onClick={onOpenReportAsMarkdown}
                title="Open report as Markdown in new tab"
                aria-label="Open report as Markdown in new tab"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open MD
              </Button>
              <Button
                variant="outline"
                onClick={onDownloadReport}
                title="Download report as file"
                aria-label="Download report as file"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>
      </div>

      {report && (
        <div className="space-y-4">
          {!report.success && report.error ? (
            <Alert variant="error">
              <div>
                <p className="font-medium">{report.error || 'Report generation failed'}</p>
                {report.message && <p className="text-sm mt-1">{report.message}</p>}
                {report.hint && <p className="text-sm mt-1 text-muted-foreground">{report.hint}</p>}
              </div>
            </Alert>
          ) : (
            <>
              {report.reportPath && (
                <Alert variant="success">
                  <div>
                    <p className="font-medium">Report generated successfully!</p>
                    <p className="text-sm mt-1">
                      Report path:{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {report.reportPath}
                      </code>
                    </p>
                    {report.reportContent && (
                      <p className="text-sm mt-1">
                        Report size:{' '}
                        <Badge variant="info">{report.reportContent.length} characters</Badge>
                      </p>
                    )}
                  </div>
                </Alert>
              )}
              {report.reportContent && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Report Preview</h3>
                  <pre
                    className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 border border-border"
                    role="log"
                    aria-label="Report preview"
                  >
                    {report.reportContent.substring(0, 500)}
                    {report.reportContent.length > 500 && '...'}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
