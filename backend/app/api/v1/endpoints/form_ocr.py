"""
Form OCR API
Upload form document (PDF/image) and process with OCR + LLM; poll task status.
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, status, UploadFile
from pydantic import BaseModel, Field

from app.celery_app import celery_app
from app.dependencies import get_current_user
from app.models.user import User
from app.services.s3_service import S3Service

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


class UploadAndProcessResponse(BaseModel):
    task_id: str = Field(..., description="Celery task ID for polling status")
    message: str = Field(default="Traitement en cours")


class TaskStatusResponse(BaseModel):
    status: str = Field(..., description="PENDING, STARTED, SUCCESS, FAILURE")
    submission_id: Optional[int] = None
    form_code: Optional[str] = None
    error: Optional[str] = None
    result: Optional[dict] = None


@router.post(
    "/forms/submissions/upload-and-process",
    response_model=UploadAndProcessResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_and_process_form(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a form document (PDF or image) and start OCR + LLM extraction in background.
    Returns task_id to poll GET /tasks/{task_id}/status.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required")
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allowed types: PDF, JPEG, PNG, WebP. Got: {content_type}",
        )
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {MAX_FILE_SIZE // (1024*1024)} MB)",
        )
    file.file.seek(0)

    if not S3Service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 is not configured",
        )
    s3 = S3Service()
    try:
        upload_result = s3.upload_file(
            file=file,
            folder="form_ocr_uploads",
            user_id=str(current_user.id),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {e}",
        ) from e

    file_key = upload_result["file_key"]
    document_url = upload_result.get("url") or ""
    if not document_url and file_key:
        document_url = s3.generate_presigned_url(file_key, expiration=604800)

    from app.tasks.form_ocr_tasks import process_form_ocr_task

    task = process_form_ocr_task.delay(
        file_key=file_key,
        document_url=document_url,
        user_id=current_user.id,
        content_type=content_type,
    )
    return UploadAndProcessResponse(task_id=task.id, message="Traitement en cours")


@router.get("/tasks/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get status of an OCR processing task.
    On SUCCESS, result contains submission_id and optionally form_code.
    """
    result = celery_app.AsyncResult(task_id)
    state = result.state
    data: Any = result.result if state == "SUCCESS" else result.info
    resp: dict = {"status": state}
    if state == "SUCCESS" and isinstance(data, dict):
        resp["submission_id"] = data.get("submission_id")
        resp["form_code"] = data.get("form_code")
        resp["error"] = data.get("error")
        resp["result"] = data
    elif state == "FAILURE":
        resp["error"] = str(data) if data else "Task failed"
    return TaskStatusResponse(**resp)
