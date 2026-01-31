# Testing Guide

## Running Tests

### Backend Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_pagination.py -v

# Run tests by marker
pytest tests/ -m unit          # Unit tests only
pytest tests/ -m integration  # Integration tests only
pytest tests/ -m api          # API tests only

# Run with coverage threshold check (fails if < 70%)
pytest tests/ --cov=app --cov-fail-under=70

# View coverage report
# Open htmlcov/index.html in browser
```

### Frontend Tests

```bash
# Run all tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# View coverage report
# Open coverage/index.html in browser
```

## Test Structure

```
backend/tests/
├── conftest.py              # Shared fixtures
├── unit/                    # Unit tests
│   ├── test_pagination.py
│   ├── test_cache_enhanced.py
│   ├── test_query_optimization.py
│   ├── test_api_key.py
│   ├── test_compression.py
│   ├── test_two_factor.py
│   └── test_rate_limit.py
├── integration/             # Integration tests
│   ├── test_auth_flow.py
│   └── test_pagination_integration.py
└── api/                     # API endpoint tests
    ├── test_auth_endpoint.py
    └── test_users_endpoint.py
```

## Coverage Targets

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

## Writing Tests

### Unit Test Example

```python
def test_generate_api_key_format():
    """Test API key format"""
    key = generate_api_key()
    assert key.startswith("mk_")
    assert len(key) > 20
```

### Integration Test Example

```python
@pytest.mark.asyncio
async def test_register_and_login(client, test_user_data):
    """Test user registration and login flow"""
    register_response = await client.post(
        "/api/v1/auth/register",
        json=test_user_data,
    )
    assert register_response.status_code == 201
```

### Component Test Example

```typescript
it('calls onClick handler when clicked', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```
