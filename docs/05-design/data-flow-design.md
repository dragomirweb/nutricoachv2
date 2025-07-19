# Data Flow Design

This document details how data flows through the NutriCoach v2 system, including real-time operations, background processing, and data synchronization patterns.

## Core Data Flows

### User Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant BetterAuth
    participant DB
    participant Email
    participant Redis

    Client->>API: POST /signup
    API->>API: Validate input (Zod)
    API->>BetterAuth: Create user
    BetterAuth->>DB: Check email exists
    DB-->>BetterAuth: Not exists
    BetterAuth->>DB: BEGIN TRANSACTION
    BetterAuth->>DB: INSERT user
    BetterAuth->>DB: INSERT account
    BetterAuth->>DB: INSERT verification
    BetterAuth->>DB: COMMIT
    BetterAuth->>Redis: Queue welcome email
    BetterAuth-->>API: User created
    API-->>Client: Success + Session

    Note over Redis,Email: Async Process
    Redis->>Email: Send welcome email
    Email-->>Redis: Sent confirmation
```

### Meal Creation with AI Flow

```mermaid
flowchart TD
    START[User enters meal description]

    START --> VALIDATE{Valid input?}
    VALIDATE -->|No| ERROR1[Show validation error]
    VALIDATE -->|Yes| CREATE_MEAL[Create meal record]

    CREATE_MEAL --> STORE_DB[(Store in DB<br/>status: pending)]
    STORE_DB --> QUEUE_JOB[Queue AI job]
    QUEUE_JOB --> RETURN_ID[Return meal ID to user]

    QUEUE_JOB --> AI_WORKER[AI Worker picks up job]
    AI_WORKER --> CALL_OPENAI[Call OpenAI API]
    CALL_OPENAI --> PARSE_RESPONSE[Parse AI response]

    PARSE_RESPONSE --> VALIDATE_NUTRITION{Valid nutrition data?}
    VALIDATE_NUTRITION -->|No| FALLBACK[Use fallback parsing]
    VALIDATE_NUTRITION -->|Yes| CALCULATE[Calculate totals]

    FALLBACK --> CALCULATE
    CALCULATE --> UPDATE_DB[(Update meal<br/>status: completed)]
    UPDATE_DB --> CREATE_ITEMS[(Create food items)]
    CREATE_ITEMS --> INVALIDATE_CACHE[Invalidate cache]
    INVALIDATE_CACHE --> NOTIFY_CLIENT[Notify client]

    ERROR1 --> END1[End]
    RETURN_ID --> END2[End]
    NOTIFY_CLIENT --> END3[End]
```

### Real-time Data Synchronization

```mermaid
graph TB
    subgraph "Client Side"
        COMPONENT[React Component]
        HOOK[useQuery Hook]
        CACHE[React Query Cache]
        OPTIMISTIC[Optimistic Update]
    end

    subgraph "Network Layer"
        TRPC[tRPC Client]
        HTTP[HTTP Request]
        WS[WebSocket<br/>Future]
    end

    subgraph "Server Side"
        ROUTER[tRPC Router]
        PROCEDURE[Procedure]
        SERVICE[Service Layer]
        DB[(Database)]
    end

    COMPONENT --> HOOK
    HOOK --> CACHE
    CACHE -->|Cache Miss| TRPC
    TRPC --> HTTP
    HTTP --> ROUTER
    ROUTER --> PROCEDURE
    PROCEDURE --> SERVICE
    SERVICE --> DB

    DB -.-> SERVICE
    SERVICE -.-> PROCEDURE
    PROCEDURE -.-> ROUTER
    ROUTER -.-> HTTP
    HTTP -.-> TRPC
    TRPC -.-> CACHE
    CACHE -.-> HOOK
    HOOK -.-> COMPONENT

    HOOK -->|Mutation| OPTIMISTIC
    OPTIMISTIC --> CACHE
    OPTIMISTIC --> TRPC
