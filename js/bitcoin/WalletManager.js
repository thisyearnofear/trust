/**
 * CONSOLIDATED WALLET MANAGER
 * Single source of truth for wallet state and connections
 */

class WalletManager {
  constructor() {
    this.connected = false;
    this.address = null;
    this.walletType = null;
    this.provider = null;
  }

  /**
   * Detect and connect to available wallet
   */
  async connect() {
    if (this.connected) {
      console.log("[WalletManager] Already connected:", this.address);
      return { address: this.address, type: this.walletType };
    }

    // Try Unisat
    if (typeof window.unisat !== "undefined") {
      try {
        console.log("[WalletManager] Connecting to Unisat...");
        const accounts = await window.unisat.requestAccounts();
        if (accounts && accounts.length > 0) {
          this.address = accounts[0];
          this.walletType = "unisat";
          this.provider = window.unisat;
          this.connected = true;
          console.log("[WalletManager] Unisat connected:", this.address);
          return { address: this.address, type: this.walletType };
        }
      } catch (error) {
        console.warn("[WalletManager] Unisat connection failed:", error);
      }
    }

    // Try Leather
    if (typeof window.LeatherProvider !== "undefined") {
      try {
        console.log("[WalletManager] Connecting to Leather...");
        const response = await window.LeatherProvider.request('getAddresses');
        if (response?.result?.addresses?.length > 0) {
          const btcAddress = response.result.addresses.find(addr => 
            addr.type === 'p2wpkh' || addr.type === 'p2tr'
          );
          if (btcAddress) {
            this.address = btcAddress.address;
            this.walletType = "leather";
            this.provider = window.LeatherProvider;
            this.connected = true;
            console.log("[WalletManager] Leather connected:", this.address);
            return { address: this.address, type: this.walletType };
          }
        }
      } catch (error) {
        console.warn("[WalletManager] Leather connection failed:", error);
      }
    }

    throw new Error("No supported wallet found. Please install Unisat or Leather.");
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.connected = false;
    this.address = null;
    this.walletType = null;
    this.provider = null;
    console.log("[WalletManager] Disconnected");
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      address: this.address,
      type: this.walletType
    };
  }
}

// Global singleton instance
window.walletManager = new WalletManager();
