#!/bin/bash

# Branch Status Check Script
# Run this before executing the merge strategy

echo "🔍 Branch Status Check for Vanilla Demos Project"
echo "================================================"
echo ""

# Check current branch
echo "📍 Current Branch:"
git branch --show-current
echo ""

# Show all branches with last commit
echo "📊 All Branches (with last commit):"
git branch -vv
echo ""

# Check for uncommitted changes
echo "📝 Working Directory Status:"
if [[ -z $(git status --porcelain) ]]; then
    echo "✅ Working directory is clean"
else
    echo "⚠️  WARNING: You have uncommitted changes!"
    git status --short
fi
echo ""

# Check unique commits in feature branches
echo "🔍 Checking for unique commits in feature branches..."
echo ""

echo "vanilla-only-contract-calculator unique commits:"
unique_calc=$(git log --oneline vanilla-only..vanilla-only-contract-calculator 2>/dev/null | wc -l)
if [ "$unique_calc" -eq 0 ]; then
    echo "✅ No unique commits (safe to delete)"
else
    echo "⚠️  Has $unique_calc unique commits!"
    git log --oneline vanilla-only..vanilla-only-contract-calculator | head -5
fi
echo ""

echo "vanilla-only-job-board unique commits:"
unique_job=$(git log --oneline vanilla-only..vanilla-only-job-board 2>/dev/null | wc -l)
if [ "$unique_job" -eq 0 ]; then
    echo "✅ No unique commits (safe to delete)"
else
    echo "⚠️  Has $unique_job unique commits!"
    git log --oneline vanilla-only..vanilla-only-job-board | head -5
fi
echo ""

# Check how far behind production is
echo "📈 Production branch status:"
behind=$(git rev-list --count production-deploy..vanilla-only 2>/dev/null)
ahead=$(git rev-list --count vanilla-only..production-deploy 2>/dev/null)
echo "production-deploy is $behind commits behind and $ahead commits ahead of vanilla-only"
echo ""

# Check staging status
echo "🚀 Staging branch status:"
staging_behind=$(git rev-list --count staging-deploy..vanilla-only 2>/dev/null)
staging_ahead=$(git rev-list --count vanilla-only..staging-deploy 2>/dev/null)
if [ "$staging_behind" -eq 0 ] && [ "$staging_ahead" -eq 0 ]; then
    echo "✅ staging-deploy is synchronized with vanilla-only"
else
    echo "⚠️  staging-deploy is $staging_behind commits behind and $staging_ahead commits ahead"
fi
echo ""

# Summary
echo "📋 SUMMARY"
echo "=========="
if [ "$unique_calc" -eq 0 ] && [ "$unique_job" -eq 0 ] && [[ -z $(git status --porcelain) ]]; then
    echo "✅ Safe to proceed with merge strategy"
    echo "   - Feature branches can be deleted without merging"
    echo "   - Production needs updating ($behind commits behind)"
    echo "   - Working directory is clean"
else
    echo "⚠️  Issues detected - review before proceeding"
fi
echo ""
echo "Next step: Review BRANCH_MERGE_STRATEGY.md for detailed instructions"