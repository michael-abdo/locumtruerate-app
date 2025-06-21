# Cloudflare API Token Permissions for Pages Deployment

## Required Permissions

When creating your API token at https://dash.cloudflare.com/profile/api-tokens, select these permissions:

### 1. **Account Permissions**
- **Account** → `Cloudflare Pages:Edit` ✅ (REQUIRED)
- **Account** → `Account Settings:Read` (optional but recommended)

### 2. **User Permissions**
- **User** → `User Details:Read` (recommended)
- **User** → `Memberships:Read` (recommended)

### 3. **Zone Permissions** (if using custom domain)
- **Zone** → `Zone:Read` 
- **Zone** → `DNS:Edit` (if managing DNS records)
- **Zone** → `Page Rules:Edit` (if using page rules)

## Quick Setup Instructions

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the **"Edit Cloudflare Pages"** template (if available)
   
   OR manually configure:
   
4. **Token name**: `LocumTrueRate Pages Deployment`
5. **Permissions**:
   - Add → Account → `Cloudflare Pages:Edit`
   - Add → User → `User Details:Read`
   - Add → User → `Memberships:Read`
6. **Account Resources**: 
   - Include → Your specific account
7. **IP Filtering** (optional): Add your deployment server IPs
8. **TTL**: Set expiration as needed

## Minimal Required Permission

At minimum, you only need:
- **Account** → `Cloudflare Pages:Edit`

This single permission will allow:
- Creating Pages projects
- Deploying to Pages
- Managing Pages settings

## Testing Your Token

After creating, test with:
```bash
export CLOUDFLARE_API_TOKEN="your-new-token"
wrangler whoami
```

You should see your account details without authentication errors.

## Security Best Practices

1. **Limit scope**: Only add permissions you need
2. **Set TTL**: Add expiration date for tokens
3. **IP restrictions**: Limit to deployment servers if possible
4. **Separate tokens**: Use different tokens for dev/staging/prod
5. **Rotate regularly**: Update tokens periodically

## Example Token Summary

```
Token Name: LocumTrueRate Pages Deployment
Permissions:
  ✅ Account - Cloudflare Pages:Edit
  ✅ User - User Details:Read  
  ✅ User - Memberships:Read
Account Resources: 9130901762195117cb17491a6616b071
Status: Active
```