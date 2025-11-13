# CLAUDE Development Guide

**Communication**: Extreme concision. Sacrifice grammar for brevity.

---

<plans_instruction>
## Plans - CRITICAL INSTRUCTION

**At the end of each plan, you MUST provide a list of unresolved questions to answer, if any.**

**Requirements for questions:**
- **Make questions EXTREMELY concise**
- **Sacrifice grammar for concision**
- **Use minimal words while maintaining clarity**

**Format:**
```
Unresolved Questions:
- [Concise question 1]?
- [Concise question 2]?
```
</plans_instruction>

---

## Core Principles (NON-NEGOTIABLE)

<dry_principle>
### DRY - Zero Tolerance for Duplication

**BEFORE writing ANY code**: Search existing codebase for similar logic using `rg`.

```bash
# Search protocol
rg "def function_name" # Similar functions
rg "class.*Pattern" # Similar classes
rg "business.*logic" # Similar logic
```

**Rules**:
- ❌ No duplicate functions/logic
- ❌ No copy-paste between modules
- ❌ No "slightly different" versions
- ✅ Extract common logic to shared utilities
- ✅ Refactor duplications when found
- ✅ Use inheritance/composition/utilities

If writing similar code to existing, STOP and refactor for reuse.
</dry_principle>

<design_principles>
### KISS, YAGNI & Design
- **KISS**: Choose simple over complex
- **YAGNI**: Build only when needed
- **MongoDB**: Singleton connections only
- **Dependency Inversion**: Depend on abstractions
- **Open/Closed**: Open for extension, closed for modification
- **Single Responsibility**: One purpose per function/class/module
- **Fail Fast**: Check errors early, raise immediately
</design_principles>

---

## Code Structure

### Limits & Organization

| Type | Limit | Action |
|------|-------|--------|
| File | 500 lines | Split into modules |
| Function | 50 lines | Refactor, single responsibility |
| Class | 100 lines | Single concept only |
| Line length | 100 chars | Ruff in pyproject.toml |

**Always use `venv_linux` for Python execution including tests.**

### Architecture
```
src/project/
main.py
tests/{test_main.py, conftest.py}
database/{connection.py, models.py, tests/}
auth/{authentication.py, authorization.py, tests/}
features/
user_management/{handlers.py, validators.py, tests/}
```

---

## Development Environment

<uv_management>
### UV Package Management

```bash
# Install
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup
uv venv && uv sync

# Dependencies (never edit pyproject.toml directly)
uv add requests
uv add --dev pytest ruff mypy
uv remove requests

# Execute
uv run python script.py
uv run pytest
uv python install 3.12
```
</uv_management>

### Common Commands

```bash
# Testing
uv run pytest # All tests
uv run pytest tests/test_module.py -v # Specific, verbose
uv run pytest --cov=src --cov-report=html # Coverage

# Code quality
uv run ruff format . # Format
uv run ruff check . --fix # Lint & auto-fix
uv run mypy src/ # Type check
uv run pre-commit run --all-files # Pre-commit
```

---

## Style & Conventions

<python_style>
### Python Style
- **PEP8** compliance, 100 char lines
- Double quotes for strings
- Trailing commas in multi-line structures
- **Always** use type hints
- Format with `ruff format`
- Use `pydantic` v2 for validation
</python_style>

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables/Functions | `snake_case` | `calculate_total` |
| Classes | `PascalCase` | `UserRepository` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Private | `_leading_underscore` | `_internal_method` |
| Type Aliases | `PascalCase` | `UserId` |
| Enum Values | `UPPER_SNAKE_CASE` | `STATUS_ACTIVE` |

<docstring_standard>
### Docstrings
Use Google-style for all public functions/classes:

```python
def calculate_discount(
price: Decimal,
discount_percent: float,
min_amount: Decimal = Decimal("0.01")
) -> Decimal:
"""
Calculate discounted price for a product.
Args:
price: Original price of product
discount_percent: Discount percentage (0-100)
min_amount: Minimum allowed final price
Returns:
Final price after discount
Raises:
ValueError: If discount_percent not in 0-100
ValueError: If final price below min_amount
Example:
>>> calculate_discount(Decimal("100"), 20)
Decimal('80.00')
"""
```
</docstring_standard>

---

## Testing

