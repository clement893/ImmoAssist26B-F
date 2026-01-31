"""
Léa AI Service
Intelligent AI assistant service with database access capabilities
"""

import json
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.services.ai_service import AIService, AIProvider
from app.models.lea_conversation import LeaConversation, LeaToolUsage
from app.models.user import User
from app.models.company import Company
from app.models.contact import Contact
from app.core.logging import logger


class LeaService:
    """Léa AI Assistant Service with database access"""
    
    # System prompt for Léa
    SYSTEM_PROMPT = """Tu es Léa, une assistante AI intelligente et amicale spécialisée dans l'immobilier.
Tu aides les utilisateurs à gérer leur activité immobilière en répondant à leurs questions et en accédant à la base de données.

Règles importantes:
- Sois toujours polie, professionnelle et utile
- Réponds en français sauf demande contraire
- Utilise les fonctions disponibles pour accéder à la base de données quand nécessaire
- Formate tes réponses de manière claire et structurée
- Si tu ne connais pas quelque chose, dis-le honnêtement
- Pour les listes, limite-toi à 5-10 éléments maximum
"""

    def __init__(self, db: AsyncSession, user_id: int, provider: AIProvider = AIProvider.AUTO):
        """
        Initialize Léa service.
        
        Args:
            db: Database session
            user_id: Current user ID
            provider: AI provider to use
        """
        self.db = db
        self.user_id = user_id
        self.ai_service = AIService(provider=provider)
        self.tools = self._get_tools()
    
    def _get_tools(self) -> List[Dict[str, Any]]:
        """Get available tools/functions for Léa"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "search_agents",
                    "description": "Rechercher des agents immobiliers par nom, email, agence ou statut",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Terme de recherche (nom, email, agence)"
                            },
                            "is_active": {
                                "type": "boolean",
                                "description": "Filtrer par statut actif/inactif"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_agent_info",
                    "description": "Obtenir les informations détaillées d'un agent immobilier",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "agent_id": {
                                "type": "integer",
                                "description": "ID de l'agent"
                            },
                            "email": {
                                "type": "string",
                                "description": "Email de l'agent (alternative à agent_id)"
                            }
                        }
                    },
                    "required": []
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_contacts",
                    "description": "Rechercher des contacts dans la base de données",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Terme de recherche (nom, email, entreprise)"
                            },
                            "company_id": {
                                "type": "integer",
                                "description": "Filtrer par entreprise"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_companies",
                    "description": "Rechercher des entreprises",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Terme de recherche (nom, ville)"
                            },
                            "is_client": {
                                "type": "boolean",
                                "description": "Filtrer par statut client"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_user_statistics",
                    "description": "Obtenir des statistiques sur l'activité de l'utilisateur",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "period": {
                                "type": "string",
                                "enum": ["today", "week", "month", "year", "all"],
                                "description": "Période pour les statistiques"
                            }
                        }
                    }
                }
            },
        ]
    
    async def get_or_create_conversation(self, session_id: Optional[str] = None) -> LeaConversation:
        """Get or create a conversation session"""
        if session_id:
            result = await self.db.execute(
                select(LeaConversation)
                .where(LeaConversation.session_id == session_id)
                .where(LeaConversation.user_id == self.user_id)
            )
            conversation = result.scalar_one_or_none()
            if conversation:
                return conversation
        
        # Create new conversation
        new_session_id = session_id or str(uuid.uuid4())
        conversation = LeaConversation(
            user_id=self.user_id,
            session_id=new_session_id,
            messages=[],
            context={}
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation
    
    async def chat(
        self,
        user_message: str,
        session_id: Optional[str] = None,
        conversation: Optional[LeaConversation] = None
    ) -> Dict[str, Any]:
        """
        Chat with Léa.
        
        Args:
            user_message: User's message
            session_id: Optional session ID
            conversation: Optional existing conversation object
            
        Returns:
            Response dict with content, tool_calls, etc.
        """
        # Get or create conversation
        if not conversation:
            conversation = await self.get_or_create_conversation(session_id)
        
        # Build messages from conversation history
        messages = conversation.messages.copy() if conversation.messages else []
        
        # Add user message
        messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Call AI with tools
        try:
            # For OpenAI, we need to handle function calling
            if self.ai_service.provider == AIProvider.OPENAI:
                response = await self._chat_with_openai_tools(messages)
            else:
                # For Anthropic, use tools parameter
                response = await self._chat_with_anthropic_tools(messages)
            
            # Process tool calls if any
            if response.get("tool_calls"):
                tool_results = await self._execute_tools(response["tool_calls"])
                
                # Add assistant message with tool calls
                messages.append({
                    "role": "assistant",
                    "content": response.get("content", ""),
                    "tool_calls": response["tool_calls"],
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Add tool results
                for tool_result in tool_results:
                    messages.append({
                        "role": "tool",
                        "content": json.dumps(tool_result["result"]),
                        "tool_call_id": tool_result["tool_call_id"],
                        "name": tool_result["name"],
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Get final response
                if self.ai_service.provider == AIProvider.OPENAI:
                    final_response = await self._chat_with_openai_tools(messages)
                else:
                    final_response = await self._chat_with_anthropic_tools(messages)
                
                response = final_response
            
            # Add assistant response to messages
            messages.append({
                "role": "assistant",
                "content": response["content"],
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Update conversation
            conversation.messages = messages
            conversation.updated_at = datetime.utcnow()
            await self.db.commit()
            
            return {
                "content": response["content"],
                "session_id": conversation.session_id,
                "model": response.get("model"),
                "provider": response.get("provider"),
                "usage": response.get("usage", {})
            }
            
        except Exception as e:
            logger.error(f"Error in Léa chat: {e}", exc_info=True)
            raise
    
    async def _chat_with_openai_tools(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Chat with OpenAI using function calling"""
        # Prepare messages (remove timestamp for API)
        api_messages = [
            {k: v for k, v in msg.items() if k != "timestamp"}
            for msg in messages
        ]
        
        # Add system prompt
        if not api_messages or api_messages[0].get("role") != "system":
            api_messages.insert(0, {"role": "system", "content": self.SYSTEM_PROMPT})
        
        response = await self.ai_service.client.chat.completions.create(
            model=self.ai_service.model,
            messages=api_messages,
            tools=self.tools,
            tool_choice="auto",
            temperature=self.ai_service.temperature,
            max_tokens=self.ai_service.max_tokens,
        )
        
        message = response.choices[0].message
        tool_calls = []
        
        if message.tool_calls:
            for tool_call in message.tool_calls:
                tool_calls.append({
                    "id": tool_call.id,
                    "type": tool_call.type,
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    }
                })
        
        return {
            "content": message.content or "",
            "tool_calls": tool_calls,
            "model": response.model,
            "provider": "openai",
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        }
    
    async def _chat_with_anthropic_tools(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Chat with Anthropic using tools"""
        # Convert messages format for Anthropic
        anthropic_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            if role == "system":
                continue  # System handled separately
            if role == "tool":
                # Anthropic uses assistant role with tool_use content for tool results
                # Format: {"role": "assistant", "content": [{"type": "tool_result", ...}]}
                tool_call_id = msg.get("tool_call_id", "")
                tool_result = json.loads(msg.get("content", "{}"))
                anthropic_messages.append({
                    "role": "assistant",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": tool_call_id,
                        "content": json.dumps(tool_result)
                    }]
                })
            else:
                anthropic_messages.append({
                    "role": role,
                    "content": msg.get("content", "")
                })
        
        # Convert tools to Anthropic format
        anthropic_tools = [self._convert_tool_to_anthropic(tool) for tool in self.tools]
        
        response = await self.ai_service.client.messages.create(
            model=self.ai_service.model,
            max_tokens=self.ai_service.max_tokens,
            temperature=self.ai_service.temperature,
            system=self.SYSTEM_PROMPT,
            messages=anthropic_messages,
            tools=anthropic_tools if anthropic_tools else None,
        )
        
        content = ""
        tool_calls = []
        
        if response.content:
            for block in response.content:
                if block.type == "text":
                    content += block.text
                elif block.type == "tool_use":
                    tool_calls.append({
                        "id": block.id,
                        "type": "function",
                        "function": {
                            "name": block.name,
                            "arguments": json.dumps(block.input)
                        }
                    })
        
        return {
            "content": content,
            "tool_calls": tool_calls,
            "model": response.model,
            "provider": "anthropic",
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            }
        }
    
    def _convert_tool_to_anthropic(self, tool: Dict[str, Any]) -> Dict[str, Any]:
        """Convert OpenAI tool format to Anthropic format"""
        func_def = tool["function"]
        return {
            "name": func_def["name"],
            "description": func_def["description"],
            "input_schema": func_def["parameters"]
        }
    
    async def _execute_tools(self, tool_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute tool calls and return results"""
        results = []
        
        for tool_call in tool_calls:
            tool_name = tool_call["function"]["name"]
            tool_args = json.loads(tool_call["function"]["arguments"])
            tool_call_id = tool_call.get("id", "")
            
            start_time = datetime.utcnow()
            
            try:
                # Execute tool
                if tool_name == "search_agents":
                    result = await self._search_agents(**tool_args)
                elif tool_name == "get_agent_info":
                    result = await self._get_agent_info(**tool_args)
                elif tool_name == "search_contacts":
                    result = await self._search_contacts(**tool_args)
                elif tool_name == "search_companies":
                    result = await self._search_companies(**tool_args)
                elif tool_name == "get_user_statistics":
                    result = await self._get_user_statistics(**tool_args)
                else:
                    result = {"error": f"Unknown tool: {tool_name}"}
                
                execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                # Log tool usage
                # Note: We'll need conversation_id, but for now we'll skip logging
                # This can be added when we have the conversation object
                
                results.append({
                    "tool_call_id": tool_call_id,
                    "name": tool_name,
                    "result": result
                })
                
            except Exception as e:
                logger.error(f"Error executing tool {tool_name}: {e}", exc_info=True)
                results.append({
                    "tool_call_id": tool_call_id,
                    "name": tool_name,
                    "result": {"error": str(e)}
                })
        
        return results
    
    async def _search_agents(self, query: Optional[str] = None, is_active: Optional[bool] = None) -> Dict[str, Any]:
        """Search for agents"""
        # Note: This assumes an "agents" table exists
        # For now, we'll search in users table as a placeholder
        # TODO: Create actual agents table/model
        
        stmt = select(User).where(User.id == self.user_id)  # Placeholder
        
        if query:
            stmt = stmt.where(
                or_(
                    User.first_name.ilike(f"%{query}%"),
                    User.last_name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%")
                )
            )
        
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        
        result = await self.db.execute(stmt)
        users = result.scalars().all()
        
        return {
            "count": len(users),
            "agents": [
                {
                    "id": user.id,
                    "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
                    "email": user.email,
                    "is_active": user.is_active
                }
                for user in users[:10]  # Limit to 10
            ]
        }
    
    async def _get_agent_info(self, agent_id: Optional[int] = None, email: Optional[str] = None) -> Dict[str, Any]:
        """Get agent information"""
        # Placeholder - TODO: Use actual agents table
        if agent_id:
            result = await self.db.execute(select(User).where(User.id == agent_id))
        elif email:
            result = await self.db.execute(select(User).where(User.email == email))
        else:
            return {"error": "agent_id or email required"}
        
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "Agent not found"}
        
        return {
            "id": user.id,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
            "email": user.email,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    
    async def _search_contacts(self, query: Optional[str] = None, company_id: Optional[int] = None) -> Dict[str, Any]:
        """Search contacts"""
        try:
            stmt = select(Contact)
            
            if query:
                stmt = stmt.where(
                    or_(
                        Contact.first_name.ilike(f"%{query}%"),
                        Contact.last_name.ilike(f"%{query}%"),
                        Contact.email.ilike(f"%{query}%")
                    )
                )
            
            if company_id:
                stmt = stmt.where(Contact.company_id == company_id)
            
            result = await self.db.execute(stmt)
            contacts = result.scalars().all()
            
            return {
                "count": len(contacts),
                "contacts": [
                    {
                        "id": contact.id,
                        "name": f"{contact.first_name or ''} {contact.last_name or ''}".strip(),
                        "email": contact.email,
                        "phone": contact.phone,
                        "company": contact.company.name if contact.company else None
                    }
                    for contact in contacts[:10]
                ]
            }
        except Exception as e:
            logger.error(f"Error searching contacts: {e}")
            return {"error": str(e), "count": 0, "contacts": []}
    
    async def _search_companies(self, query: Optional[str] = None, is_client: Optional[bool] = None) -> Dict[str, Any]:
        """Search companies"""
        try:
            stmt = select(Company)
            
            if query:
                stmt = stmt.where(
                    or_(
                        Company.name.ilike(f"%{query}%"),
                        Company.city.ilike(f"%{query}%")
                    )
                )
            
            if is_client is not None:
                stmt = stmt.where(Company.is_client == is_client)
            
            result = await self.db.execute(stmt)
            companies = result.scalars().all()
            
            return {
                "count": len(companies),
                "companies": [
                    {
                        "id": company.id,
                        "name": company.name,
                        "city": company.city,
                        "email": company.email,
                        "is_client": company.is_client
                    }
                    for company in companies[:10]
                ]
            }
        except Exception as e:
            logger.error(f"Error searching companies: {e}")
            return {"error": str(e), "count": 0, "companies": []}
    
    async def _get_user_statistics(self, period: str = "month") -> Dict[str, Any]:
        """Get user statistics"""
        # Placeholder statistics
        # TODO: Implement actual statistics based on period
        return {
            "period": period,
            "total_agents": 0,  # TODO: Count from agents table
            "total_contacts": 0,  # TODO: Count contacts
            "total_companies": 0,  # TODO: Count companies
            "message": "Statistiques à implémenter"
        }
