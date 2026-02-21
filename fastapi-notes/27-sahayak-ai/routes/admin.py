"""
Admin Routes
------------
Monitoring and usage statistics endpoints for administrators.
- GET /admin/stats   — Overall usage statistics
- GET /admin/usage   — Daily usage for the last 30 days
- GET /admin/tools   — Tool call frequency breakdown
"""

import time

from fastapi import APIRouter, Request
from sqlmodel import Session, func, select

from database import Conversation, Message, UsageLog
from models import AdminStats, DailyUsage, ToolUsageStats

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
async def get_stats(request: Request) -> AdminStats:
    """Get overall usage statistics."""
    engine = request.app.state.engine
    app_start_time: float = request.app.state.start_time

    with Session(engine) as session:
        # Count conversations
        total_conversations = session.exec(
            select(func.count()).select_from(Conversation)
        ).one()

        # Count messages
        total_messages = session.exec(
            select(func.count()).select_from(Message)
        ).one()

        # Count tool calls (messages with role='tool')
        total_tool_calls = session.exec(
            select(func.count())
            .select_from(Message)
            .where(Message.role == "tool")
        ).one()

        # Average response time from usage logs
        avg_time_result = session.exec(
            select(func.avg(UsageLog.response_time_ms))
        ).one()
        avg_response_time = float(avg_time_result) if avg_time_result else 0.0

    uptime = time.monotonic() - app_start_time

    return AdminStats(
        total_conversations=total_conversations or 0,
        total_messages=total_messages or 0,
        total_tool_calls=total_tool_calls or 0,
        avg_response_time_ms=round(avg_response_time, 2),
        uptime_seconds=round(uptime, 2),
    )


@router.get("/usage", response_model=list[DailyUsage])
async def get_daily_usage(request: Request) -> list[DailyUsage]:
    """Get daily usage data for the last 30 days.

    Returns request count and tool call count per day.
    """
    engine = request.app.state.engine

    with Session(engine) as session:
        # SQLite date extraction: substr(created_at, 1, 10) gives YYYY-MM-DD
        statement = select(UsageLog).order_by(
            UsageLog.created_at.desc()  # type: ignore[union-attr]
        )
        logs = list(session.exec(statement).all())

    # Aggregate by date
    daily: dict[str, dict] = {}
    for log in logs:
        date_str = log.created_at[:10] if log.created_at else "unknown"
        if date_str not in daily:
            daily[date_str] = {"request_count": 0, "tool_calls_count": 0}
        daily[date_str]["request_count"] += 1
        daily[date_str]["tool_calls_count"] += log.tool_calls_count

    # Sort by date descending, limit to 30 days
    sorted_dates = sorted(daily.keys(), reverse=True)[:30]

    return [
        DailyUsage(
            date=date,
            request_count=daily[date]["request_count"],
            tool_calls_count=daily[date]["tool_calls_count"],
        )
        for date in sorted_dates
    ]


@router.get("/tools", response_model=list[ToolUsageStats])
async def get_tool_stats(request: Request) -> list[ToolUsageStats]:
    """Get tool call frequency and performance statistics.

    Shows how often each tool is called, average duration, and error count.
    """
    engine = request.app.state.engine

    with Session(engine) as session:
        # Get all tool messages
        statement = select(Message).where(Message.role == "tool")
        tool_messages = list(session.exec(statement).all())

        # Get all usage logs that mention tools
        log_statement = select(UsageLog).where(UsageLog.tools_used != "")
        usage_logs = list(session.exec(log_statement).all())

    # Aggregate tool call counts from messages
    tool_counts: dict[str, dict] = {}
    for msg in tool_messages:
        name = msg.tool_name or "unknown"
        if name not in tool_counts:
            tool_counts[name] = {
                "call_count": 0,
                "total_duration_ms": 0.0,
                "error_count": 0,
            }
        tool_counts[name]["call_count"] += 1
        if msg.content and msg.content.startswith("Error"):
            tool_counts[name]["error_count"] += 1

    # Enrich with duration data from usage logs
    tool_durations: dict[str, list[float]] = {}
    for log in usage_logs:
        if log.tools_used:
            tools = log.tools_used.split(",")
            per_tool_time = log.response_time_ms / max(len(tools), 1)
            for tool_name in tools:
                tool_name = tool_name.strip()
                if tool_name:
                    if tool_name not in tool_durations:
                        tool_durations[tool_name] = []
                    tool_durations[tool_name].append(per_tool_time)

    # Build response
    results = []
    all_tool_names = set(tool_counts.keys()) | set(tool_durations.keys())
    for name in sorted(all_tool_names):
        counts = tool_counts.get(name, {"call_count": 0, "error_count": 0})
        durations = tool_durations.get(name, [])
        avg_duration = sum(durations) / len(durations) if durations else 0.0

        results.append(
            ToolUsageStats(
                tool_name=name,
                call_count=counts["call_count"],
                avg_duration_ms=round(avg_duration, 2),
                error_count=counts["error_count"],
            )
        )

    # Sort by call count descending
    results.sort(key=lambda x: x.call_count, reverse=True)
    return results
