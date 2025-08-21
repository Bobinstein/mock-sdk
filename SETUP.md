# Cross-Repository Changelog Automation Setup Guide

This guide walks you through setting up the automated changelog sync between your SDK repository and docs portal repository.

## 🎯 **What This Workflow Does**

1. **Triggers** when `CHANGELOG.md` is updated in the SDK repo
2. **Automatically** updates the docs portal repo with new release notes
3. **Maintains** MDX formatting and structure
4. **Creates** a pull request in the docs portal repo
5. **Sends** a Slack notification for manual review

## 📋 **Prerequisites**

- Two GitHub repositories:
  - **Source**: Your SDK repo (e.g., `mock-sdk`)
  - **Target**: Your docs portal repo (e.g., `mock-docs-portal`)
- GitHub Personal Access Token with appropriate permissions
- Slack workspace with webhook capability (optional but recommended)

## 🔧 **Step-by-Step Setup**

### **Step 1: Create GitHub Personal Access Token**

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Docs Portal Automation")
4. Set expiration (recommend 90 days for security)
5. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click "Generate token"
7. **Copy the token immediately** - you won't see it again!

### **Step 2: Add Secrets to SDK Repository**

1. Go to your SDK repository (`mock-sdk`)
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

   **Secret Name**: `DOCS_PORTAL_TOKEN`
   **Secret Value**: [Paste your GitHub token from Step 1]

   **Secret Name**: `SLACK_WEBHOOK_URL` (optional)
   **Secret Value**: [Your Slack webhook URL - see Step 3]

### **Step 3: Set Up Slack Webhook (Optional)**

1. In your Slack workspace, go to **Apps** → **Browse App Directory**
2. Search for "Incoming Webhooks" and install it
3. Click **"Add to Slack"**
4. Choose the channel where you want notifications
5. Click **"Add Incoming WebHooks integration"**
6. Copy the webhook URL and add it as `SLACK_WEBHOOK_URL` secret

### **Step 4: Configure Repository Permissions**

1. In your SDK repository, go to **Settings** → **Actions** → **General**
2. Under **"Workflow permissions"**:
   - Select **"Read and write permissions"**
   - ✅ Check **"Allow GitHub Actions to create and approve pull requests"**
3. Click **"Save"**

### **Step 5: Update Repository References**

1. Open `.github/workflows/update-docs-changelog.yml`
2. Update the target repository:

```yaml
- name: Checkout docs portal repo
  uses: actions/checkout@v4
  with:
    repository: YOUR_USERNAME/YOUR_DOCS_REPO_NAME # ← Change this
    token: ${{ secrets.DOCS_PORTAL_TOKEN }}
    path: ./docs-portal
```

3. Update the PR creation section:

```yaml
- name: Create Pull Request
  uses: peter-evans/create-pull-request@v5
  with:
    token: ${{ secrets.DOCS_PORTAL_TOKEN }}
    repository: YOUR_USERNAME/YOUR_DOCS_REPO_NAME # ← Change this
    # ... rest of config
```

### **Step 6: Update File Paths (if needed)**

1. Open `update-release-notes.js`
2. Update the target file path if your docs portal uses a different structure:

```javascript
const RELEASE_NOTES_PATH = "./your-actual-file-path.md"; // ← Change this
```

## 🧪 **Testing the Workflow**

### **Test 1: Manual Script Testing**

1. **Option A: Test in SDK repo (recommended for initial testing)**

   ```bash
   cd mock-sdk
   npm install
   npm run update
   ```

   This will read from `./CHANGELOG.md` and update `./release-notes.md`

2. **Option B: Test in docs portal repo**
   ```bash
   cd mock-docs-portal
   npm install
   # Copy CHANGELOG.md from SDK repo first
   cp ../mock-sdk/CHANGELOG.md ./
   npm run update
   ```
3. Verify the output file is updated correctly

### **Test 2: GitHub Actions Workflow**

1. Make a small change to `CHANGELOG.md` in your SDK repo
2. Commit and push to `main` branch
3. Go to **Actions** tab in your SDK repo
4. Watch the workflow run
5. Check your docs portal repo for the new pull request
6. Check Slack for the notification (if configured)

## 🔍 **Troubleshooting Common Issues**

### **Issue: "Permission denied" error**

**Cause**: Token doesn't have sufficient permissions
**Solution**:

- Ensure token has `repo` scope
- Verify token has access to both repositories
- Check if target repo is private (token needs access)

### **Issue: Workflow not triggering**

**Cause**: File path mismatch or branch issue
**Solution**:

- Verify `CHANGELOG.md` path is exactly correct
- Ensure you're pushing to `main` branch
- Check workflow file is in `.github/workflows/` directory

### **Issue: Script fails with module errors**

**Cause**: Missing dependencies
**Solution**:

- Ensure `package.json` has all required dependencies
- Check that `npm install` runs successfully in workflow

### **Issue: PR not created in target repo**

**Cause**: Token permissions or repository access
**Solution**:

- Verify `DOCS_PORTAL_TOKEN` has write access to target repo
- Check if target repo exists and is accessible
- Ensure workflow permissions are set correctly

## 📁 **File Structure**

After setup, your repositories should look like this:

```
mock-sdk/
├── .github/
│   └── workflows/
│       └── update-docs-changelog.yml
├── CHANGELOG.md
├── update-release-notes.js
├── package.json
└── README.md

mock-docs-portal/
├── release-notes.md (or your target file)
├── package.json
└── .gitignore
```

## 🔒 **Security Best Practices**

1. **Token Permissions**: Use minimal required permissions
2. **Token Rotation**: Rotate tokens every 90 days
3. **Repository Access**: Ensure tokens only access necessary repos
4. **Workflow Review**: Review workflow files before merging
5. **Secret Management**: Never commit secrets to version control

## 🚀 **Going Live**

1. **Test thoroughly** in a development environment
2. **Verify permissions** work correctly
3. **Monitor first few runs** to ensure everything works
4. **Set up alerts** for workflow failures
5. **Document the process** for your team

## 📞 **Getting Help**

If you encounter issues:

1. Check the **Actions** tab for detailed error logs
2. Verify all secrets are set correctly
3. Test the script manually first
4. Check repository permissions and access
5. Review the workflow file syntax

## 🎉 **Success Indicators**

Your workflow is working correctly when:

- ✅ Workflow triggers on `CHANGELOG.md` changes
- ✅ New release notes appear in docs portal
- ✅ Pull requests are created automatically
- ✅ Slack notifications are received (if configured)
- ✅ MDX formatting is preserved
- ✅ No duplicate entries are created

---

**Need help?** Check the main README.md for additional troubleshooting tips!
