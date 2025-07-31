from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, Tenant
from typing import Optional
import json
import re

# Security scheme for API key authentication
security = HTTPBearer(auto_error=False)

class TenantContext:
    """Context class to hold tenant information"""
    def __init__(self, tenant: Tenant):
        self.tenant = tenant
        self.tenant_id = tenant.id
        self.features = json.loads(tenant.features_enabled) if tenant.features_enabled else ["basic"]

class TenantMiddleware:
    """Middleware for tenant identification and isolation"""
    
    @staticmethod
    async def get_tenant_from_header(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None) -> Optional[str]:
        """Extract tenant ID from Authorization header (Bearer token)"""
        if credentials and credentials.scheme.lower() == "bearer":
            return credentials.credentials
        return None
    
    @staticmethod
    async def get_tenant_from_subdomain(request: Request) -> Optional[str]:
        """Extract tenant ID from subdomain"""
        host = request.headers.get("host", "")
        if not host:
            return None
        
        # Extract subdomain (e.g., tenant1.localhost:8000 -> tenant1)
        subdomain_match = re.match(r"^([^.]+)\.", host)
        if subdomain_match:
            return subdomain_match.group(1)
        return None
    
    @staticmethod
    async def get_tenant_from_query_param(request: Request) -> Optional[str]:
        """Extract tenant ID from query parameter"""
        return request.query_params.get("tenant_id")
    
    @staticmethod
    async def get_tenant_from_path_param(request: Request) -> Optional[str]:
        """Extract tenant ID from path parameter"""
        return request.path_params.get("tenant_id")
    
    @staticmethod
    async def identify_tenant(
        request: Request,
        db: Session = Depends(get_db),
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
    ) -> TenantContext:
        """Identify tenant using multiple strategies"""
        
        # Strategy 1: API Key in Authorization header
        tenant_id = await TenantMiddleware.get_tenant_from_header(request, credentials)
        print(f"DEBUG: API key from header: {tenant_id}")
        if tenant_id:
            # Debug: Check all tenants in database
            all_tenants = db.query(Tenant).all()
            print(f"DEBUG: All tenants in DB: {[(t.id, t.name, t.api_key[:20] + '...' if t.api_key else 'None') for t in all_tenants]}")
            
            tenant = db.query(Tenant).filter(Tenant.api_key == tenant_id, Tenant.is_active == True).first()
            print(f"DEBUG: Tenant found by API key: {tenant.name if tenant else 'None'}")
            if tenant:
                return TenantContext(tenant)
        
        # Strategy 2: Subdomain
        tenant_id = await TenantMiddleware.get_tenant_from_subdomain(request)
        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()
            if tenant:
                return TenantContext(tenant)
        
        # Strategy 3: Query parameter
        tenant_id = await TenantMiddleware.get_tenant_from_query_param(request)
        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()
            if tenant:
                return TenantContext(tenant)
        
        # Strategy 4: Path parameter
        tenant_id = await TenantMiddleware.get_tenant_from_path_param(request)
        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()
            if tenant:
                return TenantContext(tenant)
        
        # Strategy 5: Default tenant (for development/testing)
        if request.headers.get("x-development-mode") == "true":
            tenant = db.query(Tenant).filter(Tenant.name == "Default Tenant").first()
            if tenant:
                return TenantContext(tenant)
        
        # Create default tenant if none exists
        tenant = db.query(Tenant).filter(Tenant.name == "Default Tenant").first()
        if not tenant:
            # Check if a tenant with id "default" already exists
            existing_default = db.query(Tenant).filter(Tenant.id == "default").first()
            if existing_default:
                tenant = existing_default
            else:
                # If still no tenant, try to get any tenant
                tenant = db.query(Tenant).first()
                if not tenant:
                    # Create a new default tenant
                    tenant = Tenant(
                        id="default",
                        name="Default Tenant",
                        features_enabled=json.dumps(["basic", "chat", "documents"])
                    )
                    db.add(tenant)
                    try:
                        db.commit()
                        db.refresh(tenant)
                    except Exception as e:
                        db.rollback()
                        # If commit fails, try to get any tenant again
                        tenant = db.query(Tenant).first()
                        if not tenant:
                            raise Exception("No tenant available and cannot create default tenant")
        
        return TenantContext(tenant)

# Dependency for getting tenant context
async def get_tenant_context(
    request: Request,
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> TenantContext:
    """Dependency to get tenant context for any endpoint"""
    return await TenantMiddleware.identify_tenant(request, db, credentials)

# Dependency for getting tenant ID only
async def get_tenant_id(tenant_context: TenantContext = Depends(get_tenant_context)) -> str:
    """Dependency to get tenant ID for endpoints that only need the ID"""
    return tenant_context.tenant_id

# Dependency for getting tenant object
async def get_tenant(tenant_context: TenantContext = Depends(get_tenant_context)) -> Tenant:
    """Dependency to get tenant object for endpoints that need full tenant info"""
    return tenant_context.tenant 