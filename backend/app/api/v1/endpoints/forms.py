"""
Forms API Endpoints
Dynamic forms and submissions
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.form import Form, FormSubmission
from app.models.user import User
from app.dependencies import get_current_user, get_db, is_superadmin
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.tenancy_helpers import apply_tenant_scope
from fastapi import Request

router = APIRouter()


class FormFieldConfig(BaseModel):
    id: str
    type: str
    label: str
    name: str
    placeholder: Optional[str] = None
    required: Optional[bool] = False
    options: Optional[List[dict]] = None
    validation: Optional[dict] = None


class FormCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    fields: List[FormFieldConfig] = Field(default_factory=list)
    submit_button_text: Optional[str] = Field(default='Submit', max_length=50)
    success_message: Optional[str] = None


class FormUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    fields: Optional[List[FormFieldConfig]] = None
    submit_button_text: Optional[str] = Field(None, max_length=50)
    success_message: Optional[str] = None


class FormResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    fields: List[dict]
    submit_button_text: str
    success_message: Optional[str] = None
    user_id: Optional[int] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class FormSubmissionCreate(BaseModel):
    form_id: int
    data: dict = Field(..., description="Form submission data")


class FormSubmissionResponse(BaseModel):
    id: int
    form_id: int
    form_name: Optional[str] = None
    data: dict
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    user_id: Optional[int] = None
    submitted_at: str

    class Config:
        from_attributes = True


@router.get("/forms", response_model=List[FormResponse], tags=["forms"])
async def list_forms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all forms"""
    query = select(Form).order_by(Form.created_at.desc())
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    forms = result.scalars().all()
    return [FormResponse.model_validate(form) for form in forms]


@router.get("/forms/{form_id}", response_model=FormResponse, tags=["forms"])
async def get_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a form by ID"""
    query = select(Form).where(Form.id == form_id)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    
    return FormResponse.model_validate(form)


@router.post("/forms", response_model=FormResponse, status_code=status.HTTP_201_CREATED, tags=["forms"])
async def create_form(
    request: Request,
    form_data: FormCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new form"""
    fields_json = [field.model_dump() for field in form_data.fields]
    
    form = Form(
        name=form_data.name,
        description=form_data.description,
        fields=fields_json,
        submit_button_text=form_data.submit_button_text or 'Submit',
        success_message=form_data.success_message,
        user_id=current_user.id,
    )
    
    db.add(form)
    await db.commit()
    await db.refresh(form)
    
    # Log data modification
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description=f"Form '{form.name}' created",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "form", "form_id": form.id, "action": "created"}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails
    
    return FormResponse.model_validate(form)


@router.put("/forms/{form_id}", response_model=FormResponse, tags=["forms"])
async def update_form(
    request: Request,
    form_id: int,
    form_data: FormUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a form"""
    query = select(Form).where(Form.id == form_id)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    
    # Check ownership or admin
    if form.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this form"
        )
    
    if form_data.name is not None:
        form.name = form_data.name
    if form_data.description is not None:
        form.description = form_data.description
    if form_data.fields is not None:
        form.fields = [field.model_dump() for field in form_data.fields]
    if form_data.submit_button_text is not None:
        form.submit_button_text = form_data.submit_button_text
    if form_data.success_message is not None:
        form.success_message = form_data.success_message
    
    await db.commit()
    await db.refresh(form)
    
    # Log data modification
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description=f"Form '{form.name}' updated",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "form", "form_id": form.id, "action": "updated"}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails
    
    return FormResponse.model_validate(form)


@router.delete("/forms/{form_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["forms"])
async def delete_form(
    request: Request,
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a form"""
    query = select(Form).where(Form.id == form_id)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    
    # Check ownership or admin
    if form.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this form"
        )
    
    form_name = form.name  # Save before deletion
    await db.delete(form)
    await db.commit()
    
    # Log data deletion
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description=f"Form '{form_name}' deleted",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "form", "form_id": form_id, "action": "deleted"}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails


@router.post("/forms/{form_id}/submissions", response_model=FormSubmissionResponse, status_code=status.HTTP_201_CREATED, tags=["forms"])
async def create_submission(
    form_id: int,
    submission_data: FormSubmissionCreate,
    request: Optional[object] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a form"""
    from fastapi import Request as FastAPIRequest
    
    query = select(Form).where(Form.id == form_id)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    
    # Get IP and user agent from request if available
    ip_address = None
    user_agent = None
    if request and isinstance(request, FastAPIRequest):
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
    
    submission = FormSubmission(
        form_id=form_id,
        data=submission_data.data,
        ip_address=ip_address,
        user_agent=user_agent,
        user_id=current_user.id if current_user else None,
    )
    
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    response = FormSubmissionResponse.model_validate(submission)
    response.form_name = form.name
    return response


@router.get("/forms/{form_id}/submissions", response_model=List[FormSubmissionResponse], tags=["forms"])
async def list_submissions(
    form_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List form submissions"""
    # Verify form exists and user has access
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    
    if form.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view submissions for this form"
        )
    
    result = await db.execute(
        select(FormSubmission)
        .where(FormSubmission.form_id == form_id)
        .order_by(FormSubmission.submitted_at.desc())
        .offset(skip)
        .limit(limit)
    )
    submissions = result.scalars().all()
    
    responses = [FormSubmissionResponse.model_validate(sub) for sub in submissions]
    for response in responses:
        response.form_name = form.name
    
    return responses


