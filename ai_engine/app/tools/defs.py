"""Function-calling schema (OpenAI/Groq format) + executors. Player state is passed per request."""
from ..rag import hybrid
TOOLS = [{"type": "function", "function": {"name": n, "description": d, "parameters": p}} for n, d, p in [
    ("fetch_player_stats", "Get the player's accuracy, top score and rank.", {"type": "object", "properties": {}}),
    ("claim_daily_reward", "Claim the daily continuous-play bonus.", {"type": "object", "properties": {}}),
    ("trigger_custom_challenge", "Start an AI-customised challenge.", {"type": "object", "properties": {"difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]}}, "required": ["difficulty"]}),
    ("query_knowledge_base", "Answer game rules/strategy questions via RAG.", {"type": "object", "properties": {"question": {"type": "string"}}, "required": ["question"]})]]

def run(name: str, args: dict, player: dict) -> str:
    if name == "fetch_player_stats": return str(player)
    if name == "claim_daily_reward": return "Daily reward claimed: +100 points."
    if name == "trigger_custom_challenge": return f"Challenge ({args.get('difficulty','medium')}) queued for the next round."
    if name == "query_knowledge_base": return "\n".join(hybrid.search(args.get("question", "")))
    return "unknown tool"
