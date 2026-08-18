# Secret Alert Remediation

Date: 2026-08-18

## Current Worktree

- The Firebase web configuration in `frontpage/src/lib/firebase.ts` now reads from Vite environment variables.
- `frontpage/.env.example` contains empty variable placeholders only.
- Private-key file extensions and service-account JSON naming patterns are ignored by Git.
- The current worktree has no detected Google API key or private-key material outside ignored dependency folders.

## GitHub Alerts That Need Owner Action

Deleting a secret from the current branch does not revoke it or erase it from Git history. For the three GitHub alerts shown in the screenshot:

1. Revoke both Google API keys in Google Cloud Console, then create replacement keys only if they are still needed.
2. Restrict any replacement browser key by HTTP referrer and limit it to the required Google APIs.
3. Delete the exposed GitHub SSH key from the GitHub account or organization, generate a new key pair, and update trusted machines or deployment providers.
4. In GitHub secret-scanning alerts, mark each alert as revoked after rotation.

## History Cleanup

The SSH key was committed under `frontpage/node_modules/public-encrypt/test/test_rsa_privkey.pem` in repository history. The historical Firebase path also appears in prior commits. These alerts remain open until the exposed credentials are revoked; rewriting published history is optional but recommended for the SSH-key blob.

History rewriting changes commit IDs and requires a coordinated force-push. Do not run it until all contributors have stopped pushing and a backup exists.
