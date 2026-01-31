"""
Team Model
SQLAlchemy model for teams/organizations
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Team(Base):
    """Team/Organization model"""
    __tablename__ = "teams"
    __table_args__ = (
        Index("idx_teams_name", "name"),
        Index("idx_teams_slug", "slug"),
        Index("idx_teams_owner", "owner_id"),
        Index("idx_teams_is_active", "is_active"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)  # URL-friendly identifier
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    settings = Column(Text, nullable=True)  # JSON string for team settings
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="team", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name={self.name}, slug={self.slug})>"


class TeamMember(Base):
    """Team membership model with role"""
    __tablename__ = "team_members"
    __table_args__ = (
        Index("idx_team_members_team", "team_id"),
        Index("idx_team_members_user", "user_id"),
        Index("idx_team_members_role", "role_id"),
        Index("idx_team_members_unique", "team_id", "user_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")
    role = relationship("Role", back_populates="team_members")

    def __repr__(self) -> str:
        return f"<TeamMember(team_id={self.team_id}, user_id={self.user_id}, role_id={self.role_id})>"

