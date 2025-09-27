# AWS Account Setup Guide for Developers

## Overview
This guide provides step-by-step instructions for setting up an AWS account and providing developer access. Follow these steps to establish AWS infrastructure access for the LocumCalc platform.

## Step 1: Create AWS Account

### 1.1 Account Registration
1. **Visit AWS Sign-up**: Go to [aws.amazon.com](https://aws.amazon.com)
2. **Click "Create an AWS Account"**
3. **Enter Account Details**:
   - Email address (use business email)
   - Password (strong, 12+ characters)
   - AWS account name (e.g., "LocumCalc Production")

### 1.2 Contact Information
4. **Select Account Type**: Choose "Business" for commercial use
5. **Enter Business Information**:
   - Full legal business name
   - Phone number
   - Address (complete and accurate)
   - Agreement to AWS Customer Agreement

### 1.3 Payment Information
6. **Add Payment Method**:
   - Credit card or bank account
   - AWS will charge $1 for verification (refunded)
   - Required even for Free Tier usage

### 1.4 Identity Verification
7. **Phone Verification**:
   - AWS will call your phone number
   - Enter PIN displayed on screen when prompted
   - Process takes 1-2 minutes

### 1.5 Support Plan Selection
8. **Choose Support Plan**:
   - **Basic Support**: Free (recommended for development)
   - **Developer Support**: $29/month (optional)
   - **Business Support**: $100/month (for production)

### 1.6 Account Activation
9. **Wait for Activation**: Takes 10-24 hours
10. **Confirmation Email**: You'll receive activation confirmation
11. **Sign In**: Access AWS Management Console at [console.aws.amazon.com](https://console.aws.amazon.com)

## Step 2: Initial Account Security

### 2.1 Root Account Security
1. **Enable MFA (Multi-Factor Authentication)**:
   - Go to "Security Credentials" 
   - Click "Assign MFA Device"
   - Use Google Authenticator or hardware device
   - **CRITICAL**: Never share root account credentials

### 2.2 Create Account Alias
2. **Set Account Alias**:
   - Go to IAM Dashboard
   - Click "Create" next to Account Alias
   - Choose memorable name (e.g., "locumcalc-main")

## Step 3: Create Developer IAM User

### 3.1 Access IAM Console
1. **Navigate to IAM**:
   - In AWS Console, search "IAM"
   - Click "Identity and Access Management"

### 3.2 Create New User
2. **Add User**:
   - Click "Users" → "Add User"
   - **Username**: Use developer's name (e.g., "mike-developer")
   - **Access Type**: Check both:
     - ✅ Programmatic access (API keys)
     - ✅ AWS Management Console access

### 3.3 Set Permissions
3. **Attach Policies**:
   - Click "Attach existing policies directly"
   - **For Full Developer Access**, select:
     - ✅ `AdministratorAccess` (full AWS access)
   - **For Limited Developer Access**, select:
     - ✅ `PowerUserAccess` (everything except IAM)
     - ✅ `IAMReadOnlyAccess` (view IAM resources)

### 3.4 Review and Create
4. **Configure Details**:
   - **Tags** (optional): Department=Engineering, Role=Developer
   - **Review**: Verify permissions
   - **Create User**

### 3.5 Save Credentials
5. **Download Credentials**:
   - ⚠️ **CRITICAL**: Download CSV with Access Keys
   - **Access Key ID**: For API access
   - **Secret Access Key**: For API access  
   - **Console Password**: For web access
   - **Console Login URL**: Custom URL for account

## Step 4: Developer Access Configuration

### 4.1 Console Access
```
Console Login URL: https://[ACCOUNT-ALIAS].signin.aws.amazon.com/console
Username: [DEVELOPER-USERNAME]
Password: [TEMPORARY-PASSWORD]
```

### 4.2 API Access (for CLI/SDK)
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS CLI
aws configure
# Enter:
# AWS Access Key ID: [FROM-CSV]
# AWS Secret Access Key: [FROM-CSV]  
# Default region: us-east-1
# Default output format: json
```

### 4.3 Environment Variables (Alternative)
```bash
export AWS_ACCESS_KEY_ID="[ACCESS-KEY-ID]"
export AWS_SECRET_ACCESS_KEY="[SECRET-ACCESS-KEY]"
export AWS_DEFAULT_REGION="us-east-1"
```

## Step 5: Security Best Practices

### 5.1 Developer Account Security
1. **Force Password Change**: Developer must change password on first login
2. **Enable MFA**: Developer should enable MFA on their account
3. **Regular Key Rotation**: Rotate access keys every 90 days

### 5.2 Access Monitoring
4. **CloudTrail**: Enable for API call logging
5. **Cost Alerts**: Set up billing alerts
6. **Access Review**: Regularly review IAM permissions

## Step 6: Cost Management

### 6.1 Free Tier Monitoring
1. **Set Up Alerts**:
   - Go to Billing Dashboard
   - Create billing alerts at $10, $50, $100
   - Monitor Free Tier usage

### 6.2 Resource Tagging
2. **Tag All Resources**:
   - Environment: dev/staging/production  
   - Project: locumcalc
   - Owner: [developer-name]

## Common Services for LocumCalc

### Development Environment
- **EC2**: Virtual servers for application hosting
- **RDS**: Managed PostgreSQL database
- **S3**: File storage for uploads/exports
- **Route 53**: DNS management
- **CloudFront**: CDN for static assets
- **SES**: Email service for notifications

### Estimated Monthly Costs (Development)
- **EC2 t3.micro**: $8-12/month
- **RDS db.t3.micro**: $15-20/month  
- **S3 Storage**: $1-5/month
- **Route 53**: $0.50/month
- **Total**: ~$25-40/month

## Troubleshooting

### Account Issues
- **Activation Delays**: Contact AWS Support if >24 hours
- **Payment Verification**: Check credit card/bank statement
- **Region Access**: Some regions require special approval

### Access Issues  
- **IAM Permissions**: Verify policies are attached correctly
- **MFA Problems**: Ensure time sync on authenticator app
- **API Access**: Check access keys in AWS CLI configuration

## Security Checklist

- [ ] Root account MFA enabled
- [ ] Root account credentials secured (not shared)
- [ ] Developer IAM user created with appropriate permissions
- [ ] Developer MFA enabled
- [ ] Access keys downloaded and secured
- [ ] CloudTrail enabled for audit logging
- [ ] Billing alerts configured
- [ ] Account alias set for easy identification

## Next Steps

After completing AWS setup:
1. **Set up development environment** (EC2, RDS)
2. **Configure CI/CD pipeline** (CodePipeline, CodeBuild)
3. **Implement monitoring** (CloudWatch)
4. **Set up staging environment**
5. **Plan production deployment strategy**

## Support Resources

- **AWS Documentation**: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- **AWS Support**: Available through AWS Console
- **AWS Training**: [aws.amazon.com/training](https://aws.amazon.com/training)
- **AWS Architecture Center**: [aws.amazon.com/architecture](https://aws.amazon.com/architecture)

---

**⚠️ Security Warning**: Never commit AWS credentials to code repositories. Use environment variables or AWS IAM roles for production applications.