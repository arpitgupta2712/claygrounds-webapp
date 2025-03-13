# Security Improvement Recommendations

## Current Security Concerns

Your application has several areas where security could be improved:

1. **Supabase Authentication**: While you're using Supabase for authentication, there are areas for improvement
2. **Exposed API Keys**: Your Supabase keys are potentially exposed in the client code
3. **Access Control**: Limited role-based access implementation
4. **Data Validation**: Inconsistent data validation
5. **Missing CSP**: No Content Security Policy implementation
6. **Dependency Security**: No visible scanning for vulnerable dependencies

## Specific Security Improvements

### 1. Enhance Authentication Security

#### Implement Session Refresh

Add automatic session refresh for long-lived application usage:

```javascript
// In AuthContext.jsx
useEffect(() => {
  // Set up refresh interval
  const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
  
  const refreshTimer = setInterval(async () => {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession();
      if (error) throw error;
      if (data) {
        setSession(data.session);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // Handle session refresh failure (e.g., redirect to login)
    }
  }, REFRESH_INTERVAL);
  
  return () => clearInterval(refreshTimer);
}, []);
```

#### Add Multi-Factor Authentication Support

```javascript
// In AuthContext.jsx
async function enableMFA() {
  try {
    const { data, error } = await supabaseClient.auth.mfa.enroll();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error enrolling MFA:', error);
    trackError(error, 'AuthContext.enableMFA', ErrorSeverity.ERROR, ErrorCategory.AUTH);
    throw error;
  }
}

// Add to the context value
const value = {
  // Existing values...
  enableMFA,
  verifyMFA: async (code) => { /* implementation */ }
};
```

### 2. Secure API Keys and Endpoints

#### Use Environment Variables Properly

```javascript
// supabase.js - Secure the keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

#### Implement API Request Security

Add request/response interceptors for security:

```javascript
// Create a secure fetch wrapper
export async function secureRequest(url, options = {}) {
  // Add authentication header if user is logged in
  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session;
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  // Add CSRF protection
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Check for unauthorized response
  if (response.status === 401) {
    // Handle unauthorized (e.g., redirect to login)
    window.location.href = '/login';
    return null;
  }
  
  return response;
}
```

### 3. Implement Robust Role-Based Access Control

Enhance your existing location access system:

```javascript
// AuthContext.jsx - Improved access control
// Define permission levels
const PermissionLevel = {
  NONE: 0,
  VIEW: 1,
  EDIT: 2,
  ADMIN: 3
};

// Implement comprehensive check
function hasPermission(resource, action) {
  // Return early in development mode
  if (isDevelopment) return true;
  
  if (!user || !user.email) return false;
  
  try {
    // Get user role from session
    const userRole = session?.user?.user_metadata?.role || 'user';
    
    // Define permissions matrix
    const permissions = {
      admin: {
        locations: PermissionLevel.ADMIN,
        reports: PermissionLevel.ADMIN,
        users: PermissionLevel.ADMIN
      },
      manager: {
        locations: PermissionLevel.EDIT,
        reports: PermissionLevel.EDIT,
        users: PermissionLevel.NONE
      },
      user: {
        locations: PermissionLevel.VIEW,
        reports: PermissionLevel.VIEW,
        users: PermissionLevel.NONE
      }
    };
    
    // Get required permission level for action
    const requiredLevel = {
      view: PermissionLevel.VIEW,
      edit: PermissionLevel.EDIT,
      delete: PermissionLevel.ADMIN
    }[action] || PermissionLevel.VIEW;
    
    // Check if user has sufficient permission
    const userPermissionLevel = permissions[userRole]?.[resource] || PermissionLevel.NONE;
    
    return userPermissionLevel >= requiredLevel;
  } catch (error) {
    console.error('[AuthContext] Error checking permissions:', error);
    return false;
  }
}
```

#### Implement a Permission Component for UI Protection

```jsx
function RequirePermission({ resource, action, fallback = null, children }) {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(resource, action);
  
  return allowed ? children : fallback;
}

// Usage
<RequirePermission 
  resource="reports" 
  action="edit" 
  fallback={<AccessDenied message="You don't have permission to edit reports" />}
>
  <ReportEditor />
</RequirePermission>
```

### 4. Enhance Data Validation

#### Implement Schema Validation for Data Processing

Use a schema validation library like Zod:

```javascript
// Install: npm install zod

// schemas/booking.js
import { z } from 'zod';

