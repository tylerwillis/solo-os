# GitHub Repository Setup for SOLO-OS

Follow these steps to create a GitHub repository for SOLO-OS:

1. Go to [GitHub](https://github.com) and log in to your account.

2. Click on the "+" icon in the top-right corner and select "New repository".

3. Fill in the repository details:
   - Repository name: `solo-os`
   - Description: "Terminal-based BBS for the Solo house"
   - Set visibility as desired (Public or Private)
   - Do NOT initialize with README, .gitignore, or license (since we have these files already)
   - Click "Create repository"

4. Once the repository is created, GitHub will display commands to push your existing repository. Run the following commands in your terminal:

```bash
# Navigate to your SOLO-OS directory
cd "/Users/tylerwillis/Local Code/solo-os"

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/solo-os.git

# Push your local repository to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

5. Refresh the GitHub page and you should see all your SOLO-OS files now hosted in the repository.

## Optional: Add Collaborators

If you want to add collaborators to the project:

1. Go to your repository on GitHub
2. Click "Settings"
3. Click "Collaborators" in the sidebar
4. Use the "Add people" button to add collaborators by their GitHub username or email address

## Optional: GitHub Pages Setup

If you want to set up a simple landing page for your project:

1. Go to your repository on GitHub
2. Click "Settings"
3. In the left sidebar, click "Pages"
4. Under "Source", select "Deploy from a branch"
5. Under "Branch", select "main" and "/docs" or "/root" as appropriate
6. Click "Save"
7. Create a docs folder if you used that option, and add an index.html file with project information

Your project documentation will be available at `https://YOUR_USERNAME.github.io/solo-os/`