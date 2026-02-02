import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  onExportExcel: () => void;
  onExportPDF?: () => void;
  isLoading?: boolean;
  label?: string;
  showPdfOption?: boolean;
}

export function ExportButton({
  onExportExcel,
  onExportPDF,
  isLoading = false,
  label = 'Export',
  showPdfOption = true,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      if (type === 'excel') {
        await onExportExcel();
      } else if (onExportPDF) {
        await onExportPDF();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // If only Excel export, show simple button
  if (!showPdfOption || !onExportPDF) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled={isLoading || isExporting}
        className="h-9"
        onClick={() => handleExport('excel')}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isLoading || isExporting}
          className="h-9"
        >
          <Download className="h-4 w-4 mr-2" />
          {label}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
