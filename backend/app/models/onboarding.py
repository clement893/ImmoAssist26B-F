"""
Onboarding Model
User onboarding steps and progress
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class OnboardingStep(Base):
    """Onboarding step definition"""
    
    __tablename__ = "onboarding_steps"
    __table_args__ = (
        Index("idx_onboarding_steps_key", "key", unique=True),
        Index("idx_onboarding_steps_active", "is_active"),
        Index("idx_onboarding_steps_order", "order"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True, index=True)  # e.g., 'welcome', 'profile_setup', 'first_project'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, index=True)  # Display order
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Step configuration
    step_type = Column(String(50), nullable=False)  # 'info', 'form', 'action', 'tutorial'
    step_data = Column(JSON, nullable=True)  # Additional configuration
    
    # Targeting
    target_roles = Column(Text, nullable=True)  # JSON array of role names
    required = Column(Boolean, default=False, nullable=False)  # Must complete to proceed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    def __repr__(self) -> str:
        return f"<OnboardingStep(id={self.id}, key={self.key}, order={self.order})>"


class UserOnboarding(Base):
    """User onboarding progress"""
    
    __tablename__ = "user_onboarding"
    __table_args__ = (
        Index("idx_user_onboarding_user", "user_id"),
        Index("idx_user_onboarding_completed", "completed_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Progress
    current_step_key = Column(String(100), nullable=True)  # Current step user is on
    completed_steps = Column(JSON, nullable=True)  # List of completed step keys
    skipped_steps = Column(JSON, nullable=True)  # List of skipped step keys
    
    # Status
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Metadata
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="onboarding")
    
    def __repr__(self) -> str:
        return f"<UserOnboarding(id={self.id}, user_id={self.user_id}, is_completed={self.is_completed})>"




