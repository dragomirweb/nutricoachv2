# System Architecture Design

This document provides a comprehensive overview of the NutriCoach v2 system architecture, including all components, data flows, and integration points.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js 15.4.1]
        MOBILE[Mobile PWA]
    end
    
    subgraph "Edge Layer"
        CDN[Vercel Edge Network]
        MW[Middleware<br/>Auth & Rate Limiting]
    end
    
    subgraph "Application Layer"
        NEXT[Next.js App Router]
        API[tRPC API v11]
        AUTH[Better Auth v1.2.9]
    end
    
    subgraph "Service Layer"
        MEAL[Meal Service]
        NUTRITION[Nutrition Service]
        USER[User Service]
        AI[AI Service]
    end
    
    subgraph "Queue Layer"
        REDIS[(Redis)]
        BULL[BullMQ Workers]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        S3[Object Storage]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
        EMAIL[Email Service]
        OAUTH[OAuth Providers]
    end
    
    WEB --> CDN
    MOBILE --> CDN
    CDN --> MW
    MW --> NEXT
    NEXT --> API
    API --> AUTH
    API --> MEAL
    API --> NUTRITION
    API --> USER
    MEAL --> AI
    AI --> BULL
    BULL --> REDIS
    BULL --> OPENAI
    AUTH --> PG
    MEAL --> PG
    NUTRITION --> PG
    USER --> PG
    USER --> S3
    AUTH --> OAUTH
    BULL --> EMAIL
```

## Component Architecture

### Frontend Architecture

```mermaid
graph TD
    subgraph "Next.js App Structure"
        APP[App Router]
        PAGES[Pages]
        COMPONENTS[Components]
        HOOKS[Custom Hooks]
        UTILS[Utilities]
    end
    
    subgraph "State Management"
        RQ[React Query]
        TRPC[tRPC Client]
        CONTEXT[React Context]
    end
    
    subgraph "UI Layer"
        TAILWIND[Tailwind CSS v4]
        RADIX[Radix UI]
        COMPONENTS
    end
    
    APP --> PAGES
    PAGES --> COMPONENTS
    COMPONENTS --> HOOKS
    HOOKS --> TRPC
    TRPC --> RQ
    COMPONENTS --> TAILWIND
    COMPONENTS --> RADIX
```

### Backend Architecture

```mermaid
graph LR
    subgraph "API Layer"
        ROUTER[tRPC Router]
        PROC[Procedures]
        MW2[Middleware]
    end
    
    subgraph "Business Logic"
        SVC[Services]
        REPO[Repositories]
        VALID[Validators]
    end
    
    subgraph "Infrastructure"
        DB[Database]
        CACHE[Cache]
        QUEUE[Job Queue]
    end
    
    ROUTER --> PROC
    PROC --> MW2
    MW2 --> SVC
    SVC --> REPO
    SVC --> VALID
    REPO --> DB
    SVC --> CACHE
    SVC --> QUEUE
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant BetterAuth
    participant Database
    participant OAuth
    
    alt Email/Password Login
        User->>Browser: Enter credentials
        Browser->>NextJS: POST /api/auth/signin
        NextJS->>BetterAuth: Validate credentials
        BetterAuth->>Database: Check user/password
        Database-->>BetterAuth: User data
        BetterAuth->>Database: Create session
        BetterAuth-->>NextJS: Session token
        NextJS-->>Browser: Set cookie
        Browser-->>User: Redirect to dashboard
    else OAuth Login
        User->>Browser: Click OAuth provider
        Browser->>NextJS: GET /api/auth/oauth/github
        NextJS->>OAuth: Redirect to provider
        OAuth-->>User: Consent screen
        User->>OAuth: Approve
        OAuth-->>NextJS: Callback with code
        NextJS->>BetterAuth: Exchange code
        BetterAuth->>OAuth: Get user info
        OAuth-->>BetterAuth: User profile
        BetterAuth->>Database: Create/update user
        BetterAuth->>Database: Create session
        BetterAuth-->>NextJS: Session token
        NextJS-->>Browser: Set cookie
        Browser-->>User: Redirect to dashboard
    end
```

## Data Flow Architecture

### Real-time Data Flow

```mermaid
graph LR
    subgraph "Client"
        UI[UI Component]
        HOOK[useQuery Hook]
        CACHE1[Query Cache]
    end
    
    subgraph "Server"
        TRPC2[tRPC Endpoint]
        SERVICE[Service Layer]
        DB2[(Database)]
    end
    
    UI --> HOOK
    HOOK --> CACHE1
    CACHE1 --> TRPC2
    TRPC2 --> SERVICE
    SERVICE --> DB2
    
    DB2 -.-> SERVICE
    SERVICE -.-> TRPC2
    TRPC2 -.-> CACHE1
    CACHE1 -.-> HOOK
    HOOK -.-> UI
