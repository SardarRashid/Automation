# Inventory System Scripts

This directory contains utility scripts, database tools, deployment scripts, and an archive of one-time UI/Logic patch scripts that were used to refactor the codebase.

## Directory Structure

### `archive/`
Contains one-time AST mutation and code replacement scripts (e.g. `fix_excel.py`, `rewrite_ui.py`, `add_csv.py`). These scripts were run during active development to programmatically edit React files. They are kept here for historical reference but **do not need to be run again**.

### `db_tools/`
Contains tools for direct interaction with the Firebase Realtime Database.
- **`list_users_db.py`**: Queries and lists users from the RTDB.
- **`check_db*.py/js`**: Assorted snippet scripts to verify specific subsets of database entries (e.g., checking for specific domain names).
- **`create_printer.py` / `update_printer_db.py`**: Historically used to inject comma-formatted user keys for the Sticker Printer Extension. This logic is now natively integrated into `AdminPanel.tsx` and these scripts are no longer required for normal operation.

### `deploy/`
Contains scripts related to packaging and deployment.
- **`deploy.ps1`**: A PowerShell script used to deploy the frontend to Firebase Hosting.
- **`zip_workspace.py`**: A python script that packages the source code into a ZIP archive, excluding heavy directories like `node_modules` and `.git`.
