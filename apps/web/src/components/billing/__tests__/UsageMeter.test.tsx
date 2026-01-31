/**
 * UsageMeter Component Tests
 *
 * Comprehensive test suite for the UsageMeter component covering:
 * - Rendering usage information
 * - Progress bar display
 * - Status thresholds (normal, warning, critical)
 * - Percentage calculation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import UsageMeter from '../UsageMeter';

describe('UsageMeter Component', () => {
  describe('Rendering', () => {
    it('renders label', () => {
      render(<UsageMeter label="API Calls" current={50} limit={100} />);
      expect(screen.getByText('API Calls')).toBeInTheDocument();
    });

    it('renders current and limit values', () => {
      render(<UsageMeter label="Usage" current={75} limit={100} unit="calls" />);
      expect(screen.getByText(/75/)).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('renders percentage', () => {
      render(<UsageMeter label="Usage" current={50} limit={100} />);
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  describe('Status Thresholds', () => {
    it('displays normal status when below warning threshold', () => {
      render(
        <UsageMeter
          label="Usage"
          current={50}
          limit={100}
          thresholds={{ warning: 70, critical: 90 }}
        />
      );
      expect(screen.getByText(/within limits/i)).toBeInTheDocument();
    });

    it('displays warning status when above warning threshold', () => {
      render(
        <UsageMeter
          label="Usage"
          current={75}
          limit={100}
          thresholds={{ warning: 70, critical: 90 }}
        />
      );
      expect(screen.getByText(/approaching usage limit/i)).toBeInTheDocument();
    });

    it('displays critical status when above critical threshold', () => {
      render(
        <UsageMeter
          label="Usage"
          current={95}
          limit={100}
          thresholds={{ warning: 70, critical: 90 }}
        />
      );
      expect(screen.getByText(/usage limit nearly reached/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero usage', () => {
      render(<UsageMeter label="Usage" current={0} limit={100} />);
      expect(screen.getByText(/0/)).toBeInTheDocument();
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('handles usage at limit', () => {
      render(<UsageMeter label="Usage" current={100} limit={100} />);
      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('handles usage exceeding limit', () => {
      render(<UsageMeter label="Usage" current={150} limit={100} />);
      // Percentage should be capped at 100%
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('handles empty unit', () => {
      render(<UsageMeter label="Usage" current={50} limit={100} unit="" />);
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<UsageMeter label="Usage" current={50} limit={100} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