```

### Background Job Processing

```mermaid
stateDiagram-v2
    [*] --> Queued
    Queued --> Processing
    Processing --> Completed
    Processing --> Failed
    Failed --> Retry
    Retry --> Processing
    Retry --> Dead_Letter
    Completed --> [*]
    Dead_Letter --> Manual_Review
    Manual_Review --> [*]
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Vercel"
            EDGE[Edge Functions]
            SERVERLESS[Serverless Functions]
            STATIC[Static Assets]
        end
        
        subgraph "Database Cluster"
            PRIMARY[(Primary DB)]
            REPLICA1[(Read Replica 1)]
            REPLICA2[(Read Replica 2)]
        end
        
        subgraph "Redis Cluster"
            REDIS1[Redis Primary]
            REDIS2[Redis Replica]
        end
        
        subgraph "Background Workers"
            WORKER1[Worker 1]
            WORKER2[Worker 2]
            WORKER3[Worker 3]
        end
    end
    
    EDGE --> SERVERLESS
    SERVERLESS --> PRIMARY
    SERVERLESS --> REPLICA1
    SERVERLESS --> REPLICA2
    SERVERLESS --> REDIS1
    REDIS1 --> REDIS2
    WORKER1 --> REDIS1
    WORKER2 --> REDIS1
    WORKER3 --> REDIS1
    WORKER1 --> PRIMARY
```

## Security Architecture

```mermaid
graph TD
    subgraph "Security Layers"
        WAF[Web Application Firewall]
        DDOS[DDoS Protection]
        SSL[SSL/TLS Termination]
        
        subgraph "Application Security"
            AUTH_MW[Auth Middleware]
            RATE[Rate Limiting]
            CSRF[CSRF Protection]
            CSP[Content Security Policy]
        end
        
        subgraph "Data Security"
            ENCRYPT[Encryption at Rest]
            ROW_SEC[Row Level Security]
            AUDIT[Audit Logging]
        end
    end
    
    WAF --> DDOS
    DDOS --> SSL
    SSL --> AUTH_MW
    AUTH_MW --> RATE
    RATE --> CSRF
    CSRF --> CSP
    CSP --> ENCRYPT
    ENCRYPT --> ROW_SEC
    ROW_SEC --> AUDIT
```

## Module Architecture

```mermaid
graph TD
    subgraph "Feature Modules"
        subgraph "Auth Module"
            AUTH_ROUTER[Router]
            AUTH_SERVICE[Service]
            AUTH_UI[UI Components]
        end
        
        subgraph "Meals Module"
            MEAL_ROUTER[Router]
            MEAL_SERVICE[Service]
            MEAL_REPO[Repository]
            MEAL_UI[UI Components]
        end
        
        subgraph "Nutrition Module"
            NUTR_ROUTER[Router]
            NUTR_SERVICE[Service]
            NUTR_CALC[Calculator]
            NUTR_UI[UI Components]
        end
        
        subgraph "User Module"
            USER_ROUTER[Router]
            USER_SERVICE[Service]
            USER_REPO[Repository]
            USER_UI[UI Components]
        end
    end
    
    subgraph "Shared Infrastructure"
        SHARED_DB[Database]
        SHARED_CACHE[Cache]
        SHARED_QUEUE[Queue]
        SHARED_UTILS[Utilities]
    end
    
    AUTH_SERVICE --> SHARED_DB
    MEAL_SERVICE --> SHARED_DB
    NUTR_SERVICE --> SHARED_CACHE
    USER_SERVICE --> SHARED_DB
    MEAL_SERVICE --> SHARED_QUEUE
```

## Performance Architecture

### Caching Strategy

```mermaid
graph LR
    subgraph "Cache Layers"
        BROWSER[Browser Cache]
        CDN_CACHE[CDN Cache]
        QUERY_CACHE[Query Cache]
        REDIS_CACHE[Redis Cache]
        DB_CACHE[DB Query Cache]
    end
    
    REQUEST[Request] --> BROWSER
    BROWSER -->|Miss| CDN_CACHE
    CDN_CACHE -->|Miss| QUERY_CACHE
    QUERY_CACHE -->|Miss| REDIS_CACHE
    REDIS_CACHE -->|Miss| DB_CACHE
    DB_CACHE -->|Miss| DATABASE[(Database)]
```

### Load Balancing

```mermaid
graph TD
    subgraph "Load Distribution"
        LB[Load Balancer]
        
        subgraph "Application Instances"
            APP1[Instance 1]
            APP2[Instance 2]
            APP3[Instance 3]
        end
        
        subgraph "Database Connections"
            POOL1[Connection Pool 1]
            POOL2[Connection Pool 2]
            POOL3[Connection Pool 3]
        end
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> POOL1
    APP2 --> POOL2
    APP3 --> POOL3
```

## Error Handling Architecture

```mermaid
flowchart TD
    ERROR[Error Occurs]
    
    ERROR --> TYPE{Error Type}
    
    TYPE -->|Client| CLIENT_HANDLER[Client Error Handler]
    TYPE -->|Server| SERVER_HANDLER[Server Error Handler]
    TYPE -->|Network| NETWORK_HANDLER[Network Error Handler]
    
    CLIENT_HANDLER --> LOG_CLIENT[Log to Console]
    CLIENT_HANDLER --> UI_FEEDBACK[Show User Feedback]
    
    SERVER_HANDLER --> LOG_SERVER[Log to Server]
    SERVER_HANDLER --> SENTRY[Send to Sentry]
    SERVER_HANDLER --> RETRY{Retryable?}
    
    NETWORK_HANDLER --> OFFLINE[Offline Queue]
    NETWORK_HANDLER --> RETRY
    
    RETRY -->|Yes| BACKOFF[Exponential Backoff]
    RETRY -->|No| FAIL[Return Error]
    
    BACKOFF --> ATTEMPT[Retry Attempt]
    ATTEMPT -->|Success| SUCCESS[Continue]
    ATTEMPT -->|Fail| ERROR
