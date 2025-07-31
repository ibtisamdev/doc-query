from sqlalchemy.orm import Session
from database import Tenant, engine, Base
from typing import Optional, Dict, Any
import json
import uuid
import os
from config import settings

class TenantProvisioning:
    """System for provisioning and managing tenants"""
    
    @staticmethod
    def create_tenant(
        db: Session,
        name: str,
        domain: Optional[str] = None,
        api_key: Optional[str] = None,
        max_documents: int = 100,
        max_chat_messages: int = 10000,
        max_storage_mb: int = 1000,
        features_enabled: Optional[list] = None
    ) -> Tenant:
        """Create a new tenant with default configuration"""
        
        # Generate tenant ID if not provided
        tenant_id = str(uuid.uuid4())
        
        # Generate API key if not provided
        if not api_key:
            api_key = f"sk_{uuid.uuid4().hex[:32]}"
        
        # Set default features if not provided
        if features_enabled is None:
            features_enabled = ["basic", "chat", "documents"]
        
        # Create tenant
        tenant = Tenant(
            id=tenant_id,
            name=name,
            domain=domain,
            api_key=api_key,
            max_documents=max_documents,
            max_chat_messages=max_chat_messages,
            max_storage_mb=max_storage_mb,
            features_enabled=json.dumps(features_enabled)
        )
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        # Create tenant-specific directories
        TenantProvisioning._create_tenant_directories(tenant_id)
        
        return tenant
    
    @staticmethod
    def _create_tenant_directories(tenant_id: str):
        """Create tenant-specific directories for file storage and vector DB"""
        tenant_upload_dir = os.path.join(settings.upload_dir, tenant_id)
        tenant_chroma_dir = os.path.join(settings.chroma_db_path, tenant_id)
        
        os.makedirs(tenant_upload_dir, exist_ok=True)
        os.makedirs(tenant_chroma_dir, exist_ok=True)
    
    @staticmethod
    def update_tenant_config(
        db: Session,
        tenant_id: str,
        **kwargs
    ) -> Optional[Tenant]:
        """Update tenant configuration"""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return None
        
        # Update allowed fields
        allowed_fields = [
            'name', 'domain', 'max_documents', 'max_chat_messages',
            'max_storage_mb', 'features_enabled', 'is_active'
        ]
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'features_enabled' and isinstance(value, list):
                    setattr(tenant, field, json.dumps(value))
                else:
                    setattr(tenant, field, value)
        
        db.commit()
        db.refresh(tenant)
        return tenant
    
    @staticmethod
    def regenerate_api_key(db: Session, tenant_id: str) -> Optional[str]:
        """Regenerate API key for a tenant"""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return None
        
        new_api_key = f"sk_{uuid.uuid4().hex[:32]}"
        tenant.api_key = new_api_key
        db.commit()
        
        return new_api_key
    
    @staticmethod
    def get_tenant_usage(db: Session, tenant_id: str) -> Dict[str, Any]:
        """Get current usage statistics for a tenant"""
        from database import Document, ChatMessage, ChatSession
        
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return {}
        
        # Count documents
        doc_count = db.query(Document).filter(Document.tenant_id == tenant_id).count()
        
        # Count chat messages
        message_count = db.query(ChatMessage).filter(ChatMessage.tenant_id == tenant_id).count()
        
        # Count chat sessions
        session_count = db.query(ChatSession).filter(ChatSession.tenant_id == tenant_id).count()
        
        # Calculate storage usage (simplified - would need actual file size calculation)
        storage_usage_mb = doc_count * 0.1  # Rough estimate
        
        return {
            "tenant_id": tenant_id,
            "tenant_name": tenant.name,
            "limits": {
                "max_documents": tenant.max_documents,
                "max_chat_messages": tenant.max_chat_messages,
                "max_storage_mb": tenant.max_storage_mb
            },
            "usage": {
                "documents": doc_count,
                "chat_messages": message_count,
                "chat_sessions": session_count,
                "storage_mb": storage_usage_mb
            },
            "features_enabled": json.loads(tenant.features_enabled) if tenant.features_enabled else []
        }
    
    @staticmethod
    def check_tenant_limits(db: Session, tenant_id: str, resource_type: str, amount: int = 1) -> bool:
        """Check if tenant has capacity for the requested resource"""
        usage = TenantProvisioning.get_tenant_usage(db, tenant_id)
        
        if resource_type == "documents":
            return usage["usage"]["documents"] + amount <= usage["limits"]["max_documents"]
        elif resource_type == "chat_messages":
            return usage["usage"]["chat_messages"] + amount <= usage["limits"]["max_chat_messages"]
        elif resource_type == "storage":
            return usage["usage"]["storage_mb"] + amount <= usage["limits"]["max_storage_mb"]
        
        return True
    
    @staticmethod
    def list_tenants(db: Session, active_only: bool = True) -> list[Tenant]:
        """List all tenants"""
        query = db.query(Tenant)
        if active_only:
            query = query.filter(Tenant.is_active == True)
        return query.all()
    
    @staticmethod
    def delete_tenant(db: Session, tenant_id: str) -> bool:
        """Delete a tenant and all associated data"""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return False
        
        # Delete associated data
        from database import Document, ChatMessage, ChatSession
        
        db.query(Document).filter(Document.tenant_id == tenant_id).delete()
        db.query(ChatMessage).filter(ChatMessage.tenant_id == tenant_id).delete()
        db.query(ChatSession).filter(ChatSession.tenant_id == tenant_id).delete()
        
        # Delete tenant
        db.delete(tenant)
        db.commit()
        
        # Clean up directories
        TenantProvisioning._cleanup_tenant_directories(tenant_id)
        
        return True
    
    @staticmethod
    def _cleanup_tenant_directories(tenant_id: str):
        """Clean up tenant-specific directories"""
        import shutil
        
        tenant_upload_dir = os.path.join(settings.upload_dir, tenant_id)
        tenant_chroma_dir = os.path.join(settings.chroma_db_path, tenant_id)
        
        if os.path.exists(tenant_upload_dir):
            shutil.rmtree(tenant_upload_dir)
        
        if os.path.exists(tenant_chroma_dir):
            shutil.rmtree(tenant_chroma_dir) 