export const BookingSchema = z.object({
  'Booking Reference': z.string().nonempty(),
  'Customer Name': z.string().nonempty(),
  'Phone': z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  'Location': z.string().nonempty(),
  'Slot Date': z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format'),
  'Status': z.enum(['Confirmed', 'Cancelled', 'Partially Cancelled']),
  'Total Paid': z.number().nonnegative(),
  'Balance': z.number().nonnegative(),
  // Other fields...
});

// Usage in dataService.js
import { BookingSchema } from '../schemas/booking';

function processData(data) {
  return data.map(booking => {
    try {
      // Validate and parse the booking data
      const validatedBooking = BookingSchema.parse(booking);
      return validatedBooking;
    } catch (error) {
      console.error(`Invalid booking data:`, booking, error);
      // Log validation errors but keep the booking in the dataset
      return booking;
    }
  });
}
```

#### Add Input Sanitization

```javascript
// utils/sanitizers.js
export function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  
  // Replace potentially dangerous characters
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Usage in components
function SearchInput({ value, onChange }) {
  const handleChange = (e) => {
    const sanitizedValue = sanitizeInput(e.target.value);
    onChange(sanitizedValue);
  };
  
  return <input value={value} onChange={handleChange} />;
}
```

### 5. Implement Content Security Policy

Add a strong CSP to protect against XSS and other attacks:

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' https://ppdynljylqmbkkyjcapd.supabase.co;
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://ui-avatars.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
">
```

Or add it via netlify.toml for more flexible configuration:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; connect-src 'self' https://ppdynljylqmbkkyjcapd.supabase.co; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://ui-avatars.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests;"
```

### 6. Implement Security Headers

Add additional security headers to your Netlify configuration:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

### 7. Implement Dependency Scanning

Add automated dependency scanning to your project:

```bash
# Install dependency scanning tools
npm install --save-dev audit-ci

# Add to package.json scripts
"scripts": {
  "security:audit": "audit-ci --moderate"
}
```

Set up automated scanning in your CI/CD pipeline:

```yaml
# In GitHub Actions workflow
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run security audit
        run: npm run security:audit
```

### 8. Secure Local Storage Usage

Enhance your local storage handling to prevent sensitive data exposure:

```javascript
// utils/secureStorage.js
const SecureStorage = {
  // Set item with optional expiration
  setItem(key, value, expirationMinutes = 0) {
    const item = {
      value,
      expiry: expirationMinutes ? Date.now() + expirationMinutes * 60 * 1000 : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  // Get item with expiration check
  getItem(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      
      // Check for expiration
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error(`Error retrieving item from storage: ${key}`, error);
      return null;
    }
  },
  
  // Remove item
  removeItem(key) {
    localStorage.removeItem(key);
  },
  
  // Clear all items except specific keys
  clear(preserveKeys = []) {
    const preservedValues = {};
    
    // Save preserved keys
    preserveKeys.forEach(key => {
      preservedValues[key] = localStorage.getItem(key);
    });
    
    // Clear storage
    localStorage.clear();
    
    // Restore preserved keys
    Object.entries(preservedValues).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });
  }
};

export default SecureStorage;
```

### 9. Implement CSRF Protection

Add CSRF protection to your app:

```javascript
// utils/csrf.js
export function generateCsrfToken() {
  const token = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  
  localStorage.setItem('csrfToken', token);
  return token;
}

export function getCsrfToken() {
  return localStorage.getItem('csrfToken');
}

export function validateCsrfToken(token) {
  const storedToken = getCsrfToken();
  return storedToken === token;
}

// Use this in your fetch wrapper
function fetchWithCsrf(url, options = {}) {
  const csrfToken = getCsrfToken() || generateCsrfToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken
    }
  });
}
```

### 10. Implement Rate Limiting Protection

Protect your app from excessive API requests:

```javascript
// utils/rateLimiter.js
export class RateLimiter {
  constructor(maxRequests = 100, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
    this.requestTimestamps = [];
  }
  
  canMakeRequest() {
    const now = Date.now();
    
    // Remove expired timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindowMs
    );
    
    // Check if under limit
    return this.requestTimestamps.length < this.maxRequests;
  }
  
  recordRequest() {
    this.requestTimestamps.push(Date.now());
  }
  
  async limitedFetch(url, options = {}) {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    this.recordRequest();
    return fetch(url, options);
  }
}

// Usage
const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

async function fetchData() {
  try {
    const response = await apiRateLimiter.limitedFetch('/api/data');
    return response.json();
  } catch (error) {
    if (error.message.includes('Rate limit')) {
      // Handle rate limiting gracefully
      return { error: 'Too many requests, please try again shortly' };
    }
    throw error;
  }
}
```

Implementing these security improvements will significantly enhance the protection of your application and its data, reducing the risk of common web vulnerabilities and attacks.
