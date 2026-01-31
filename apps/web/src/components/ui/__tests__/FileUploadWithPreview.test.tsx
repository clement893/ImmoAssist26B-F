/**
 * FileUploadWithPreview Component Tests
 *
 * Comprehensive test suite for the FileUploadWithPreview component covering:
 * - Rendering with previews
 * - File selection and preview generation
 * - Image previews
 * - File removal
 * - Multiple file handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import FileUploadWithPreview from '../FileUploadWithPreview';

// Mock FileReader for image previews
const mockFileReader = {
  result: 'data:image/jpeg;base64,test',
  onloadend: null as ((event: ProgressEvent<FileReader>) => void) | null,
  readAsDataURL: vi.fn(function (this: typeof mockFileReader, file: Blob) {
    setTimeout(() => {
      if (this.onloadend) {
        const event = {
          target: { result: this.result },
        } as ProgressEvent<FileReader>;
        this.onloadend(event);
      }
    }, 0);
  }),
};

global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: Blob) {
    mockFileReader.readAsDataURL(file);
    setTimeout(() => {
      if (this.onloadend) {
        const event = {
          target: { result: mockFileReader.result },
        } as ProgressEvent<FileReader>;
        this.onloadend(event);
      }
    }, 0);
  }

  abort() {}
  readAsArrayBuffer() {}
  readAsText() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
} as unknown as typeof FileReader;

describe('FileUploadWithPreview Component', () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders file upload component', () => {
      render(<FileUploadWithPreview />);
      expect(screen.getByText(/Cliquez pour télécharger/i)).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<FileUploadWithPreview label="Upload Images" />);
      expect(screen.getByText('Upload Images')).toBeInTheDocument();
    });

    it('does not show preview area initially', () => {
      const { container } = render(<FileUploadWithPreview />);
      const previewGrid = container.querySelector('.grid');
      expect(previewGrid).not.toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('displays selected files', async () => {
      const handleFileSelect = vi.fn();
      const file = createMockFile('test.pdf', 1024, 'application/pdf');

      render(<FileUploadWithPreview onFileSelect={handleFileSelect} />);
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
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('calls onFileSelect callback', async () => {
      const handleFileSelect = vi.fn();
      const file = createMockFile('test.pdf', 1024, 'application/pdf');

      render(<FileUploadWithPreview onFileSelect={handleFileSelect} />);
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

  describe('Image Previews', () => {
    it('generates preview for image files', async () => {
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');

      render(<FileUploadWithPreview />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(
        () => {
          const img = screen.getByAltText('image.jpg');
          expect(img).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows file icon for non-image files', async () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      render(<FileUploadWithPreview />);
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
  });

  describe('File Removal', () => {
    it('removes file when delete button is clicked', async () => {
      const handleFileSelect = vi.fn();
      const file = createMockFile('test.pdf', 1024, 'application/pdf');

      render(<FileUploadWithPreview onFileSelect={handleFileSelect} />);
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
        const removeButton = screen.getByText('Supprimer');
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(handleFileSelect).toHaveBeenCalledWith([]);
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });
    });

    it('calls onFileSelect with updated file list after removal', async () => {
      const handleFileSelect = vi.fn();
      const file1 = createMockFile('file1.pdf', 1024, 'application/pdf');
      const file2 = createMockFile('file2.pdf', 2048, 'application/pdf');

      render(<FileUploadWithPreview multiple onFileSelect={handleFileSelect} />);
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
        const removeButtons = screen.getAllByText('Supprimer');
        fireEvent.click(removeButtons[0]);
      });

      await waitFor(() => {
        expect(handleFileSelect).toHaveBeenLastCalledWith([file2]);
      });
    });
  });

  describe('Multiple Files', () => {
    it('handles multiple file selection', async () => {
      const file1 = createMockFile('file1.pdf', 1024, 'application/pdf');
      const file2 = createMockFile('file2.pdf', 2048, 'application/pdf');

      render(<FileUploadWithPreview multiple />);
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
        expect(screen.getByText('file1.pdf')).toBeInTheDocument();
        expect(screen.getByText('file2.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('File Icons', () => {
    it('shows PDF icon for PDF files', async () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      render(<FileUploadWithPreview />);
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
        const container = screen.getByText('document.pdf').closest('div');
        expect(container?.textContent).toContain('📄');
      });
    });
  });

  describe('Props Handling', () => {
    it('passes props to FileUpload component', () => {
      render(<FileUploadWithPreview accept="image/*" maxSize={5} />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('handles fullWidth prop', () => {
      const { container } = render(<FileUploadWithPreview fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<FileUploadWithPreview error="Upload failed" />);
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('displays helper text', () => {
      render(<FileUploadWithPreview helperText="Select files" />);
      expect(screen.getByText('Select files')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FileUploadWithPreview label="Upload" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has alt text on image previews', async () => {
      const file = createMockFile('image.jpg', 1024, 'image/jpeg');

      render(<FileUploadWithPreview />);
      const input = screen
        .getByLabelText(/Cliquez pour télécharger/i)
        .closest('label')
        ?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(
        () => {
          const img = screen.getByAltText('image.jpg');
          expect(img).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });
});
