/**
 * FileUpload Component Tests
 *
 * Comprehensive test suite for the FileUpload component covering:
 * - Rendering with different props
 * - File selection
 * - File validation (type, size, content)
 * - Multiple file uploads
 * - Error handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import FileUpload from '../FileUpload';

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsArrayBuffer(file: Blob) {
    // Simulate successful read
    setTimeout(() => {
      if (this.onload) {
        const event = {
          target: { result: new ArrayBuffer(8) },
        } as ProgressEvent<FileReader>;
        this.onload(event);
      }
    }, 0);
  }

  abort() {}
  readAsDataURL() {}
  readAsText() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
} as unknown as typeof FileReader;

describe('FileUpload Component', () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders file upload with label', () => {
      render(<FileUpload label="Upload File" />);
      expect(screen.getByText('Upload File')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('renders upload area', () => {
      render(<FileUpload />);
      expect(screen.getByText(/Cliquez pour télécharger/i)).toBeInTheDocument();
    });

    it('hides file input', () => {
      const { container } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('hidden');
    });
  });

  describe('File Selection', () => {
    it('handles single file selection', async () => {
      const handleFileChange = vi.fn();
      const file = createMockFile('test.pdf', 1024, 'application/pdf');

      render(<FileUpload onFileChange={handleFileChange} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(handleFileChange).toHaveBeenCalled();
      });
    });

    it('displays selected file name', async () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      render(<FileUpload />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });

    it('handles multiple file selection', async () => {
      const handleFileSelect = vi.fn();
      const file1 = createMockFile('file1.pdf', 1024, 'application/pdf');
      const file2 = createMockFile('file2.pdf', 2048, 'application/pdf');

      render(<FileUpload multiple onFileSelect={handleFileSelect} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(handleFileSelect).toHaveBeenCalledWith([file1, file2]);
        expect(screen.getByText(/2 fichier\(s\) sélectionné\(s\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Type Validation', () => {
    it('accepts files matching accept prop', async () => {
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');
      const onValidationError = vi.fn();

      render(<FileUpload accept="image/*" onValidationError={onValidationError} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onValidationError).not.toHaveBeenCalled();
      });
    });

    it('rejects files not matching accept prop', async () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const onValidationError = vi.fn();

      render(<FileUpload accept="image/*" onValidationError={onValidationError} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
        expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
      });
    });

    it('validates against allowedTypes prop', async () => {
      const file = createMockFile('document.jpg', 1024, 'image/jpeg');
      const onValidationError = vi.fn();

      render(<FileUpload allowedTypes={['.pdf', '.doc']} onValidationError={onValidationError} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
      });
    });
  });

  describe('File Size Validation', () => {
    it('rejects files exceeding maxSize', async () => {
      const file = createMockFile('large.pdf', 5 * 1024 * 1024, 'application/pdf'); // 5MB
      const onValidationError = vi.fn();

      render(<FileUpload maxSize={2} onValidationError={onValidationError} />); // 2MB max
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
        expect(screen.getByText(/too large/i)).toBeInTheDocument();
      });
    });

    it('rejects files below minSize', async () => {
      const file = createMockFile('small.pdf', 100 * 1024, 'application/pdf'); // 100KB
      const onValidationError = vi.fn();

      render(<FileUpload minSize={1} onValidationError={onValidationError} />); // 1MB min
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
        expect(screen.getByText(/too small/i)).toBeInTheDocument();
      });
    });
  });

  describe('Max Files Validation', () => {
    it('rejects when exceeding maxFiles', async () => {
      const file1 = createMockFile('file1.pdf', 1024, 'application/pdf');
      const file2 = createMockFile('file2.pdf', 1024, 'application/pdf');
      const file3 = createMockFile('file3.pdf', 1024, 'application/pdf');
      const onValidationError = vi.fn();

      render(<FileUpload multiple maxFiles={2} onValidationError={onValidationError} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file1, file2, file3],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
        expect(screen.getByText(/Maximum 2 file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      render(<FileUpload error="File upload failed" />);
      expect(screen.getByText('File upload failed')).toBeInTheDocument();
    });

    it('displays helper text when no error', () => {
      render(<FileUpload helperText="Select a file to upload" />);
      expect(screen.getByText('Select a file to upload')).toBeInTheDocument();
    });

    it('prioritizes error over helper text', () => {
      render(<FileUpload error="Error" helperText="Helper" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles fullWidth prop', () => {
      const { container } = render(<FileUpload fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('handles custom className', () => {
      const { container } = render(<FileUpload className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('forwards ref to input element', () => {
      const ref = { current: null };
      render(<FileUpload ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FileUpload label="Upload" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates label with input', () => {
      render(<FileUpload label="Upload File" id="file-upload" />);
      const label = screen.getByText('Upload File');
      expect(label).toHaveAttribute('for', 'file-upload');
    });

    it('has role="alert" on error message', () => {
      render(<FileUpload error="Error message" />);
      const error = screen.getByRole('alert');
      expect(error).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onFileChange with FileList', async () => {
      const handleFileChange = vi.fn();
      const file = createMockFile('test.pdf', 1024, 'application/pdf');

      render(<FileUpload onFileChange={handleFileChange} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(handleFileChange).toHaveBeenCalled();
        const callArgs = handleFileChange.mock.calls[0][0];
        expect(callArgs).toBeInstanceOf(FileList);
      });
    });

    it('calls onFileSelect with File[]', async () => {
      const handleFileSelect = vi.fn();
      const file = createMockFile('test.pdf', 1024, 'application/pdf');

      render(<FileUpload onFileSelect={handleFileSelect} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(handleFileSelect).toHaveBeenCalledWith([file]);
      });
    });
  });
});