```

### Daily Summary Generation Flow

```mermaid
stateDiagram-v2
    [*] --> Scheduled: Cron triggers at 11:59 PM

    Scheduled --> FetchUsers: Get active users
    FetchUsers --> ProcessUser: For each user

    ProcessUser --> FetchMeals: Get today's meals
    FetchMeals --> CalculateTotals: Sum nutrition data
    CalculateTotals --> FetchGoals: Get user goals
    FetchGoals --> CompareGoals: Compare actual vs target

    CompareGoals --> StoreSummary: Save daily summary
    StoreSummary --> CheckDeviation: Goal deviation check

    CheckDeviation --> SendNotification: If >20% deviation
    CheckDeviation --> NextUser: If within range

    SendNotification --> NextUser
    NextUser --> ProcessUser: More users?
    NextUser --> Complete: No more users

    Complete --> [*]
```

## Data Transformation Flows

### Input Validation Pipeline

```mermaid
graph LR
    subgraph "Input Processing"
        RAW[Raw Input]
        SANITIZE[Sanitize]
        PARSE[Parse]
        VALIDATE[Validate<br/>Zod Schema]
        TRANSFORM[Transform]
    end

    subgraph "Validation Results"
        SUCCESS[Valid Data]
        ERRORS[Validation Errors]
    end

    RAW --> SANITIZE
    SANITIZE --> PARSE
    PARSE --> VALIDATE
    VALIDATE -->|Valid| TRANSFORM
    VALIDATE -->|Invalid| ERRORS
    TRANSFORM --> SUCCESS
```

### Nutrition Calculation Flow

```mermaid
flowchart LR
    subgraph "Input Data"
        ITEMS[Food Items Array]
        SERVING[Serving Sizes]
    end

    subgraph "Processing"
        NORMALIZE[Normalize Units]
        LOOKUP[Lookup Nutrition]
        SCALE[Scale by Quantity]
        AGGREGATE[Sum Totals]
    end

    subgraph "Output"
        TOTALS[Meal Totals]
        MACROS[Macro Split]
        MICROS[Micronutrients]
    end

    ITEMS --> NORMALIZE
    SERVING --> NORMALIZE
    NORMALIZE --> LOOKUP
    LOOKUP --> SCALE
    SCALE --> AGGREGATE
    AGGREGATE --> TOTALS
    AGGREGATE --> MACROS
    AGGREGATE --> MICROS
```

## Caching Strategy

### Multi-Level Cache Flow

```mermaid
graph TD
    REQUEST[Data Request]

    subgraph "Cache Layers"
        L1[Browser Cache<br/>5 min]
        L2[React Query<br/>5 min]
        L3[Redis Cache<br/>1 hour]
        L4[DB Query Cache<br/>10 min]
    end

    DATABASE[(PostgreSQL)]

    REQUEST --> L1
    L1 -->|Miss| L2
    L2 -->|Miss| L3
    L3 -->|Miss| L4
    L4 -->|Miss| DATABASE

    DATABASE -.->|Fill| L4
    L4 -.->|Fill| L3
    L3 -.->|Fill| L2
    L2 -.->|Fill| L1
    L1 -.->|Return| REQUEST
```

### Cache Invalidation Strategy

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant DB

    Client->>API: Update meal
    API->>DB: UPDATE meal
    DB-->>API: Success

    par Invalidate Caches
        API->>Cache: DELETE meals:list:*
        API->>Cache: DELETE meals:get:{id}
        API->>Cache: DELETE nutrition:daily:*
    and Update React Query
        API-->>Client: Success + Updated Data
        Client->>Client: Update local cache
        Client->>Client: Refetch affected queries
    end
```

## Error Handling Flows

### Retry Logic with Exponential Backoff

```mermaid
flowchart TD
    START[API Call]
    ATTEMPT[Attempt #n]

    START --> ATTEMPT
    ATTEMPT --> CALL[Execute Request]
    CALL --> RESULT{Success?}

    RESULT -->|Yes| SUCCESS[Return Data]
    RESULT -->|No| CHECK_RETRY{Retryable?}

    CHECK_RETRY -->|No| FAIL[Return Error]
    CHECK_RETRY -->|Yes| CHECK_ATTEMPTS{Attempts < 3?}

    CHECK_ATTEMPTS -->|No| FAIL
    CHECK_ATTEMPTS -->|Yes| BACKOFF[Wait 2^n seconds]
    BACKOFF --> ATTEMPT
```

