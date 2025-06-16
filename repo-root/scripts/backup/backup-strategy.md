# Backup and Disaster Recovery Strategy

## Overview
This document outlines the comprehensive backup and disaster recovery strategy for LocumTrueRate.com, ensuring business continuity and data protection.

## Backup Strategy

### 1. Database Backups (PostgreSQL/Neon)

#### Automated Backups
- **Frequency**: Every 6 hours (4x daily)
- **Retention**: 
  - Daily backups: 7 days
  - Weekly backups: 4 weeks
  - Monthly backups: 12 months
- **Storage**: Cloudflare R2 (georeplicated)
- **Encryption**: AES-256 at rest

#### Point-in-Time Recovery (PITR)
- **Enabled**: Yes (Neon built-in)
- **Recovery window**: 7 days
- **RPO**: < 5 minutes
- **RTO**: < 30 minutes

### 2. Application Data Backups

#### User-Generated Content
- **Assets**: Profile images, resumes, company logos
- **Storage**: Cloudflare R2 with versioning
- **Replication**: Cross-region (US-East, US-West, EU)
- **Retention**: Indefinite with lifecycle policies

#### Configuration & Secrets
- **Method**: Git-crypt for sensitive configs
- **Backup**: Encrypted copies in separate vault
- **Access**: Multi-factor authentication required

### 3. Code Repository Backups
- **Primary**: GitHub (main repository)
- **Mirror**: GitLab (automated sync every hour)
- **Local**: Weekly encrypted archives to R2

## Disaster Recovery Plan

### Recovery Scenarios

#### 1. Database Failure
```bash
# Immediate recovery from Neon PITR
neon restore --branch=main --timestamp="2024-01-15T10:00:00Z"

# Alternative: Restore from R2 backup
aws s3 cp s3://backups/db/latest.dump ./
pg_restore -d postgres://... latest.dump
```

#### 2. Regional Outage
- **Primary Region Down**: Automatic failover to secondary region
- **DNS Failover**: Cloudflare Load Balancer (< 30 seconds)
- **Data Sync**: Real-time replication between regions

#### 3. Complete Platform Failure
- **Recovery Time**: < 4 hours
- **Recovery Process**:
  1. Provision new infrastructure (Terraform)
  2. Restore database from latest backup
  3. Deploy application from Git
  4. Restore R2 assets
  5. Update DNS records

### Recovery Priorities

1. **Critical (< 1 hour)**
   - Authentication system
   - Job listings database
   - Payment processing

2. **High (< 4 hours)**
   - Application system
   - Email notifications
   - Analytics

3. **Medium (< 24 hours)**
   - Historical data
   - Archived jobs
   - Old applications

## Backup Automation Scripts

### Daily Backup Script
Location: `/scripts/backup/daily-backup.sh`

### Validation Script
Location: `/scripts/backup/validate-backup.sh`

### Recovery Script
Location: `/scripts/backup/disaster-recovery.sh`

## Testing Schedule

### Monthly Tests
- Restore database to staging environment
- Verify data integrity
- Test application functionality

### Quarterly Tests
- Full disaster recovery drill
- Regional failover test
- Recovery time measurement

### Annual Tests
- Complete platform recovery
- Cross-region failover
- Business continuity validation

## Monitoring & Alerts

### Backup Monitoring
- **Success Rate**: > 99.9% target
- **Alert Channels**: Email, Slack, PagerDuty
- **Metrics Dashboard**: Grafana

### Health Checks
- Database replication lag
- Backup job completion
- Storage utilization
- Recovery point age

## Compliance & Security

### Data Protection
- **Encryption**: All backups encrypted at rest
- **Access Control**: Role-based access with audit logs
- **Compliance**: HIPAA-ready infrastructure

### Audit Trail
- All backup operations logged
- Recovery attempts tracked
- Access logs retained for 1 year

## Cost Optimization

### Storage Tiers
- **Hot**: Last 7 days (instant access)
- **Cool**: 7-30 days (< 1 hour access)
- **Archive**: > 30 days (< 24 hour access)

### Estimated Costs
- Database backups: ~$50/month
- R2 storage: ~$100/month
- Cross-region replication: ~$75/month
- **Total**: ~$225/month

## Documentation

### Runbooks
1. Database Recovery Runbook
2. Application Recovery Runbook
3. Regional Failover Runbook
4. Complete Disaster Recovery Runbook

### Contact Information
- **Primary DBA**: on-call rotation
- **Infrastructure Team**: 24/7 coverage
- **Executive Escalation**: defined chain

## Review & Updates

- **Strategy Review**: Quarterly
- **Runbook Updates**: After each test
- **Technology Assessment**: Annually

---

*Last Updated: January 2024*
*Next Review: April 2024*