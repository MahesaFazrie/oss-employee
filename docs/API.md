# API Documentation — One Stop Service

## Base URL

```
Development: http://localhost:8080/api
Production:  https://api.example.com/api
```

## Response Format

Semua response API mengikuti format standar berikut:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": { ... }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Request berhasil |
| 201 | Created | Resource berhasil dibuat |
| 204 | No Content | Delete berhasil |
| 400 | Bad Request | Request tidak valid |
| 401 | Unauthorized | Belum login / token expired |
| 403 | Forbidden | Tidak punya permission |
| 404 | Not Found | Resource tidak ditemukan |
| 422 | Unprocessable Entity | Validasi gagal |
| 500 | Internal Server Error | Error server |

---

## Response Examples

### 200 OK — Success

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User retrieved successfully"
}
```

### 201 Created

```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Meeting with client",
    "duration": 3600
  },
  "message": "Logbook entry created successfully"
}
```

### 422 Validation Error

```json
{
  "success": false,
  "data": null,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "name": ["The name must be at least 3 characters."]
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "data": null,
  "message": "Resource not found.",
  "errors": {}
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "data": null,
  "message": "Unauthenticated.",
  "errors": {}
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "data": null,
  "message": "An unexpected error occurred.",
  "errors": {}
}
```

---

## Endpoints

### Health Check

#### `GET /api/health`

Cek status aplikasi dan koneksi database.

**Authentication:** Tidak diperlukan

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000000Z"
  },
  "message": "Application is running"
}
```

**Error Response (database down):**

```json
{
  "success": true,
  "data": {
    "status": "unhealthy",
    "database": "disconnected",
    "timestamp": "2024-01-15T10:30:00.000000Z"
  },
  "message": "Application is running with issues"
}
```

---

## Implementation Notes

### ApiResponseTrait

Semua controller harus menggunakan `ApiResponseTrait` untuk konsistensi response:

```php
use App\Traits\ApiResponseTrait;

class ExampleController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        return $this->successResponse($data, 'Success message');
    }

    public function store(Request $request)
    {
        return $this->successResponse($data, 'Created', 201);
    }

    public function handleError()
    {
        return $this->errorResponse('Error message', $errors, 400);
    }
}
```

### Global Exception Handling

Exception berikut otomatis ditangani dan mengikuti format response standar:

- `ValidationException` → 422
- `ModelNotFoundException` → 404
- `NotFoundHttpException` → 404
- `AuthenticationException` → 401
- `AuthorizationException` → 403
- Generic exceptions → 500