### Error Recovery Flow

```mermaid
stateDiagram-v2
    [*] --> Normal: System Operating

    Normal --> Error: Error Occurs

    Error --> Analyze: Analyze Error Type

    Analyze --> Transient: Network/Timeout
    Analyze --> Business: Validation/Logic
    Analyze --> Critical: Database/System

    Transient --> Retry: Automatic Retry
    Retry --> Normal: Success
    Retry --> Error: Fail

    Business --> UserFeedback: Show Error
    UserFeedback --> Normal: User Corrects

    Critical --> Fallback: Degraded Mode
    Fallback --> Alert: Notify Ops
    Alert --> Recovery: Manual Fix
    Recovery --> Normal: Restored
```

## Background Job Processing

### Job Queue Flow

```mermaid
graph LR
    subgraph "Job Creation"
        APP[Application]
        VALIDATE_JOB[Validate Job]
        QUEUE[Queue Job]
    end

    subgraph "Redis Queue"
        WAITING[Waiting Queue]
        ACTIVE[Active Queue]
        COMPLETED[Completed Set]
        FAILED[Failed Set]
    end

    subgraph "Worker Processing"
        WORKER[Worker Process]
        EXECUTE[Execute Job]
        RESULT{Result}
    end

    APP --> VALIDATE_JOB
    VALIDATE_JOB --> QUEUE
    QUEUE --> WAITING

    WAITING --> WORKER
    WORKER --> ACTIVE
    ACTIVE --> EXECUTE
    EXECUTE --> RESULT

    RESULT -->|Success| COMPLETED
    RESULT -->|Failure| FAILED
    FAILED -->|Retry| WAITING
```

### Distributed Job Processing

```mermaid
flowchart TB
    subgraph "Job Distribution"
        SCHEDULER[Job Scheduler]

        subgraph "Job Types"
            AI_JOBS[AI Processing]
            EMAIL_JOBS[Email Sending]
            SUMMARY_JOBS[Summaries]
            CLEANUP_JOBS[Cleanup]
        end

        subgraph "Worker Pool"
            W1[Worker 1<br/>AI Specialist]
            W2[Worker 2<br/>Email Specialist]
            W3[Worker 3<br/>General]
            W4[Worker 4<br/>General]
        end
    end

    SCHEDULER --> AI_JOBS
    SCHEDULER --> EMAIL_JOBS
    SCHEDULER --> SUMMARY_JOBS
    SCHEDULER --> CLEANUP_JOBS

    AI_JOBS --> W1
    EMAIL_JOBS --> W2
    SUMMARY_JOBS --> W3
    CLEANUP_JOBS --> W4
```

## Data Security Flows

### Authentication Token Flow

```mermaid
sequenceDiagram
    participant Client
    participant Edge
    participant API
    participant Auth
    participant DB

    Client->>Edge: Request + Cookie
    Edge->>Edge: Extract Session Token
    Edge->>Auth: Validate Token
    Auth->>DB: Get Session
    DB-->>Auth: Session Data

    alt Valid Session
        Auth-->>Edge: User Context
        Edge->>API: Forward Request + Context
        API->>API: Process with User Context
        API-->>Edge: Response
        Edge-->>Client: Response
    else Invalid Session
        Auth-->>Edge: Unauthorized
        Edge-->>Client: 401 + Clear Cookie
    end
```

### Row-Level Security Flow

