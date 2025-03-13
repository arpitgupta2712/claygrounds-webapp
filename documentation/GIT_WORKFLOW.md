
## Complete Git Workflow Steps

### First Time Setup on a System

1. Generate a unique SSH key for this system:

```bash
# Generate a new SSH key with a descriptive name
ssh-keygen -t ed25519 -C "arpit.rainman@gmail.com" -f ~/.ssh/id_ed25519_claygrounds

# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key to the agent
ssh-add ~/.ssh/id_ed25519_claygrounds

# Copy your public key (you'll add this to GitHub)
pbcopy < ~/.ssh/id_ed25519_claygrounds.pub
```

2. Add the SSH key to GitHub:
   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your copied key
   - Give it a descriptive name (e.g., "MacBook Pro - ClayGrounds")

3. Set up SSH config at `~/.ssh/config`:

```
# ~/.ssh/config
Host github-claygrounds
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_claygrounds
    AddKeysToAgent yes
    UseKeychain yes
```

4. Configure Git globally:

```bash
# Set your name and email
git config --global user.name "Arpit Gupta"
git config --global user.email "arpit.rainman@gmail.com"

# Set default branch to main
git config --global init.defaultBranch main

# Set up helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
```

5. Clone the repository:

```bash
# Navigate to your preferred location
cd ~/Projects/  # NOT in iCloud

# Clone using SSH with custom host
git clone git@github-claygrounds:arpitgupta2712/claygrounds-webapp.git

# Enter project directory
cd claygrounds-webapp

# Install dependencies
npm install

# Copy environment example file
cp .env.example .env.local
# Edit .env.local with your local settings
```

6. Install Git hooks:

```bash
# Install Husky (if not already set up in the project)
npm run prepare
```

### Daily Development Workflow

1. Before starting work:

```bash
# Make sure you're on the development branch
git checkout development

# Get the latest changes
git pull origin development

# Create a feature branch for your work
git checkout -b feature/your-feature-name

# Install or update dependencies if package.json changed
npm install
```

2. While working:

```bash
# Periodically commit your changes
git add .
git commit -m "Descriptive message about changes"

# Push your feature branch to remote (first time)
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

3. Stay in sync with development:

```bash
# Save your current changes if needed
git add .
git commit -m "WIP: Temporary commit"

# Get latest from development
git checkout development
git pull origin development

# Return to your feature branch
git checkout feature/your-feature-name

# Merge in the latest development changes
git merge development

# Resolve any conflicts if needed
```

4. Complete a feature:

```bash
# Make sure tests pass
npm test

# Make sure your feature branch is up to date
git pull origin feature/your-feature-name

# Merge development to ensure you have the latest changes
git checkout development
git pull origin development
git checkout feature/your-feature-name
git merge development

# Fix any conflicts and commit
git add .
git commit -m "Merge development into feature/your-feature-name"

# Create a pull request (on GitHub)
# or merge directly if you're the only developer
git checkout development
git merge feature/your-feature-name
git push origin development
```

5. Deploying to production:

```bash
# Make sure development is stable and tested
git checkout development
git pull origin development

# Switch to main branch
git checkout main
git pull origin main

# Merge development changes into main
git merge development

# Push to main (this will trigger Netlify deployment)
git push origin main
```

## Best Practices Summary

1. **Never commit directly to main**
   - All changes should go through development first
   - Use feature branches for all new work

2. **Commit frequently with clear messages**
   - Use present tense ("Add feature" not "Added feature")
   - Reference issue numbers when relevant

3. **Pull before starting work**
   - Always start with the latest code
   - Resolve conflicts early

4. **Keep feature branches short-lived**
   - Merge or rebase frequently from development
   - Don't let feature branches live for more than a few days

5. **Use Git for synchronization, not iCloud**
   - Avoid putting repositories in iCloud Drive folders
   - Rely on Git pull/push for moving code between systems

6. **Run tests before pushing**
   - Ensure your changes don't break existing functionality
   - Use Git hooks to enforce this automatically

7. **Document environment requirements**
   - Keep .env.example up to date
   - Document any new environment variables

8. **Regular cleanup**
   - Delete merged feature branches
   - Periodically clean stale branches

By following these practices, you'll have a more robust, reliable development workflow that minimizes conflicts and ensures consistent deployments.