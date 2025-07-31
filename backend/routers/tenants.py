from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, Tenant
from tenant_provisioning import TenantProvisioning
from tenant_middleware import get_tenant_context, get_tenant_id, TenantContext, TenantMiddleware, security
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter()

# Pydantic models for request/response
class TenantCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    api_key: Optional[str] = None
    max_documents: int = 100
    max_chat_messages: int = 10000
    max_storage_mb: int = 1000
    features_enabled: Optional[List[str]] = None
    
    class Config:
        from_attributes = True

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    max_documents: Optional[int] = None
    max_chat_messages: Optional[int] = None
    max_storage_mb: Optional[int] = None
    features_enabled: Optional[List[str]] = None
    is_active: Optional[bool] = None

class TenantResponse(BaseModel):
    id: str
    name: str
    domain: Optional[str]
    api_key: Optional[str]
    created_at: str
    updated_at: str
    is_active: bool
    max_documents: int
    max_chat_messages: int
    max_storage_mb: int
    features_enabled: List[str]

    class Config:
        from_attributes = True

class TenantUsageResponse(BaseModel):
    tenant_id: str
    tenant_name: str
    limits: dict
    usage: dict
    features_enabled: List[str]

@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db)
):
    """Create a new tenant"""
    # Validate input data
    if not tenant_data.name or tenant_data.name.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant name cannot be empty"
        )
    
    if tenant_data.max_documents < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_documents cannot be negative"
        )
    
    if tenant_data.max_chat_messages < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_chat_messages cannot be negative"
        )
    
    if tenant_data.max_storage_mb < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_storage_mb cannot be negative"
        )
    
    try:
        tenant = TenantProvisioning.create_tenant(
            db=db,
            name=tenant_data.name,
            domain=tenant_data.domain,
            api_key=tenant_data.api_key,
            max_documents=tenant_data.max_documents,
            max_chat_messages=tenant_data.max_chat_messages,
            max_storage_mb=tenant_data.max_storage_mb,
            features_enabled=tenant_data.features_enabled
        )
        
        return TenantResponse(
            id=tenant.id,
            name=tenant.name,
            domain=tenant.domain,
            api_key=tenant.api_key,
            created_at=tenant.created_at.isoformat(),
            updated_at=tenant.updated_at.isoformat(),
            is_active=tenant.is_active,
            max_documents=tenant.max_documents,
            max_chat_messages=tenant.max_chat_messages,
            max_storage_mb=tenant.max_storage_mb,
            features_enabled=json.loads(tenant.features_enabled) if tenant.features_enabled else []
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create tenant: {str(e)}"
        )

@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all tenants"""
    tenants = TenantProvisioning.list_tenants(db, active_only=active_only)
    
    return [
        TenantResponse(
            id=tenant.id,
            name=tenant.name,
            domain=tenant.domain,
            api_key=tenant.api_key,
            created_at=tenant.created_at.isoformat(),
            updated_at=tenant.updated_at.isoformat(),
            is_active=tenant.is_active,
            max_documents=tenant.max_documents,
            max_chat_messages=tenant.max_chat_messages,
            max_storage_mb=tenant.max_storage_mb,
            features_enabled=json.loads(tenant.features_enabled) if tenant.features_enabled else []
        )
        for tenant in tenants
    ]

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Get tenant by ID"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        domain=tenant.domain,
        api_key=tenant.api_key,
        created_at=tenant.created_at.isoformat(),
        updated_at=tenant.updated_at.isoformat(),
        is_active=tenant.is_active,
        max_documents=tenant.max_documents,
        max_chat_messages=tenant.max_chat_messages,
        max_storage_mb=tenant.max_storage_mb,
        features_enabled=json.loads(tenant.features_enabled) if tenant.features_enabled else []
    )

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db)
):
    """Update tenant configuration"""
    tenant = TenantProvisioning.update_tenant_config(
        db=db,
        tenant_id=tenant_id,
        **tenant_data.dict(exclude_unset=True)
    )
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        domain=tenant.domain,
        api_key=tenant.api_key,
        created_at=tenant.created_at.isoformat(),
        updated_at=tenant.updated_at.isoformat(),
        is_active=tenant.is_active,
        max_documents=tenant.max_documents,
        max_chat_messages=tenant.max_chat_messages,
        max_storage_mb=tenant.max_storage_mb,
        features_enabled=json.loads(tenant.features_enabled) if tenant.features_enabled else []
    )

@router.post("/{tenant_id}/regenerate-api-key")
async def regenerate_api_key(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Regenerate API key for a tenant"""
    new_api_key = TenantProvisioning.regenerate_api_key(db, tenant_id)
    
    if not new_api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return {"new_api_key": new_api_key}

