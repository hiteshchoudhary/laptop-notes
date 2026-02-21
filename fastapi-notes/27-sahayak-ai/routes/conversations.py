"""
Conversation Routes
-------------------
Endpoints for managing conversation history.
- GET /conversations           — List all conversations
- GET /conversations/{id}      — Get a conversation with its messages
- DELETE /conversations/{id}   — Delete a conversation
"""

from fastapi import APIRouter, HTTPException, Request

from models import ConversationDetail, ConversationSummary

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=list[ConversationSummary])
async def list_conversations(request: Request) -> list[ConversationSummary]:
    """List all conversations, newest first."""
    from database import get_all_conversations

    engine = request.app.state.engine
    conversations = get_all_conversations(engine)

    return [
        ConversationSummary(
            id=conv.id,
            title=conv.title,
            message_count=conv.message_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )
        for conv in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    request: Request, conversation_id: str
) -> ConversationDetail:
    """Get a single conversation with all its messages."""
    from database import get_conversation_by_id, get_messages_for_conversation

    engine = request.app.state.engine
    conversation = get_conversation_by_id(engine, conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = get_messages_for_conversation(engine, conversation_id)
    message_list = [
        {
            "role": msg.role,
            "content": msg.content,
            "tool_name": msg.tool_name,
            "tool_args": msg.tool_args,
            "created_at": msg.created_at,
        }
        for msg in messages
    ]

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        messages=message_list,
        message_count=conversation.message_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


@router.delete("/{conversation_id}")
async def delete_conversation_endpoint(
    request: Request, conversation_id: str
) -> dict:
    """Delete a conversation and all its messages."""
    from database import delete_conversation

    engine = request.app.state.engine
    deleted = delete_conversation(engine, conversation_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Conversation deleted", "id": conversation_id}