<tdd_workflow>
### TDD Workflow
1. **Write test first** - Define expected behavior
2. **Watch it fail** - Ensure test is valid
3. **Write minimal code** - Just enough to pass
4. **Refactor** - Improve while keeping tests green
5. **Repeat** - One test at a time
</tdd_workflow>

### Testing Best Practices

```python
import pytest
from datetime import datetime

@pytest.fixture
def sample_user():
"""Provide sample user for testing."""
return User(id=123, name="Test User", email="test@example.com")

def test_user_can_update_email_when_valid(sample_user):
"""Test users can update email with valid input."""
new_email = "newemail@example.com"
sample_user.update_email(new_email)
assert sample_user.email == new_email

def test_user_update_email_fails_with_invalid_format(sample_user):
"""Test invalid email formats are rejected."""
with pytest.raises(ValidationError) as exc_info:
sample_user.update_email("not-an-email")
assert "Invalid email format" in str(exc_info.value)
```

**Organization**:
- Unit tests: Individual functions/methods in isolation
- Integration tests: Component interactions
- End-to-end tests: Complete user workflows
- Keep test files beside code
- Use `conftest.py` for shared fixtures
- Aim for 80%+ coverage, focus on critical paths

---

## Error Handling

<exception_handling>
### Custom Exceptions

```python
class PaymentError(Exception):
"""Base exception for payment errors."""
pass

class InsufficientFundsError(PaymentError):
"""Raised when account has insufficient funds."""
def __init__(self, required: Decimal, available: Decimal):
self.required = required
self.available = available
super().__init__(
f"Insufficient funds: required {required}, available {available}"
)

# Usage
try:
process_payment(amount)
except InsufficientFundsError as e:
logger.warning(f"Payment failed: {e}")
return PaymentResult(success=False, reason="insufficient_funds")
except PaymentError as e:
logger.error(f"Payment error: {e}")
return PaymentResult(success=False, reason="payment_error")
```
</exception_handling>

### Context Managers

```python
from contextlib import contextmanager

@contextmanager
def database_transaction():
"""Provide transactional scope for database operations."""
conn = get_connection()
trans = conn.begin_transaction()
try:
yield conn
trans.commit()
except Exception:
trans.rollback()
raise
finally:
conn.close()
```

---

## Logging

<logging_strategy>
### Structured Logging

```python
import logging
from functools import wraps

# Configure logging
logging.basicConfig(
level=logging.INFO,
format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Decorator for function logging
def log_execution(func):
@wraps(func)
def wrapper(*args, **kwargs):
logger.info(f"Executing {func.__name__}")
try:
result = func(*args, **kwargs)
logger.info(f"Completed {func.__name__}")
return result
except Exception as e:
logger.error(f"Error in {func.__name__}: {str(e)}")
raise
return wrapper
```
</logging_strategy>

---

## Database Standards

<naming_conventions>
### Database Naming
Models mirror database fields exactly - no field mapping complexity.

```python
class Lead(BaseModel):
lead_id: UUID = Field(default_factory=uuid4) # Matches database
session_id: UUID # Matches database
agency_id: str # Matches database
created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
model_config = ConfigDict(
use_enum_values=True,
populate_by_name=True,
alias_generator=None # Use exact field names
)
```
</naming_conventions>

### API Route Standards

```python
router = APIRouter(prefix="/api/v1/leads", tags=["leads"])

@router.get("/{lead_id}") # GET /api/v1/leads/{lead_id}
@router.put("/{lead_id}") # PUT /api/v1/leads/{lead_id}
@router.delete("/{lead_id}") # DELETE /api/v1/leads/{lead_id}

# Sub-resources
@router.get("/{lead_id}/messages") # GET /api/v1/leads/{lead_id}/messages
@router.get("/agency/{agency_id}") # GET /api/v1/leads/agency/{agency_id}
```

---

## Documentation

<documentation_standards>
### Code Documentation
- Module docstrings explain purpose
- Public functions need complete docstrings
- Complex logic: inline comments with `# Reason:` prefix
- Keep README.md updated with setup instructions
- Maintain CHANGELOG.md for version history
</documentation_standards>

### API Documentation

