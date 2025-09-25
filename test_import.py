import sys
print("Attempting to import google.genai...")
try:
    from google import genai
    print("Successfully imported google.genai.")
except Exception as e:
    print(f"An error occurred during import: {e}", file=sys.stderr)
    sys.exit(1)
print("Script finished.")
sys.exit(0)