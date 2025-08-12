# **Eira Backend – AWS Deployment Guide (No Nginx)**

## **Overview**

This guide explains how to deploy **Eira Backend** on AWS EC2 securely **without** Nginx, including:

* Launching EC2
* Installing dependencies
* Securing AWS credentials
* Running the backend with PM2
* Recovering from leaked AWS keys

---

## **1. Prerequisites**

* AWS account with EC2 and IAM permissions
* Backend source code in GitHub
* Node.js and PM2 knowledge

---

## **2. Launch EC2 Instance**

1. **Instance** → Ubuntu LTS AMI
2. **Type** → t2.micro (test) or larger
3. **Key pair** → Create or use existing
4. **Security Group inbound rules**:

   * **22** (SSH) → Your IP
   * **8080** (Backend port) → Anywhere (or your client IP only)
5. Launch instance.

---

## **3. Connect to EC2**

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## **4. Install Dependencies**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git -y
sudo npm install pm2 -g
```

---

## **5. Clone & Configure App**

```bash
git clone https://github.com/your-username/EiraFlutterBackend.git
cd EiraFlutterBackend
```

**Never commit `.env` to GitHub**
Add to `.gitignore`:

```
.env
.env.*
```

---

## **6. Set Environment Variables Securely**

```bash
nano ~/.bashrc
```

Add:

```bash
export AWS_ACCESS_KEY_ID=new_access_key
export AWS_SECRET_ACCESS_KEY=new_secret_key
export OTHER_ENV_VARIABLE=value
```

Reload:

```bash
source ~/.bashrc
```

---

## **7. Handling Compromised AWS Keys**

If AWS applies **`AWSCompromisedKeyQuarantineV3`**:

1. Create a new key in **IAM → Users → eira-backend-user → Security Credentials**
2. Update EC2 with the new key (`~/.bashrc`)
3. Deactivate the old key (don’t delete yet)
4. Test backend
5. Delete old key
6. Remove quarantine policy in **IAM → Permissions → Remove**

**Clean Git history:**

```bash
git filter-repo --path .env.development --invert-paths
git push --force
```

---

## **8. Start Backend with PM2**

```bash
npm install
pm2 start server.js --name eira-backend
pm2 startup
pm2 save
```

---

## **9. Access the Backend**

The backend will be available at:

```
http://<EC2_PUBLIC_IP>:8080
```

(Replace `8080` with your app’s configured port.)

---

## **10. Security Best Practices**

* Never push `.env` to GitHub
* Rotate AWS keys regularly
* Restrict Security Group inbound rules to trusted IPs
* Use HTTPS if exposing to public clients (via ALB or CloudFront)

---

