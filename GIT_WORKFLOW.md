# Git Workflow Guide

This guide will help you manage your codebase across multiple systems and deploy effectively.

## First Time Setup on a New System

### 1. Generate SSH Key
```bash
# Generate a new SSH key (press Enter when asked for file location)
ssh-keygen -t ed25519 -C "your.email@example.com"

# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key to the agent
ssh-add ~/.ssh/id_ed25519

# Copy your public key (you'll add this to GitHub)
# On macOS:
pbcopy < ~/.ssh/id_ed25519.pub
# On Linux:
cat ~/.ssh/id_ed25519.pub
```

### 2. Add SSH Key to GitHub
1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste your copied key
4. Give it a name (e.g., "MacBook Work")

### 3. Set Up Git Globally
```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch to main
git config --global init.defaultBranch main

# Set up helpful aliases (optional)
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
```

### 4. Clone Repository
```bash
# Clone using SSH (recommended)
git clone git@github.com:arpitgupta2712/claygrounds-webapp.git

# Enter project directory
cd claygrounds-webapp

# Install dependencies
npm install
```

## Daily Workflow

### 1. Before Starting Work
```bash
# Switch to main branch
git checkout main

# Get latest changes
git pull origin main

# Create a new branch for your feature/fix (optional but recommended)
git checkout -b feature-name
```

### 2. While Working
```bash
# Check what files you've changed
git status

# See your changes
git diff

# Stage your changes
git add .                  # Stage all changes
# OR
git add specific-file.js   # Stage specific file

# Commit your changes
git commit -m "Description of changes"
```

### 3. Pushing Changes
```bash
# Push to main branch
git push origin main

# If using feature branch
git push origin feature-name
```

## Common Scenarios

### Switching Systems
When moving to a different system where you've already set up Git:
```bash
# Always pull latest changes before starting work
git pull origin main
```

### Discarding Changes
```bash
# Discard changes in a specific file
git checkout -- filename

# Discard all changes
git reset --hard
```

### Creating a Backup
```bash
# Run the backup script
./backup.sh

# Commit and push changes first!
git add .
git commit -m "Changes before backup"
git push origin main
```

## Deployment

### Netlify
- Netlify is connected to your GitHub repository
- It automatically deploys when you push to main
- You can also manually deploy from the Netlify dashboard

### Manual Deploy Steps
1. Push your changes to GitHub
```bash
git push origin main
```
2. Wait for Netlify to detect changes (usually a few seconds)
3. Monitor deployment in Netlify dashboard

## Best Practices

1. **Always Pull Before Working**
   - Prevents conflicts with others' changes
   - Keeps your local copy up to date

2. **Commit Often**
   - Make small, focused commits
   - Use clear commit messages

3. **Push Regularly**
   - Don't keep changes local for too long
   - Makes it easier to track issues

4. **Use Branches for Features**
   - Keep main branch stable
   - Use feature branches for new development

5. **Backup Before Major Changes**
   - Run backup script
   - Store backups in a safe place

## Troubleshooting

### If Git Says "Not a Repository"
```bash
# Check if you're in the right directory
pwd

# Initialize Git if needed
git init

# Add remote origin
git remote add origin git@github.com:arpitgupta2712/claygrounds-webapp.git
```

### If Push Is Rejected
```bash
# Pull changes first
git pull origin main

# Then try pushing again
git push origin main
```

### If You Have Merge Conflicts
1. Open the conflicted files
2. Look for conflict markers (<<<<<<, =======, >>>>>>>)
3. Resolve the conflicts manually
4. Commit the resolved files

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Google the exact error
3. Check Stack Overflow
4. Ask for help in GitHub discussions

Remember: It's normal to need help with Git when learning. Many experienced developers also look up Git commands regularly! 