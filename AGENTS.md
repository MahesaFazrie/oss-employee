# AGENTS.md — Development & AI Agent Guidelines

Panduan pengembangan untuk developer dan AI coding agent pada project **One Stop Service**.

---

## Commit Convention

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types

| Type | Usage |
|------|-------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Perubahan dokumentasi |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Refactoring tanpa mengubah behavior |
| `test` | Menambah atau memperbaiki tests |
| `chore` | Build process, tooling, dependencies |
| `ci` | CI/CD configuration |

### Scopes

| Scope | Usage |
|-------|-------|
| `backend` | Perubahan di folder `backend/` |
| `frontend` | Perubahan di folder `frontend/` |
| `docker` | Docker & infrastructure |
| `docs` | Documentation |
| `auth` | Authentication & authorization |
| `logbook` | Logbook feature |
| `payroll` | Payroll feature |
| `rbac` | Role & permission management |

### Examples

```
feat(backend): add health check endpoint
fix(auth): handle expired token gracefully
docs(api): update response format documentation
chore(docker): upgrade PostgreSQL to 16.x
```

---

## Naming Convention

### Folders & Files

| Item | Convention | Example |
|------|------------|---------|
| Controller | PascalCase, suffixed | `HealthController.php` |
| Model | PascalCase, singular | `Role.php`, `User.php` |
| Migration | snake_case, timestamped | `2024_01_01_000001_create_roles_table.php` |
| Seeder | PascalCase, suffixed | `RolePermissionSeeder.php` |
| Trait | PascalCase, suffixed | `ApiResponseTrait.php` |
| Middleware | PascalCase | `CheckPermission.php` |
| Request | PascalCase, suffixed | `StoreLogbookRequest.php` |
| Resource | PascalCase, suffixed | `UserResource.php` |
| Test | PascalCase, suffixed | `HealthEndpointTest.php` |

### Variables & Methods

| Item | Convention | Example |
|------|------------|---------|
| Variable | camelCase | `$roleId`, `$userName` |
| Method | camelCase | `getRoleById()`, `hasPermission()` |
| Constant | UPPER_SNAKE | `MAX_LOGIN_ATTEMPTS` |
| Database column | snake_case | `role_id`, `created_at` |
| Database table | snake_case, plural | `roles`, `permissions` |
| Route (API) | kebab-case, plural | `/api/logbook-entries` |

### API Endpoints

```
GET    /api/{resource}          → index
POST   /api/{resource}          → store
GET    /api/{resource}/{id}     → show
PUT    /api/{resource}/{id}     → update
DELETE /api/{resource}/{id}     → destroy
```

---

## Coding Guideline (Laravel)

### Architecture Pattern

```
Request → Controller → Service → Repository (optional) → Model
                ↓
           Response (via ApiResponseTrait)
```

- **Controller**: Handle HTTP request/response only. Thin controllers.
- **Service**: Business logic. Inject via constructor.
- **Repository**: Database query abstraction (optional, gunakan jika query kompleks).
- **Model**: Eloquent model, relasi, accessor/mutator.
- **FormRequest**: Validasi input.
- **Resource**: Transform output.

### Rules

1. **Jangan** letakkan business logic di Controller — gunakan Service class.
2. **Jangan** hardcode role/permission — selalu query dari database.
3. **Selalu** gunakan `ApiResponseTrait` untuk response.
4. **Selalu** gunakan FormRequest untuk validasi.
5. **Selalu** gunakan API Resource untuk transformasi output.
6. **Jangan** return Eloquent model langsung dari Controller.

### Example Controller

```php
class LogbookController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private LogbookService $logbookService
    ) {}

    public function index(Request $request)
    {
        $entries = $this->logbookService->getEntries($request->user());
        return $this->successResponse(
            LogbookResource::collection($entries),
            'Logbook entries retrieved successfully'
        );
    }
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
cd backend
php artisan test

# Run specific test
php artisan test --filter=HealthEndpointTest

# Run with coverage
php artisan test --coverage

# Inside Docker
docker compose exec backend php artisan test
```

### Test Naming

```php
// Format: test_{action}_{expected_result}
public function test_health_endpoint_returns_success(): void
public function test_unauthenticated_user_cannot_access_dashboard(): void
```

---

## Migration Rules

1. **Jangan** edit migration yang sudah di-merge ke `develop` atau `main`.
2. Buat migration baru untuk setiap perubahan schema.
3. Gunakan naming convention: `create_xxx_table`, `add_xxx_to_yyy_table`, `modify_xxx_in_yyy_table`.
4. **Selalu** sertakan `down()` method untuk rollback.
5. Gunakan foreign key constraints.
6. Jalankan `php artisan migrate:fresh --seed` untuk memastikan migration + seeder konsisten.

---

## Secret & Environment Handling

1. **JANGAN** pernah commit file `.env` — gunakan `.env.example` sebagai template.
2. **JANGAN** hardcode secret (API key, password, dsb) di source code.
3. Semua config harus dibaca dari `env()` atau `config()` helper.
4. Update `.env.example` setiap kali menambah environment variable baru.
5. Dokumentasikan variabel baru di `docs/DEPLOYMENT.md`.

---

## AI Agent Instructions

- Selalu ikuti format response API standar (`ApiResponseTrait`).
- Cek existing code sebelum membuat file baru — hindari duplikasi.
- Jalankan `php artisan test` setelah setiap perubahan.
- Jangan generate migration untuk tabel yang sudah ada — buat migration alter.
- Jika ragu, baca `docs/API.md` dan `docs/DATABASE.md` untuk konteks.
