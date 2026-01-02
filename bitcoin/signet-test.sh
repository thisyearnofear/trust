#!/bin/bash
# SIGNET TEST HELPER - Generates and broadcasts test transactions
# Run this to test E2E flow: submit reputation → sign with Unisat → broadcast to Signet

set -e

NETWORK="signet"
TESTNET_RPC="http://localhost:18332"  # Bitcoin Core Signet
UNISAT_API="https://signet-api.unisat.io"  # Unisat Signet API (use this as fallback)

echo "============================================"
echo "Bitcoin Signet Test Helper"
echo "============================================"
echo "Network: $NETWORK"
echo "RPC: $TESTNET_RPC"
echo ""

# Function: Get testnet faucet sats
get_testnet_sats() {
  local address=$1
  echo "Requesting Signet testnet sats for $address..."
  # This would use a faucet API
  # For now, manual: https://signet-faucet.mempool.space/
  echo "Visit: https://signet-faucet.mempool.space/"
  echo "Enter address: $address"
}

# Function: List UTXOs
list_utxos() {
  local address=$1
  echo "UTXOs for $address:"
  curl -s "https://signet-api.unisat.io/address/$address/utxo" | jq '.'
}

# Function: Check address balance
check_balance() {
  local address=$1
  echo "Balance for $address:"
  curl -s "https://signet-api.unisat.io/address/$address" | jq '.satoshis'
}

# Function: Broadcast transaction
broadcast_tx() {
  local txhex=$1
  echo "Broadcasting transaction..."
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"txhex\":\"$txhex\"}" \
    "https://signet-api.unisat.io/tx/broadcast" | jq '.'
}

# Function: Check transaction status
check_tx_status() {
  local txid=$1
  echo "Transaction $txid status:"
  curl -s "https://signet-api.unisat.io/tx/$txid" | jq '.'
}

# Main menu
case "${1:-help}" in
  balance)
    check_balance "$2"
    ;;
  utxos)
    list_utxos "$2"
    ;;
  faucet)
    get_testnet_sats "$2"
    ;;
  broadcast)
    broadcast_tx "$2"
    ;;
  status)
    check_tx_status "$2"
    ;;
  *)
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  balance <address>        - Check wallet balance"
    echo "  utxos <address>          - List available UTXOs"
    echo "  faucet <address>         - Get testnet sats"
    echo "  broadcast <txhex>        - Broadcast signed transaction"
    echo "  status <txid>            - Check transaction status"
    echo ""
    echo "Example:"
    echo "  $0 balance tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
    echo "  $0 faucet tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
    echo ""
    exit 1
    ;;
esac
