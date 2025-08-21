# Mock SDK - Changelog Automation

This repository contains a GitHub Actions workflow that automatically updates the changelog in the [mock-docs-portal](https://github.com/bobinstein/mock-docs-portal) repository whenever the `CHANGELOG.md` file is updated in this repository.

## How It Works

1. **Trigger**: When a commit is pushed to the `main` branch that modifies `CHANGELOG.md`
2. **Action**: The workflow automatically:
   - Checks out both repositories
   - Parses the latest version from the SDK changelog
   - Updates the release notes in the docs portal while maintaining MDX formatting
   - Creates a pull request with the changes
   - Sends a Slack notification for review

## Setup Requirements

### 1. Repository Secrets

You need to set up the following secrets in your **SDK repository** (`mock-sdk`):

- `DOCS_PORTAL_TOKEN`: A GitHub Personal Access Token with permissions to:
  - Read from the SDK repo
  - Write to the docs portal repo
  - Create pull requests
- `SLACK_WEBHOOK_URL`: A Slack webhook URL for notifications (optional but recommended)

### 2. Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with the following scopes:
   - `repo` (full control of private repositories)
   - `workflow` (if using GitHub Actions)
3. Copy the token and add it as a secret in your SDK repo:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DOCS_PORTAL_TOKEN`
   - Value: paste your token

### 3. Workflow Permissions

The workflow needs to be able to create pull requests in the **docs portal repository**. Ensure your repository has the following settings:

- Go to Settings → Actions → General
- Under "Workflow permissions", select "Read and write permissions"
- Check "Allow GitHub Actions to create and approve pull requests"

**Important**: The `DOCS_PORTAL_TOKEN` must have write access to the docs portal repository to create pull requests.

## Workflow Files

- `.github/workflows/update-docs-changelog.yml` - Main workflow file
- `update-release-notes.js` - Node.js script for parsing and updating changelog
- `package.json` - Dependencies and scripts

## Testing the Workflow

1. Make a change to `CHANGELOG.md` in this repository
2. Commit and push to the `main` branch
3. Check the Actions tab to see the workflow running
4. Check the docs portal repository for the new pull request
5. Check your Slack channel for the notification (if configured)

## Manual Testing

You can test the changelog parsing script locally:

```bash
# Install dependencies
npm install

# Run the update script
npm run update

# Or run directly
node update-release-notes.js
```

**Note**: When testing locally, the script will read from `./CHANGELOG.md` in the current directory and update `./release-notes.md`. In the GitHub Actions workflow, it will use the path `../sdk/CHANGELOG.md` to read from the checked-out SDK repository.

## Customization

### Modify the Target Repository

To change which repository receives the updates, modify the workflow file:

```yaml
- name: Checkout docs portal repo
  uses: actions/checkout@v4
  with:
    repository: your-username/your-repo-name
    token: ${{ secrets.DOCS_PORTAL_TOKEN }}
    path: ./docs-portal
```

**Note**: The target repository must be accessible with the provided token, and the token must have write permissions.

### Change the File Paths

To modify which files are processed, update the script variables:

```javascript
const SDK_CHANGELOG_PATH =
  process.env.SDK_CHANGELOG_PATH || "../sdk/CHANGELOG.md";
const RELEASE_NOTES_PATH = "./your-file-name.md";
```

### Modify the Trigger

To change when the workflow runs, update the `on` section:

```yaml
on:
  push:
    branches:
      - main
      - develop # Add more branches
    paths:
      - "CHANGELOG.md"
      - "docs/**" # Add more paths
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your token has the correct permissions
2. **Workflow Not Triggering**: Check that the file path in `paths` matches exactly
3. **Script Errors**: Verify Node.js version compatibility (requires Node 18+)

### Debug Mode

Add debug logging to the workflow:

```yaml
- name: Debug Info
  run: |
    echo "Current directory: $(pwd)"
    echo "SDK changelog path: ${{ env.SDK_CHANGELOG_PATH }}"
    ls -la
```

## Security Considerations

- The `DOCS_PORTAL_TOKEN` should have minimal required permissions (only what's needed for the docs portal repo)
- Consider using GitHub Apps instead of Personal Access Tokens for production
- Regularly rotate your tokens
- Review workflow permissions carefully
- The token will have access to create pull requests in the docs portal repository

## Contributing

Feel free to submit issues and enhancement requests!

add a change here to test