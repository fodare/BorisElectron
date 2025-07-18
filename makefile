# Path to your Electron build or node_modules Electron binary
CHROME_SANDBOX=./node_modules/electron/dist/chrome-sandbox

.PHONY: fix-sandbox

fix-sandbox:
	@echo "Fixing permissions for chrome-sandbox..."
	@if [ -f $(CHROME_SANDBOX) ]; then \
		sudo chown root:root $(CHROME_SANDBOX); \
		sudo chmod 4755 $(CHROME_SANDBOX); \
		echo "✔ chrome-sandbox fixed"; \
	else \
		echo "chrome-sandbox not found at $(CHROME_SANDBOX)"; \
		exit 1; \
	fi
