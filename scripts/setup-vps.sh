#!/usr/bin/env bash
# ==============================================================================
# Script Cấu Hình Ban Đầu VPS Ubuntu / Debian cho SPA Lan Anh Beauty
# ==============================================================================

set -e

echo "🚀 [1/5] Cập nhật hệ thống OS..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip ufw ca-certificates gnupg lsb-release

echo "🛡️ [2/5] Cấu hình Firewall (UFW)..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

echo "🐳 [3/5] Cài đặt Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker đã được cài đặt thành công."
else
    echo "ℹ️ Docker đã có sẵn trên hệ thống."
fi

echo "💾 [4/5] Tạo Swap File (2GB) để tối ưu bộ nhớ VPS RAM nhỏ..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Đã tạo 2GB Swap memory."
fi

echo "🎉 [5/5] Hoàn tất cài đặt VPS! Vui lòng logout và login lại SSH để áp dụng quyền Docker user."
