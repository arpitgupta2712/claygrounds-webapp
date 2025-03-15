# Console Filtering Commands

## Basic Filters

### Show Only App Logs
```
[Claygrounds]
```

### Hide Supabase Logs
```
-GoTrueClient
-supabase
```

### Show Only Errors
```
error
ERROR
```

### Show Only Warnings
```
warn
warning
```

## Combined Filters

### Show App Errors Only
```
[Claygrounds] error
```

### Show All Except Supabase
```
-supabase -GoTrueClient
```

## Component-Specific Filters

### Show Only Category Related Logs
```
CategoryDetail
CategoryView
```

### Show Only Auth Related Logs
```
[AuthProvider]
```

### Show Only Data Service Logs
```
[DataService]
```

## Level-Based Filters

### Show Debug Logs
```
debug
[debug]
```

### Show Info Logs
```
info
[info]
```

## Tips & Tricks

1. Use `-` to exclude: 
   - `-debug` excludes debug messages
   - `-[Claygrounds]` excludes app logs

2. Combine filters with spaces:
   - `error -supabase` shows errors but excludes Supabase errors
   - `[Claygrounds] warn` shows only app warnings

3. Case-sensitive search:
   - Add `Aa` button in console to make search case-sensitive
   - Useful for exact component name matching

4. Regular expressions:
   - Use `/pattern/` for regex search
   - Example: `/\[.*Service\]/` shows all service logs

## Common Use Cases

### Debugging Data Loading
```
[DataService]
```

### Monitoring Auth State
```
[AuthProvider]
```

### Tracking Navigation
```
[Navigation]
```

### Performance Monitoring
```
[performance]
timing
```

### Error Tracking
```
error
[ErrorTracker]
```

## Chrome DevTools Shortcuts

- `Ctrl + Shift + J` (Windows/Linux) or `Cmd + Option + J` (Mac): Open Console
- `Ctrl + L` or `Cmd + K`: Clear console
- `Ctrl + F` or `Cmd + F`: Search within console output 