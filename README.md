# DevOps Assignment Documentation

## 1. Fork and Clone the Repository

**Objective:** Set up a local copy of the project for development and deployment.

### Steps:
1. **Fork the Repository**  
   Navigate to: [https://github.com/GOPALGTM/devops-assignment.git] and click **Fork**.

2. **Clone the Forked Repository**  
   ```bash
   git clone https://github.com/deepu2899/devops-assignment.git
   cd devops-assignment
   ```

3. **Set Up Development Environment**  
   - Install Node.js and npm.  
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```
   - Install dependencies:
     ```bash
     cd frontend
     npm install
     cd ../backend
     npm install
     ```

---

## 2. Docker Image Creation

**Objective:** Containerize frontend and backend applications.

### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

# ---- Serve Stage ----
FROM nginx:stable-alpine

# Copy build artifacts into the correct directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --spider -q http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

### Backend Dockerfile (`backend/Dockerfile`)
# Use lightweight Node.js base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# ---------------------------
# Final runtime image
# ---------------------------
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only needed files from build stage
COPY --from=build /app /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001

# Expose only the required port
EXPOSE 3001

# Define healthcheck (adjust endpoint if your app exposes /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the app
CMD ["npm", "start"]### Build and Push Docker Images
```bash
# Build
docker build -t todoapplication.azurecr.io/todo-frontend:1.0.1 .
 docker build -t todoapplication.azurecr.io/todo-backend:1.0.1 .
# Push
docker push todoapplication.azurecr.io/frontend:1.0.1
 docker push todoapplication.azurecr.io/todo-backend:1.0.1
---

## 3. Kubernetes Deployment Configuration

### Backend Deployment (`backend-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
  labels:
    app: todo-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: todo-backend
  template:
    metadata:
      labels:
        app: todo-backend
    spec:
      nodeSelector:
        agentpool: backendpool   # Run only on backend pool
      containers:
        - name: backend
          image: todoapplication.azurecr.io/todo-backend:1.0.1
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: todo-backend
spec:
  selector:
    app: todo-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: LoadBalancer
### Frontend Deployment (`frontend-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-frontend
  labels:
    app: todo-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: todo-frontend
  template:
    metadata:
      labels:
        app: todo-frontend
    spec:
      containers:
        - name: frontend
          image: todoapplication.azurecr.io/todo-frontend:1.1.0   # update tag after rebuild
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 40
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend
  labels:
    app: todo-frontend
spec:
  type: LoadBalancer
  selector:
    app: todo-frontend
  ports:
    - name: http
      port: 80
      targetPort: 80
---

## 4. Health Checks

- **Readiness Probe:** Ensures the application is ready to serve requests.  
- **Liveness Probe:** Ensures the application is alive and restarts if it fails.  

Configured in the deployment YAMLs above.

---

## 5. Autoscaling

**Objective:** Enable automatic scaling based on CPU usage.

### Configure Horizontal Pod Autoscaler (HPA)
1.frontend-hpa.yaml
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: todo-frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-frontend
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```
2.backend.hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: todo-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

### Verify HPA
```bash
kubectl get hpa
```

---

## 6. Summary of Changes

- Dockerfiles created for frontend and backend.  
- Docker images built and pushed to Docker Hub.  
- Kubernetes deployment and service manifests created.  
- Readiness and liveness probes configured.  
- Horizontal Pod Autoscaling (HPA) configured for scaling.

**Submission Includes:**  
- Dockerfiles  
- Kubernetes YAMLs  
 

---

link of the video : https://drive.google.com/file/d/1ysDQpEZuJYyjTi6w91L-wTrBEUrrL5Ao/view?usp=sharing
