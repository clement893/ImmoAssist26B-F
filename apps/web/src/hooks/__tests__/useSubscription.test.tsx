import { renderHook, waitFor } from '@testing-library/react';
import { useSession, Session } from 'next-auth/react';
import { useSubscription } from '../useSubscription';
import { api } from '@/lib/api';
import { AxiosResponse } from 'axios';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('useSubscription', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
  const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as ReturnType<typeof useSession>);

    const { result } = renderHook(() => useSubscription());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.subscription).toBeNull();
  });

  it('should load subscription when authenticated', async () => {
    const mockSubscription = {
      id: 1,
      plan_id: 1,
      plan: {
        id: 1,
        name: 'Pro',
        amount: 2900,
        currency: 'usd',
        interval: 'MONTH',
      },
      status: 'ACTIVE',
      current_period_start: '2025-01-01T00:00:00Z',
      current_period_end: '2025-02-01T00:00:00Z',
      cancel_at_period_end: false,
    };

    mockUseSession.mockReturnValue({
      data: { user: { id: 1 } } as Session,
      status: 'authenticated',
    } as ReturnType<typeof useSession>);

    mockApiGet.mockResolvedValue({
      data: mockSubscription,
    } as AxiosResponse<typeof mockSubscription>);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toEqual(mockSubscription);
    expect(result.current.hasActiveSubscription).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle 404 when no subscription exists', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 1 } } as Session,
      status: 'authenticated',
    } as ReturnType<typeof useSession>);

    const error = {
      response: {
        status: 404,
      },
    };
    mockApiGet.mockRejectedValue(error);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull(); // 404 is not an error
    expect(result.current.hasActiveSubscription).toBe(false);
  });

  it('should handle other errors', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 1 } } as Session,
      status: 'authenticated',
    } as ReturnType<typeof useSession>);

    const error = {
      response: {
        status: 500,
      },
    };
    mockApiGet.mockRejectedValue(error);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load subscription');
    expect(result.current.subscription).toBeNull();
  });

  it('should calculate hasActiveSubscription correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 1 } } as Session,
      status: 'authenticated',
    } as ReturnType<typeof useSession>);

    const mockSubscriptionData = {
      id: 1,
      status: 'TRIALING',
      plan: { id: 1, name: 'Pro', amount: 2900, currency: 'usd', interval: 'MONTH' },
    };
    mockApiGet.mockResolvedValue({
      data: mockSubscriptionData,
    } as AxiosResponse<typeof mockSubscriptionData>);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasActiveSubscription).toBe(true);
  });

  it('should provide refresh function', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 1 } } as Session,
      status: 'authenticated',
    } as ReturnType<typeof useSession>);

    const mockSubscriptionData = {
      id: 1,
      status: 'ACTIVE',
      plan: { id: 1, name: 'Pro', amount: 2900, currency: 'usd', interval: 'MONTH' },
    };
    mockApiGet.mockResolvedValue({
      data: mockSubscriptionData,
    } as AxiosResponse<typeof mockSubscriptionData>);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');

    // Test refresh
    await result.current.refresh();
    expect(mockApiGet).toHaveBeenCalledTimes(2);
  });
});
