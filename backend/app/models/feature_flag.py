"""
Feature Flag Model
Feature flags for gradual rollouts and A/B testing
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON, Float
from sqlalchemy.orm import relationship

from app.core.database import Base


class FeatureFlag(Base):
    """Feature flag model"""
    
    __tablename__ = "feature_flags"
    __table_args__ = (
        Index("idx_feature_flags_key", "key", unique=True),
        Index("idx_feature_flags_enabled", "enabled"),
        Index("idx_feature_flags_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True, index=True)  # e.g., 'new_dashboard', 'beta_feature'
    name = Column(String(200), nullable=False)  # Human-readable name
    description = Column(Text, nullable=True)
    
    # Flag state
    enabled = Column(Boolean, default=False, nullable=False, index=True)
    
    # Rollout configuration
    rollout_percentage = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    target_users = Column(JSON, nullable=True)  # List of user IDs or user segments
    target_teams = Column(JSON, nullable=True)  # List of team IDs
    
    # A/B testing
    is_ab_test = Column(Boolean, default=False, nullable=False)
    variants = Column(JSON, nullable=True)  # Variant configuration
    
    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    created_by = relationship("User", backref="feature_flags")
    
    def __repr__(self) -> str:
        return f"<FeatureFlag(id={self.id}, key={self.key}, enabled={self.enabled}, rollout_percentage={self.rollout_percentage})>"


class FeatureFlagLog(Base):
    """Log of feature flag evaluations"""
    
    __tablename__ = "feature_flag_logs"
    __table_args__ = (
        Index("idx_feature_flag_logs_flag", "flag_id"),
        Index("idx_feature_flag_logs_user", "user_id"),
        Index("idx_feature_flag_logs_timestamp", "timestamp"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(Integer, ForeignKey("feature_flags.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Evaluation result
    enabled = Column(Boolean, nullable=False)
    variant = Column(String(50), nullable=True)  # A/B test variant if applicable
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    flag = relationship("FeatureFlag", backref="logs")
    user = relationship("User", backref="feature_flag_logs")
    
    def __repr__(self) -> str:
        return f"<FeatureFlagLog(id={self.id}, flag_id={self.flag_id}, user_id={self.user_id}, enabled={self.enabled})>"