@router.get("/{tenant_id}/usage", response_model=TenantUsageResponse)
async def get_tenant_usage(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Get tenant usage statistics"""
    usage = TenantProvisioning.get_tenant_usage(db, tenant_id)
    
    if not usage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return TenantUsageResponse(**usage)

@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Delete a tenant and all associated data"""
    success = TenantProvisioning.delete_tenant(db, tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

@router.get("/test-debug")
async def test_debug(
    request: Request,
    db: Session = Depends(get_db)
):
    """Debug endpoint to test tenant context - UPDATED"""
    """Debug endpoint to test tenant context"""
    try:
        print(f"DEBUG: test-debug called")
        
        # Simple test: get all tenants
        all_tenants = db.query(Tenant).all()
        print(f"DEBUG: All tenants in DB: {len(all_tenants)}")
        
        # Try to find tenant by API key from Authorization header
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            api_key = auth_header[7:]  # Remove "Bearer " prefix
            print(f"DEBUG: Looking for API key: {api_key[:20]}...")
            
            tenant = db.query(Tenant).filter(Tenant.api_key == api_key, Tenant.is_active == True).first()
            if tenant:
                print(f"DEBUG: Found tenant: {tenant.name}")
                return {"tenant_id": tenant.id, "tenant_name": tenant.name}
            else:
                print(f"DEBUG: No tenant found for API key")
        
        # Try query parameter identification
        tenant_id = request.query_params.get("tenant_id")
        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()
            if tenant:
                print(f"DEBUG: Found tenant by query param: {tenant.name}")
                return {"tenant_id": tenant.id, "tenant_name": tenant.name}
        
        # Try development mode identification
        if request.headers.get("x-development-mode") == "true":
            tenant = db.query(Tenant).filter(Tenant.name == "Default Tenant").first()
            if tenant:
                print(f"DEBUG: Using default tenant (dev mode): {tenant.name}")
                return {"tenant_id": tenant.id, "tenant_name": tenant.name}
        
        # Fallback to default tenant
        default_tenant = db.query(Tenant).filter(Tenant.name == "Default Tenant").first()
        if default_tenant:
            print(f"DEBUG: Using default tenant: {default_tenant.name}")
            return {"tenant_id": default_tenant.id, "tenant_name": default_tenant.name}
        
        # Last resort: any tenant
        any_tenant = db.query(Tenant).first()
        if any_tenant:
            print(f"DEBUG: Using any tenant: {any_tenant.name}")
            return {"tenant_id": any_tenant.id, "tenant_name": any_tenant.name}
        
        return {"error": "No tenants found in database"}
        
    except Exception as e:
        print(f"DEBUG: Exception in test_debug: {str(e)}")
        return {"error": str(e)}

@router.get("/current/usage", response_model=TenantUsageResponse)
async def get_current_tenant_usage(
    tenant_context: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    """Get usage statistics for the current tenant"""
    usage = TenantProvisioning.get_tenant_usage(db, tenant_context.tenant_id)
    
    if not usage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return TenantUsageResponse(**usage) 