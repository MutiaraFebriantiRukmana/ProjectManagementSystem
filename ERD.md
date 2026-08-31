# Entity Relationship Diagram (ERD)

Berikut adalah struktur representasi relasi antar entitas utama pada sistem **Project Management System**.

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "Manages"
    USERS ||--o{ TASKS : "Reports"
    USERS ||--o{ COMMENTS : "Writes"
    USERS ||--o{ TASK_ATTACHMENTS : "Uploads"
    USERS ||--o{ ACTIVITY_LOGS : "Performs"
    
    PROJECTS ||--o{ TASKS : "Contains"
    PROJECTS ||--o{ PROJECT_USER : "Has"
    USERS ||--o{ PROJECT_USER : "Is Member of"
    
    TASKS ||--o{ TASKS : "Has Subtasks (parent_id)"
    TASKS ||--o{ COMMENTS : "Has"
    TASKS ||--o{ TASK_ATTACHMENTS : "Has"
    TASKS ||--o{ APPROVALS : "Requires"
    TASKS ||--o{ TASK_USER : "Assigned To"
    USERS ||--o{ TASK_USER : "Works On"
    
    TASKS ||--o{ LABEL_TASK : "Tagged With"
    LABELS ||--o{ LABEL_TASK : "Applies To"
    
    TASKS ||--o{ TASK_DEPENDENCIES : "Depends On"
    TASKS ||--o{ TASK_DEPENDENCIES : "Blocks"

    %% Spatie Permissions
    USERS ||--o{ MODEL_HAS_ROLES : "Assigned"
    ROLES ||--o{ MODEL_HAS_ROLES : "Granted To"
    ROLES ||--o{ ROLE_HAS_PERMISSIONS : "Has"
    PERMISSIONS ||--o{ ROLE_HAS_PERMISSIONS : "Assigned To"

    USERS {
        bigInt id PK
        string username UK
        string email UK
        string password
    }
    
    PROJECTS {
        bigInt id PK
        string name
        text description
        enum status
        date start_date
        date end_date
        bigInt manager_id FK
    }

    TASKS {
        bigInt id PK
        bigInt project_id FK
        bigInt parent_id FK
        bigInt reporter_id FK
        string title
        text description
        enum status
        enum priority
        date start_date
        date end_date
        boolean requires_approval
        double position
    }

    COMMENTS {
        bigInt id PK
        bigInt task_id FK
        bigInt user_id FK
        text comment
    }

    TASK_ATTACHMENTS {
        bigInt id PK
        bigInt task_id FK
        bigInt user_id FK
        string filename
        string filepath
        bigInt filesize
        string filetype
    }

    APPROVALS {
        bigInt id PK
        bigInt task_id FK
        enum status
        bigInt approved_by FK
        text notes
    }

    LABELS {
        bigInt id PK
        string name
        string color
    }
    
    ACTIVITY_LOGS {
        bigInt id PK
        bigInt user_id FK
        string action
        string entity_type
        bigInt entity_id
        json old_value
        json new_value
    }
```

## Relasi Penting
1. **Projects - Users (Manager & Members)**:
   - Satu Project dipimpin oleh satu Project Manager (`manager_id` di tabel `projects`).
   - Project memiliki banyak Member (relasi M:N melalui pivot tabel `project_user`).
2. **Tasks - Dependencies**:
   - Task dapat memblokir task lain. Relasi direpresentasikan melalui pivot tabel `task_dependencies` yang mengaitkan `task_id` dengan `depends_on_task_id`.
3. **Tasks - Approvals**:
   - Task yang memerlukan *approval* akan memiliki rekam jejak persetujuan pada tabel `approvals`.
4. **Audit Trail (Activity Logs)**:
   - Aktivitas penting dicatat secara *polymorphic* melalui `entity_type` dan `entity_id` untuk dapat melacak perubahan yang spesifik terhadap entitas manapun (Task, Project, dll).
