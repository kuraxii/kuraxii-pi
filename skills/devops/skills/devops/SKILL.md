---
name: devops
description: "DevOps operations: deployment, CI/CD, Docker, Kubernetes, infrastructure as code, and server maintenance. Use for deploy, rollback, container management, and infrastructure tasks."
---

# DevOps

## Deployment

### Standard Deploy Flow

```bash
# 1. Build
npm run build

# 2. Run tests
npm test

# 3. Deploy
./scripts/deploy.sh [environment]
```

### Rollback

```bash
# Rollback to previous version
./scripts/deploy.sh rollback [version]
```

## Docker

```bash
# Build image
docker build -t myapp:latest .

# Run container
docker run -d -p 3000:3000 myapp:latest

# View logs
docker logs -f <container-id>
```

## References

See `scripts/` for deployment helpers.