```

## Development Workflow

```mermaid
gitGraph
    commit id: "main"
    branch develop
    checkout develop
    commit id: "feature-start"
    
    branch feature/meal-ai
    checkout feature/meal-ai
    commit id: "add-ai-parsing"
    commit id: "add-tests"
    commit id: "fix-bugs"
    
    checkout develop
    merge feature/meal-ai
    
    branch release/v1.2
    checkout release/v1.2
    commit id: "version-bump"
    commit id: "release-notes"
    
    checkout main
    merge release/v1.2 tag: "v1.2.0"
    
    checkout develop
    merge release/v1.2
```

## Monitoring Architecture

```mermaid
graph TD
    subgraph "Application Metrics"
        APP_LOGS[Application Logs]
        APP_METRICS[Performance Metrics]
        APP_ERRORS[Error Tracking]
    end
    
    subgraph "Infrastructure Metrics"
        SERVER_METRICS[Server Metrics]
        DB_METRICS[Database Metrics]
        QUEUE_METRICS[Queue Metrics]
    end
    
    subgraph "Business Metrics"
        USER_ANALYTICS[User Analytics]
        FEATURE_USAGE[Feature Usage]
        API_USAGE[API Usage]
    end
    
    subgraph "Monitoring Stack"
        COLLECTOR[Metrics Collector]
        STORAGE[Time Series DB]
        ALERTS[Alert Manager]
        DASHBOARD[Dashboards]
    end
    
    APP_LOGS --> COLLECTOR
    APP_METRICS --> COLLECTOR
    APP_ERRORS --> COLLECTOR
    SERVER_METRICS --> COLLECTOR
    DB_METRICS --> COLLECTOR
    QUEUE_METRICS --> COLLECTOR
    USER_ANALYTICS --> COLLECTOR
    FEATURE_USAGE --> COLLECTOR
    API_USAGE --> COLLECTOR
    
    COLLECTOR --> STORAGE
    STORAGE --> ALERTS
    STORAGE --> DASHBOARD
```

## Scalability Considerations

### Horizontal Scaling

```mermaid
graph LR
    subgraph "Current State"
        APP_SINGLE[Single Instance]
        DB_SINGLE[(Single DB)]
        CACHE_SINGLE[Single Cache]
    end
    
    subgraph "Scaled State"
        LB2[Load Balancer]
        APP_MULTI1[App Instance 1]
        APP_MULTI2[App Instance 2]
        APP_MULTI3[App Instance 3]
        DB_PRIMARY[(Primary DB)]
        DB_READ1[(Read Replica 1)]
        DB_READ2[(Read Replica 2)]
        CACHE_CLUSTER[Redis Cluster]
    end
    
    APP_SINGLE -.->|Scale Out| LB2
    LB2 --> APP_MULTI1
    LB2 --> APP_MULTI2
    LB2 --> APP_MULTI3
    
    DB_SINGLE -.->|Replicate| DB_PRIMARY
    DB_PRIMARY --> DB_READ1
    DB_PRIMARY --> DB_READ2
    
    CACHE_SINGLE -.->|Cluster| CACHE_CLUSTER
```

### Database Sharding Strategy

```mermaid
graph TD
    subgraph "Sharding by User ID"
        ROUTER[Shard Router]
        
        subgraph "Shard 1"
            DB1[(Users 0-999999)]
        end
        
        subgraph "Shard 2"
            DB2[(Users 1000000-1999999)]
        end
        
        subgraph "Shard 3"
            DB3[(Users 2000000-2999999)]
        end
    end
    
    REQUEST[User Request] --> ROUTER
    ROUTER -->|Hash(UserID)| DB1
    ROUTER -->|Hash(UserID)| DB2
    ROUTER -->|Hash(UserID)| DB3
```

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 15.4.1 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS v4
- **State Management**: React Query + tRPC
- **Forms**: React Hook Form + Zod
- **Components**: Radix UI + Custom

### Backend
- **Runtime**: Node.js 20 LTS
- **API**: tRPC v11
- **Authentication**: Better Auth v1.2.9
- **Database**: PostgreSQL 15 + Drizzle ORM
- **Caching**: Redis 7
- **Queue**: BullMQ
- **File Storage**: S3-compatible

### Infrastructure
- **Hosting**: Vercel (Edge Functions)
- **Database**: Vercel Postgres / Supabase
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions

### External Services
- **AI**: OpenAI GPT-4
- **Email**: SendGrid / Resend
- **OAuth**: GitHub, Google
- **Analytics**: PostHog