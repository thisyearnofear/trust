# Bitcoin Evolution of Trust - Charms Smart Contract Deployment
# Builds and runs the trust-game Charms contract

FROM rust:latest

# Set working directory
WORKDIR /app

# Copy Charms app
COPY charm-apps/trust-game /app

# Install dependencies
RUN apt-get update && \
    apt-get install -y build-essential && \
    rm -rf /var/lib/apt/lists/*

# Build the contract
RUN cargo build --release

# Create contract verification key
RUN cargo test --release

# Contract is built in target/release/libtrust_game.so
# This can be deployed to Charms network

EXPOSE 8000

# Default: build the contract
CMD ["cargo", "build", "--release"]

# To run tests: docker run trust-game cargo test --release
# To deploy: extract target/release/libtrust_game.so and deploy via Charms CLI
