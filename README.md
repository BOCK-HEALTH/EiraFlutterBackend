# **Eira Backend – AWS Deployment Guide**

## **Overview**

This document explains how to deploy the Eira Backend on an **AWS EC2 instance**, connect it to AWS services, and avoid security pitfalls such as committing **AWS access keys** to GitHub.

---

## **1. Prerequisites**

* AWS account with:

  * **EC2** access
  * **IAM** access (to create/manage access keys)
* GitHub repository with the backend code
* Basic knowledge of SSH and Linux commands
* Node.js installed on EC2
* PM2 (or similar) for process management

---

## **2. Launch the EC2 Instance**

1. Go to **AWS Console → EC2 → Launch Instance**.
2. Choose **Ubuntu Server** (latest LTS recommended).
3. Select instance type (e.g., `t2.micro` for testing).
4. Create or use an existing **Key Pair** to SSH into the instance.
5. Configure **Security Group**:

   * Inbound rules:

     * **TCP 22** → your IP (SSH)
     * **TCP 8080** → `0.0.0.0/0` (or your allowed IPs)
6. Launch the instance.

---

## **3. Connect to EC2**

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## **4. Install Dependencies on EC2**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git -y
sudo npm install pm2 -g
```

---

## **5. Clone the Backend Repo**

```bash
git clone https://github.com/your-username/EiraFlutterBackend.git
cd EiraFlutterBackend
```

---

## **6. Environment Variables**

**⚠️ Never commit `.env` files to GitHub.**

### Steps:

1. On EC2, open your shell profile:

   ```bash
   nano ~/.bashrc
   ```
2. Add your secrets:

   ```bash
   export AWS_ACCESS_KEY_ID=your_new_access_key
   export AWS_SECRET_ACCESS_KEY=your_new_secret_key
   export OTHER_ENV_VARIABLE=value
   ```
3. Save & reload:

   ```bash
   source ~/.bashrc
   ```

**Add `.env` to `.gitignore` locally:**

```gitignore
.env
.env.*
```

---

## **7. Secure AWS Keys**

If AWS detects compromised keys (like `.env.development` in GitHub), it will quarantine your IAM user with a policy named:

```
AWSCompromisedKeyQuarantineV3
```

### Fix:

1. **Rotate Keys**

   * AWS Console → IAM → Users → `eira-backend-user` → Security credentials.
   * Create a **new access key**, download it, and update EC2.
   * Deactivate the old key → Test → Delete old key.

2. **Detach Quarantine Policy**

   * AWS Console → IAM → Users → `eira-backend-user` → Permissions.
   * Remove `AWSCompromisedKeyQuarantineV3`.

3. **Remove Keys from Git History**

   ```bash
   git filter-repo --path .env.development --invert-paths
   git push --force
   ```

   Or use **BFG Repo-Cleaner** to remove secrets.

---

## **8. Start the Server**

```bash
npm install
pm2 start server.js --name eira-backend
pm2 startup
pm2 save
```

---

## **9. Test in Browser**

Visit:

```
http://<EC2_PUBLIC_IP>:8080
```

You should see:

```
Eira Backend Server is running!
```

---

## **10. Common Troubleshooting**

* **Port not reachable**

  * Check EC2 Security Group inbound rules for port `8080`.
  * Check if your app is bound to `0.0.0.0` and not `localhost`.
* **Quarantined IAM user**

  * Rotate keys and remove `AWSCompromisedKeyQuarantineV3`.
* **Env variables not loading**

  * Make sure `source ~/.bashrc` is run before starting PM2.

---

## **11. Security Best Practices**

✅ Never push `.env` files to GitHub.
✅ Rotate AWS keys periodically.
✅ Restrict security group inbound rules to specific IPs when possible.
✅ Store sensitive values in environment variables or AWS SSM Parameter Store.
✅ Use HTTPS in production with a reverse proxy (e.g., Nginx + Certbot).

---