@router.delete("/forms/submissions/{submission_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["forms"])
async def delete_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a form submission"""
    result = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    
    # Get form to check ownership
    query = select(Form).where(Form.id == submission.form_id)
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if form and form.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this submission"
        )
    
    await db.delete(submission)
    await db.commit()


@router.get("/forms/{form_id}/statistics", tags=["forms"])
async def get_form_statistics(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for a form/survey"""
    # Get form
    form_result = await db.execute(select(Form).where(Form.id == form_id))
    form = form_result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get submission count
    count_result = await db.execute(
        select(func.count(FormSubmission.id)).where(FormSubmission.form_id == form_id)
    )
    total_submissions = count_result.scalar_one() or 0
    
    # Get submissions
    submissions_result = await db.execute(
        select(FormSubmission).where(FormSubmission.form_id == form_id)
    )
    submissions = submissions_result.scalars().all()
    
    # Calculate statistics per field
    field_stats = {}
    for field in form.fields:
        field_name = field.get('name', '')
        if not field_name:
            continue
        
        field_type = field.get('type', '')
        values = [sub.data.get(field_name) for sub in submissions if sub.data.get(field_name) is not None]
        
        if field_type in ['scale', 'rating', 'nps', 'number']:
            # Numeric statistics
            numeric_values = [float(v) for v in values if v is not None and str(v).replace('.', '').isdigit()]
            if numeric_values:
                field_stats[field_name] = {
                    'type': 'numeric',
                    'average': sum(numeric_values) / len(numeric_values),
                    'min': min(numeric_values),
                    'max': max(numeric_values),
                    'count': len(numeric_values),
                    'distribution': {},
                }
                # Distribution
                for val in numeric_values:
                    rounded = round(val)
                    field_stats[field_name]['distribution'][rounded] = field_stats[field_name]['distribution'].get(rounded, 0) + 1
        else:
            # Categorical statistics
            distribution = {}
            for val in values:
                str_val = str(val)
                distribution[str_val] = distribution.get(str_val, 0) + 1
            
            field_stats[field_name] = {
                'type': 'categorical',
                'count': len(values),
                'distribution': distribution,
            }
    
    return {
        'form_id': form_id,
        'form_name': form.name,
        'total_submissions': total_submissions,
        'field_statistics': field_stats,
    }


@router.get("/forms/{form_id}/export", tags=["forms"])
async def export_form_results(
    request: Request,
    form_id: int,
    format: str = Query('csv', regex='^(csv|excel|json)$'),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export form submissions"""
    from fastapi.responses import StreamingResponse
    import csv
    import io
    import json
    
    # Get form
    form_result = await db.execute(select(Form).where(Form.id == form_id))
    form = form_result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get submissions
    submissions_result = await db.execute(
        select(FormSubmission).where(FormSubmission.form_id == form_id).order_by(FormSubmission.submitted_at.desc())
    )
    submissions = submissions_result.scalars().all()
    
    if format == 'json':
        data = [FormSubmissionResponse.model_validate(sub).model_dump() for sub in submissions]
        json_str = json.dumps(data, indent=2, default=str)
        return StreamingResponse(
            io.BytesIO(json_str.encode()),
            media_type='application/json',
            headers={'Content-Disposition': f'attachment; filename="form_{form_id}_results.json"'}
        )
    
    # CSV/Excel export
    if not submissions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submissions to export"
        )
    
    # Get all field names
    field_names = set()
    for sub in submissions:
        field_names.update(sub.data.keys())
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    header = ['ID', 'Submitted At', 'User ID'] + sorted(field_names)
    writer.writerow(header)
    
    # Rows
    for sub in submissions:
        row = [sub.id, sub.submitted_at.isoformat(), sub.user_id or '']
        for field_name in sorted(field_names):
            value = sub.data.get(field_name, '')
            if isinstance(value, (list, dict)):
                value = json.dumps(value)
            row.append(str(value))
        writer.writerow(row)
    
    output.seek(0)
    
    if format == 'excel':
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename="form_{form_id}_results.xlsx"'}
        )
    
    # Log data export
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_EXPORTED,
            description=f"Form '{form.name}' results exported as {format}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "form", "form_id": form_id, "format": format, "submission_count": len(submissions)}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename="form_{form_id}_results.csv"'}
    )

