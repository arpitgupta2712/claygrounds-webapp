# Git SSH Setup and Repository Cloning Guide

## 1. Verify SSH Connection with GitHub
```bash
ssh -T git@github.com
```
Expected output: "Hi username! You've successfully authenticated, but GitHub does not provide shell access."

## 2. Check Git Configuration
```bash
git config --list | cat
```
This shows your:
- Username
- Email
- Default branch
- Credential helper settings

## 3. Clone Repository Using SSH
```bash
# 1. Navigate to desired location (e.g., Desktop)
cd ~/Desktop

# 2. Clone the repository using SSH URL
git clone git@github.com:arpitgupta2712/claygrounds-webapp.git

# 3. Navigate into the cloned repository
cd claygrounds-webapp

# 4. View all available branches
git branch -a | cat

# 5. Switch to development branch
git checkout development
```

## Common SSH URLs Format
```
git@github.com:username/repository-name.git
```

## Tips
- Make sure you're in the correct directory before cloning
- The SSH URL can be found on GitHub by:
  1. Going to your repository
  2. Clicking the green "Code" button
  3. Selecting "SSH" tab
  4. Copying the URL

## Verification
- After each step, you should see success messages
- After cloning, a new directory with your repository name will be created
- After switching branches, git will confirm with "Switched to branch 'branch-name'" 