```mermaid
flowchart TD
    REQUEST[API Request]
    AUTH[Extract User ID]

    REQUEST --> AUTH
    AUTH --> QUERY{Query Type}

    QUERY -->|SELECT| SELECT_FILTER[Add WHERE user_id = ?]
    QUERY -->|INSERT| INSERT_USER[Set user_id field]
    QUERY -->|UPDATE| UPDATE_CHECK[Verify ownership]
    QUERY -->|DELETE| DELETE_CHECK[Verify ownership]

    SELECT_FILTER --> EXECUTE[Execute Query]
    INSERT_USER --> EXECUTE
    UPDATE_CHECK -->|Owned| EXECUTE
    UPDATE_CHECK -->|Not Owned| DENY[403 Forbidden]
    DELETE_CHECK -->|Owned| EXECUTE
    DELETE_CHECK -->|Not Owned| DENY
```

## Performance Optimization Flows

### Query Optimization

```mermaid
graph TD
    QUERY[Database Query]

    QUERY --> ANALYZE{Analyze Query}
    ANALYZE --> CHECK_INDEX{Index Available?}

    CHECK_INDEX -->|Yes| USE_INDEX[Use Index]
    CHECK_INDEX -->|No| CHECK_CACHE{In Cache?}

    CHECK_CACHE -->|Yes| RETURN_CACHE[Return Cached]
    CHECK_CACHE -->|No| FULL_SCAN[Table Scan]

    USE_INDEX --> EXECUTE[Execute]
    FULL_SCAN --> EXECUTE

    EXECUTE --> CACHE_RESULT[Cache Result]
    CACHE_RESULT --> RETURN[Return Data]
    RETURN_CACHE --> RETURN
```

### Batch Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant BatchProcessor
    participant DB

    loop Collect Requests
        Client->>API: Individual Request
        API->>BatchProcessor: Add to Batch
    end

    Note over BatchProcessor: Wait 50ms or 10 requests

    BatchProcessor->>BatchProcessor: Combine Queries
    BatchProcessor->>DB: Single Batch Query
    DB-->>BatchProcessor: Batch Results
    BatchProcessor->>BatchProcessor: Split Results

    loop Return Responses
        BatchProcessor-->>API: Individual Result
        API-->>Client: Response
    end
```

## Monitoring Data Flow

### Metrics Collection

```mermaid
graph LR
    subgraph "Application"
        APP_EVENTS[App Events]
        API_METRICS[API Metrics]
        ERROR_EVENTS[Errors]
    end

    subgraph "Collection"
        AGENT[Metrics Agent]
        BUFFER[Local Buffer]
        BATCH[Batch Sender]
    end

    subgraph "Processing"
        INGESTION[Ingestion API]
        STREAM[Stream Processor]
        STORAGE[(Time Series DB)]
    end

    subgraph "Output"
        DASHBOARDS[Dashboards]
        ALERTS[Alert System]
        REPORTS[Reports]
    end

    APP_EVENTS --> AGENT
    API_METRICS --> AGENT
    ERROR_EVENTS --> AGENT

    AGENT --> BUFFER
    BUFFER --> BATCH
    BATCH --> INGESTION

    INGESTION --> STREAM
    STREAM --> STORAGE

    STORAGE --> DASHBOARDS
    STORAGE --> ALERTS
    STORAGE --> REPORTS
```

## Data Migration Flows

### Schema Migration

```mermaid
stateDiagram-v2
    [*] --> CheckPending: Start Migration

    CheckPending --> LoadMigrations: Has Pending
    CheckPending --> Complete: No Pending

    LoadMigrations --> ValidateOrder: Load Files
    ValidateOrder --> BackupDB: Valid Order
    ValidateOrder --> Error: Invalid Order

    BackupDB --> BeginTransaction: Backup Complete
    BeginTransaction --> RunMigration: Transaction Started

    RunMigration --> VerifySchema: Execute SQL
    VerifySchema --> CommitTransaction: Schema Valid
    VerifySchema --> RollbackTransaction: Schema Invalid

    CommitTransaction --> UpdateVersion: Success
    RollbackTransaction --> RestoreBackup: Failed

    UpdateVersion --> NextMigration: Update Table
    RestoreBackup --> Error: Restore DB

    NextMigration --> CheckPending: More?
    Error --> [*]: Exit with Error
    Complete --> [*]: Success
```

This comprehensive data flow design ensures efficient, secure, and reliable data handling throughout the NutriCoach v2 system.