```python
from fastapi import APIRouter
from typing import List

router = APIRouter(prefix="/products", tags=["products"])

@router.get(
"/",
response_model=List[Product],
summary="List all products",
description="Retrieve paginated list of all active products"
)
async def list_products(
skip: int = 0,
limit: int = 100,
category: Optional[str] = None
) -> List[Product]:
"""
Retrieve products with optional filtering.
- **skip**: Number of products to skip (pagination)
- **limit**: Maximum number of products to return
- **category**: Filter by product category
"""
```

---

## Performance

<optimization_guidelines>
### Optimization Guidelines
- Profile before optimizing - use `cProfile` or `py-spy`
- Use `lru_cache` for expensive computations
- Prefer generators for large datasets
- Use `asyncio` for I/O-bound operations
- Consider `multiprocessing` for CPU-bound tasks
</optimization_guidelines>

### Optimization Examples

```python
from functools import lru_cache
import asyncio
from typing import AsyncIterator

@lru_cache(maxsize=1000)
def expensive_calculation(n: int) -> int:
"""Cache results of expensive calculations."""
return result

async def process_large_dataset() -> AsyncIterator[dict]:
"""Process large dataset without loading all into memory."""
async with aiofiles.open('large_file.json', mode='r') as f:
async for line in f:
data = json.loads(line)
yield process_item(data)
```

---

## Security

<security_guidelines>
### Security Best Practices
- Never commit secrets - use environment variables
- Validate all user input with Pydantic
- Use parameterized queries for database operations
- Implement rate limiting for APIs
- Keep dependencies updated with `uv`
- Use HTTPS for all external communications
- Implement proper authentication and authorization
</security_guidelines>

### Security Implementation

```python
from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
"""Hash password using bcrypt."""
return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
"""Verify password against hash."""
return pwd_context.verify(plain_password, hashed_password)

def generate_secure_token(length: int = 32) -> str:
"""Generate cryptographically secure random token."""
return secrets.token_urlsafe(length)
```

---

## Debugging & Monitoring

<debugging_tools>
### Debugging Commands

```bash
# Interactive debugging
uv add --dev ipdb
# Add breakpoint: import ipdb; ipdb.set_trace()

# Memory profiling
uv add --dev memory-profiler
uv run python -m memory_profiler script.py

# Rich traceback
uv add --dev rich
# In code: from rich.traceback import install; install()
```
</debugging_tools>

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Log with context
logger.info(
"payment_processed",
user_id=user.id,
amount=amount,
currency="USD",
processing_time=processing_time
)
```

---

## Search Commands

<search_requirements>
**CRITICAL**: Always use `rg` (ripgrep) instead of `grep` and `find`:

```bash
# ❌ Don't use grep
grep -r "pattern" .

# ✅ Use rg
rg "pattern"

# ❌ Don't use find
find . -name "*.py"

# ✅ Use rg
rg --files -g "*.py"
```
</search_requirements>

---

## Git Workflow

<github_flow>
### GitHub Flow

```
main (protected) ←── PR ←── feature/your-feature
↓ ↑
deploy development
```

### Daily Workflow

1. `git checkout main && git pull origin main`
2. `git checkout -b feature/new-feature`
3. Make changes + tests
4. `git push origin feature/new-feature`
5. Create PR → Review → Merge to main

### Commit Message Standard

**IMPORTANT**: Do NOT include the following text in commit messages:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

This attribution should be excluded from all commits to maintain clean git history.
</github_flow>

---

## Important Notes

<critical_reminders>
- **NEVER ASSUME OR GUESS** - Ask for clarification when in doubt
- **Always verify** file paths and module names before use
- **Keep CLAUDE.md updated** when adding patterns or dependencies
- **Test your code** - No feature is complete without tests
- **Document decisions** - Future developers will thank you
- **No backwards compatibility** - Remove deprecated code immediately
- **Detailed errors over graceful failures** - Identify and fix issues fast
</critical_reminders>

---

## Resources

### Essential Tools
- UV: https://github.com/astral-sh/uv
- Ruff: https://github.com/astral-sh/ruff
- Pytest: https://docs.pytest.org/
- Pydantic: https://docs.pydantic.dev/
- FastAPI: https://fastapi.tiangolo.com/

### Best Practices
- PEP 8: https://pep8.org/
- PEP 484 (Type Hints): https://www.python.org/dev/peps/pep-0484/
- Hitchhiker's Guide to Python: https://docs.python-guide.org/
